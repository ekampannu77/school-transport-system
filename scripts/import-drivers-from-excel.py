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

def main():
    # Read Excel file
    print("=" * 70)
    print("IMPORTING DRIVERS FROM EXCEL FILE")
    print("=" * 70)

    df = pd.read_excel('/Users/ekampannu7/Desktop/Vehicle Details.xlsx', header=None)

    # Extract driver data (rows 3-28)
    excel_drivers = []
    for i in range(3, 29):
        if i < len(df) and pd.notna(df.iloc[i, 1]):
            name = str(df.iloc[i, 1]).strip()
            license = str(df.iloc[i, 2]).strip() if pd.notna(df.iloc[i, 2]) else None
            expiry = df.iloc[i, 3]
            phone = str(df.iloc[i, 4]).strip() if pd.notna(df.iloc[i, 4]) else None
            address = str(df.iloc[i, 5]).strip() if pd.notna(df.iloc[i, 5]) else None

            if name and name not in ['….', 'NaN', '']:
                # Clean up license
                if license and license in ['….', 'NaN', '']:
                    license = None

                # Parse expiry date
                expiry_date = parse_date(expiry)

                # Clean up phone
                if phone and phone in ['...', '….', 'NaN', '']:
                    phone = None

                # Clean up address
                if address and address in ['...', '….', 'NaN', '']:
                    address = None

                excel_drivers.append({
                    'name': name,
                    'license': license,
                    'expiry': expiry_date,
                    'phone': phone,
                    'address': address
                })

    print(f"\nFound {len(excel_drivers)} drivers in Excel file\n")

    # Fetch existing drivers from database
    try:
        response = requests.get('http://localhost:3000/api/drivers', timeout=10)
        if response.status_code != 200:
            print(f"Error fetching drivers: {response.status_code}")
            return

        db_drivers = response.json()
        db_drivers_map = {d['name'].lower().strip(): d for d in db_drivers}

        print(f"Found {len(db_drivers)} drivers in database\n")

        added_count = 0
        updated_count = 0
        skipped_count = 0

        for excel_driver in excel_drivers:
            name_lower = excel_driver['name'].lower().strip()

            if name_lower in db_drivers_map:
                # Driver exists - check if we need to update
                db_driver = db_drivers_map[name_lower]
                updates = {}

                # Check each field and update if missing in DB
                if excel_driver['license'] and not db_driver.get('licenseNumber'):
                    updates['licenseNumber'] = excel_driver['license']

                if excel_driver['expiry'] and not db_driver.get('licenseExpiry'):
                    updates['licenseExpiry'] = excel_driver['expiry']

                if excel_driver['phone'] and not db_driver.get('phone'):
                    updates['phone'] = excel_driver['phone']

                if excel_driver['address'] and not db_driver.get('address'):
                    updates['address'] = excel_driver['address']

                if updates:
                    # Update driver
                    print(f"📝 Updating {excel_driver['name']}...")
                    update_response = requests.patch(
                        f"http://localhost:3000/api/drivers/{db_driver['id']}",
                        json=updates,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )

                    if update_response.status_code == 200:
                        print(f"   ✓ Updated with: {', '.join(updates.keys())}")
                        updated_count += 1
                    else:
                        print(f"   ✗ Error updating: {update_response.text}")
                else:
                    print(f"✓ {excel_driver['name']} - already complete")
                    skipped_count += 1
            else:
                # Driver doesn't exist - add new
                print(f"➕ Adding {excel_driver['name']}...")

                # Determine role based on license availability
                has_license = excel_driver['license'] and excel_driver['expiry']
                role = 'driver' if has_license else 'conductor'

                new_driver = {
                    'name': excel_driver['name'],
                    'role': role,
                    'phone': excel_driver['phone'] or '',
                    'address': excel_driver['address'],
                    'status': 'active'
                }

                # Only add license fields if role is driver
                if role == 'driver':
                    new_driver['licenseNumber'] = excel_driver['license']
                    new_driver['licenseExpiry'] = excel_driver['expiry']

                print(f"   Role: {role}")
                if excel_driver['phone']:
                    print(f"   Phone: {excel_driver['phone']}")

                add_response = requests.post(
                    'http://localhost:3000/api/drivers',
                    json=new_driver,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )

                if add_response.status_code in [200, 201]:
                    print(f"   ✓ Successfully added as {role}")
                    added_count += 1
                else:
                    print(f"   ✗ Error adding: {add_response.text}")
                    print(f"   Data sent: {json.dumps(new_driver, indent=2)}")

        print("\n" + "=" * 70)
        print("IMPORT SUMMARY")
        print("=" * 70)
        print(f"✓ Drivers already complete: {skipped_count}")
        print(f"📝 Drivers updated: {updated_count}")
        print(f"➕ New drivers added: {added_count}")
        print(f"\nTotal processed: {len(excel_drivers)}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
