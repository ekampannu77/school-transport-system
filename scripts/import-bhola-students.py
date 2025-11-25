import pandas as pd
import requests

EXCEL_FILE = '/Users/ekampannu7/Desktop/Convenc Fee 2025-26.xls'
SHEET_NAME = 'Bhola S'
BUS_ID = 'cmidgrlr10005jcdeoy0g1lvq'  # RJ 13 PA 4746 - Bhola Singh
API_BASE = 'http://localhost:3000/api'

# Roman numeral conversion
ROMAN_TO_NUM = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
    'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
    'XI': '11', 'XII': '12'
}

def convert_class_and_section(class_str):
    """Convert class with roman numerals and extract section"""
    if not class_str or class_str == 'nan':
        return 'Unknown', None

    class_str = str(class_str).strip()

    if 'UKG' in class_str.upper():
        return 'UKG', None
    if 'LKG' in class_str.upper():
        return 'LKG', None

    # Convert "X S" → class="10", section="S"
    # Convert "VI M" → class="6", section="M"
    for roman, num in ROMAN_TO_NUM.items():
        if class_str.startswith(roman + ' '):
            section = class_str.replace(roman + ' ', '').strip()
            return num, section if section else None

    return class_str, None

def import_students():
    print('🚌 Importing Bhola Singh students from Excel...')
    print('=' * 70)

    # Read Excel
    print('\n📚 Reading Excel file...')
    df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME)

    print('\n🔄 Importing students...')
    print('=' * 70)

    imported = 0
    failed = 0

    for idx in range(2, len(df)):  # Skip header row
        row = df.iloc[idx]

        name = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ""
        class_raw = str(row.iloc[2]) if pd.notna(row.iloc[2]) else ""
        village = str(row.iloc[3]) if pd.notna(row.iloc[3]) else ""
        fee = str(row.iloc[4]) if pd.notna(row.iloc[4]) else "0"

        # Skip empty or total rows
        if not name or name == 'nan' or 'total' in name.lower() or 'student name' in name.lower():
            continue

        # Clean and convert
        name = name.strip()
        student_class, section = convert_class_and_section(class_raw)
        village = village.strip() if village != 'nan' else 'Unknown'

        # Extract fee
        try:
            monthly_fee = float(''.join(c for c in fee if c.isdigit() or c == '.'))
        except:
            monthly_fee = 1500

        # Import via API
        student_data = {
            'name': name,
            'class': student_class,
            'section': section,
            'village': village,
            'monthlyFee': monthly_fee,
            'parentName': 'Parent',
            'parentContact': '0000000000',
            'busId': BUS_ID
        }

        try:
            response = requests.post(f'{API_BASE}/students', json=student_data)

            if response.ok:
                imported += 1
                section_str = f" ({section})" if section else ""
                print(f'✅ {str(imported).rjust(2)}. {name.ljust(30)} | Class {student_class}{section_str.ljust(5)} | {village.ljust(12)} | ₹{int(monthly_fee)}')
            else:
                failed += 1
                error_msg = response.json().get('error', 'Unknown error')
                print(f'❌ {name}: {error_msg}')
        except Exception as e:
            failed += 1
            print(f'❌ {name}: {str(e)}')

    print('=' * 70)
    print(f'\n📊 Import Summary:')
    print(f'   ✅ Imported: {imported} students')
    print(f'   ❌ Failed: {failed} students')
    print(f'\n✅ Total students for bus RJ 13 PA 4746 (Bhola Singh): {imported}')

if __name__ == '__main__':
    import_students()
