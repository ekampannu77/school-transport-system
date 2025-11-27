import pandas as pd
import requests
import json
from datetime import datetime

def parse_date(date_str):
    """Parse date from Excel format"""
    if pd.isna(date_str) or not date_str or str(date_str).strip() == '':
        return None

    date_str = str(date_str).strip()

    # Try different date formats
    formats = ['%d.%m.%Y', '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y']

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
        except:
            continue

    # If nothing works, return None
    print(f"  ⚠️  Could not parse date: {date_str}")
    return None

def normalize_registration_number(reg_no):
    """Normalize registration number format to match database (with spaces)"""
    if not reg_no:
        return None
    # Convert RJ-13-PA-4035 to RJ 13 PA 4035
    normalized = str(reg_no).strip().upper()
    normalized = normalized.replace('-', ' ')
    # Remove extra spaces
    normalized = ' '.join(normalized.split())
    return normalized

def main():
    # Read Excel file - Sheet2 has bus details
    print("=" * 70)
    print("IMPORTING BUSES FROM EXCEL FILE")
    print("=" * 70)

    df = pd.read_excel('/Users/ekampannu7/Desktop/Vehicle Details.xlsx', sheet_name='Sheet2', header=None)

    # Extract bus data (rows 3-28, similar to drivers)
    excel_buses = []
    for i in range(3, 29):
        if i < len(df) and pd.notna(df.iloc[i, 1]):
            bus_no = str(df.iloc[i, 1]).strip() if pd.notna(df.iloc[i, 1]) else None
            driver_name = str(df.iloc[i, 2]).strip() if pd.notna(df.iloc[i, 2]) else None
            chassis_no = str(df.iloc[i, 3]).strip() if pd.notna(df.iloc[i, 3]) else None
            seating = df.iloc[i, 4]
            reg_date = df.iloc[i, 5]
            validity = df.iloc[i, 6]

            if bus_no and bus_no not in ['NaN', '']:
                # Clean up data
                if chassis_no and chassis_no in ['NaN', '']:
                    chassis_no = None

                # Parse dates
                reg_date_parsed = parse_date(reg_date)
                validity_parsed = parse_date(validity)

                # Parse seating capacity
                try:
                    seating_capacity = int(float(seating)) if pd.notna(seating) else None
                except:
                    seating_capacity = None

                excel_buses.append({
                    'busNo': normalize_registration_number(bus_no),
                    'driverName': driver_name,
                    'chassisNo': chassis_no,
                    'seatingCapacity': seating_capacity,
                    'registrationDate': reg_date_parsed,
                    'validity': validity_parsed
                })

    print(f"\nFound {len(excel_buses)} buses in Excel file\n")

    # Fetch existing buses from database
    try:
        response = requests.get('http://localhost:3000/api/fleet/buses', timeout=10)
        if response.status_code != 200:
            print(f"Error fetching buses: {response.status_code}")
            return

        db_buses = response.json()
        db_buses_map = {normalize_registration_number(b['registrationNumber']): b for b in db_buses}

        print(f"Found {len(db_buses)} buses in database\n")

        # Fetch all drivers to map driver names to IDs
        drivers_response = requests.get('http://localhost:3000/api/drivers', timeout=10)
        if drivers_response.status_code != 200:
            print(f"Error fetching drivers: {drivers_response.status_code}")
            return

        db_drivers = drivers_response.json()
        drivers_map = {d['name'].lower().strip(): d['id'] for d in db_drivers}

        # Add common name variations
        name_variations = {
            'sampuran singh': 'sampooran singh',
            'omparkash': 'om parkash',
            'om parkash': 'om parkash',
        }

        def find_driver_id(driver_name):
            if not driver_name:
                return None
            driver_name_lower = driver_name.lower().strip()

            # Try exact match first
            if driver_name_lower in drivers_map:
                return drivers_map[driver_name_lower]

            # Try variations
            if driver_name_lower in name_variations:
                alt_name = name_variations[driver_name_lower]
                if alt_name in drivers_map:
                    return drivers_map[alt_name]

            # Try without spaces
            driver_name_no_space = driver_name_lower.replace(' ', '')
            for db_name, driver_id in drivers_map.items():
                if db_name.replace(' ', '') == driver_name_no_space:
                    return driver_id

            return None

        added_count = 0
        updated_count = 0
        skipped_count = 0

        for excel_bus in excel_buses:
            bus_no_normalized = normalize_registration_number(excel_bus['busNo'])

            # Find driver ID using improved matching
            driver_id = find_driver_id(excel_bus['driverName'])
            if excel_bus['driverName'] and not driver_id:
                print(f"⚠️  Driver not found for bus {excel_bus['busNo']}: {excel_bus['driverName']}")

            if bus_no_normalized in db_buses_map:
                # Bus exists - check if we need to update
                db_bus = db_buses_map[bus_no_normalized]
                updates = {}

                # Check each field and update if missing or different in DB
                # Note: Only update chassisNumber if it's missing, not if it's different
                # because existing data might be correct
                if excel_bus['chassisNo'] and not db_bus.get('chassisNumber'):
                    updates['chassisNumber'] = excel_bus['chassisNo']

                if excel_bus['seatingCapacity'] and not db_bus.get('seatingCapacity'):
                    updates['seatingCapacity'] = excel_bus['seatingCapacity']

                if excel_bus['registrationDate'] and not db_bus.get('purchaseDate'):
                    updates['purchaseDate'] = excel_bus['registrationDate']

                if excel_bus['validity'] and not db_bus.get('fitnessExpiry'):
                    updates['fitnessExpiry'] = excel_bus['validity']

                # Only update driver if there's no driver currently assigned
                if driver_id and not db_bus.get('primaryDriverId'):
                    updates['primaryDriverId'] = driver_id

                if updates:
                    # Update bus
                    print(f"📝 Updating {excel_bus['busNo']}...")
                    updates['id'] = db_bus['id']

                    # Include existing required fields
                    if 'chassisNumber' not in updates:
                        updates['chassisNumber'] = db_bus.get('chassisNumber')
                    if 'seatingCapacity' not in updates:
                        updates['seatingCapacity'] = db_bus.get('seatingCapacity')
                    if 'purchaseDate' not in updates:
                        updates['purchaseDate'] = db_bus.get('purchaseDate')
                    if 'registrationNumber' not in updates:
                        updates['registrationNumber'] = db_bus.get('registrationNumber')

                    update_response = requests.put(
                        f"http://localhost:3000/api/fleet/buses",
                        json=updates,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )

                    if update_response.status_code == 200:
                        update_fields = [k for k in updates.keys() if k not in ['id', 'chassisNumber', 'seatingCapacity', 'purchaseDate', 'registrationNumber']]
                        if update_fields:
                            print(f"   ✓ Updated with: {', '.join(update_fields)}")
                        updated_count += 1
                    else:
                        print(f"   ✗ Error updating: {update_response.text}")
                else:
                    print(f"✓ {excel_bus['busNo']} - already complete")
                    skipped_count += 1
            else:
                # Bus doesn't exist - add new
                print(f"➕ Adding {excel_bus['busNo']}...")

                # Validate required fields
                if not excel_bus['chassisNo']:
                    print(f"   ⚠️  Skipping - missing chassis number")
                    continue

                if not excel_bus['seatingCapacity']:
                    print(f"   ⚠️  Skipping - missing seating capacity")
                    continue

                if not excel_bus['registrationDate']:
                    print(f"   ⚠️  Skipping - missing registration date")
                    continue

                new_bus = {
                    'registrationNumber': bus_no_normalized,
                    'chassisNumber': excel_bus['chassisNo'],
                    'seatingCapacity': excel_bus['seatingCapacity'],
                    'purchaseDate': excel_bus['registrationDate'],
                }

                # Check if driver is already assigned to another bus
                driver_already_assigned = False
                if driver_id:
                    for existing_bus in db_buses:
                        if existing_bus.get('primaryDriverId') == driver_id:
                            print(f"   ⚠️  Driver {excel_bus['driverName']} already assigned to {existing_bus.get('registrationNumber')}")
                            driver_already_assigned = True
                            break

                    if not driver_already_assigned:
                        new_bus['primaryDriverId'] = driver_id

                if excel_bus['validity']:
                    new_bus['fitnessExpiry'] = excel_bus['validity']

                print(f"   Chassis: {excel_bus['chassisNo']}")
                print(f"   Capacity: {excel_bus['seatingCapacity']}")
                if driver_id and not driver_already_assigned:
                    print(f"   Driver: {excel_bus['driverName']}")

                add_response = requests.post(
                    'http://localhost:3000/api/fleet/buses',
                    json=new_bus,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )

                if add_response.status_code in [200, 201]:
                    print(f"   ✓ Successfully added")
                    added_count += 1
                else:
                    print(f"   ✗ Error adding: {add_response.text}")
                    print(f"   Data sent: {json.dumps(new_bus, indent=2)}")

        print("\n" + "=" * 70)
        print("IMPORT SUMMARY")
        print("=" * 70)
        print(f"✓ Buses already complete: {skipped_count}")
        print(f"📝 Buses updated: {updated_count}")
        print(f"➕ New buses added: {added_count}")
        print(f"\nTotal processed: {len(excel_buses)}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
