#!/usr/bin/env python3
import pandas as pd
import requests
import json
import time

# Configuration
EXCEL_FILE = '/Users/ekampannu7/Desktop/Convenc Fee 2025-26.xls'
SHEET_NAME = 'Satnam S'
BUS_ID = 'cmidgrmgt000djcdelunrp6pt'
API_BASE = 'http://localhost:3000/api'

# Roman numeral to number conversion
ROMAN_TO_NUM = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
    'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
    'XI': '11', 'XII': '12'
}

def convert_class(class_str):
    """Convert class with roman numerals to standard format"""
    if not class_str or class_str == 'nan':
        return 'Unknown'

    class_str = str(class_str).strip()

    # Handle special classes
    if 'UKG' in class_str.upper():
        return 'UKG'
    if 'LKG' in class_str.upper():
        return 'LKG'

    # Convert roman numerals
    for roman, num in ROMAN_TO_NUM.items():
        if class_str.startswith(roman + ' '):
            # Replace roman with number
            class_str = class_str.replace(roman + ' ', f'Class {num}-', 1)
            return class_str

    # If no roman numeral, return as is
    if not class_str.startswith('Class'):
        return class_str
    return class_str

def add_conductor():
    """Add conductor Sachin"""
    print("➕ Adding conductor Sachin...")
    try:
        response = requests.post(
            f'{API_BASE}/drivers',
            json={
                'name': 'Sachin',
                'role': 'conductor',
                'phone': '7878457734',
                'aadharNumber': '000000000000',
                'status': 'active'
            },
            headers={'Content-Type': 'application/json'}
        )
        if response.status_code in [200, 201]:
            conductor = response.json()
            print(f"   ✅ Conductor added: {conductor['name']} (ID: {conductor['id']})")
            return conductor['id']
        else:
            print(f"   ⚠️  Failed to add conductor: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def import_students():
    """Import all students from Satnam S sheet"""
    print(f"\n📚 Reading Excel file: {SHEET_NAME}")
    df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME)

    students_imported = 0
    students_failed = 0

    print(f"\n🚌 Importing students to bus {BUS_ID}")
    print("=" * 70)

    for idx in range(1, len(df)):
        row = df.iloc[idx]

        # Get student data
        name = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ""
        class_raw = str(row.iloc[2]) if pd.notna(row.iloc[2]) else ""
        village = str(row.iloc[3]) if pd.notna(row.iloc[3]) else ""
        fee = str(row.iloc[4]) if pd.notna(row.iloc[4]) else "0"

        # Skip if no name
        if not name or name.strip() == '' or name == 'nan':
            continue
        if any(x in name.lower() for x in ['total', 'student name']):
            continue

        # Clean data
        name = name.strip()
        student_class = convert_class(class_raw)
        village = village.strip() if village != 'nan' else 'Unknown'

        # Parse fee (remove any non-numeric except decimal point)
        try:
            monthly_fee = float(''.join(c for c in fee if c.isdigit() or c == '.'))
        except:
            monthly_fee = 1500.0  # Default fee

        # Prepare student data
        student_data = {
            'name': name,
            'class': student_class,
            'village': village,
            'monthlyFee': monthly_fee,
            'parentName': 'Parent',  # Default as not in sheet
            'parentContact': '0000000000',  # Default as not in sheet
            'busId': BUS_ID
        }

        # Import student
        try:
            response = requests.post(
                f'{API_BASE}/students',
                json=student_data,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code in [200, 201]:
                students_imported += 1
                print(f"✅ {students_imported:2d}. {name:30s} | {student_class:12s} | {village:10s} | ₹{monthly_fee}")
            else:
                students_failed += 1
                error_msg = response.json().get('error', 'Unknown error')
                print(f"❌ {name}: {error_msg}")

            # Small delay to avoid overwhelming the API
            time.sleep(0.1)

        except Exception as e:
            students_failed += 1
            print(f"❌ {name}: {str(e)}")

    print("=" * 70)
    print(f"\n📊 Import Summary:")
    print(f"   ✅ Successfully imported: {students_imported} students")
    print(f"   ❌ Failed: {students_failed} students")
    print(f"   📝 Total processed: {students_imported + students_failed} students")

if __name__ == '__main__':
    print("=" * 70)
    print("🚌 SATNAM SINGH BUS - STUDENT IMPORT")
    print("=" * 70)
    print(f"Bus: RJ 13 PA 4634")
    print(f"Driver: Satnam Singh")
    print(f"Conductor: Sachin")
    print("=" * 70)

    # Step 1: Add conductor
    conductor_id = add_conductor()

    # Step 2: Import students
    import_students()

    print("\n✅ Import process completed!")
