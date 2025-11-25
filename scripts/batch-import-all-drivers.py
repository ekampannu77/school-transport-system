import pandas as pd
import requests
import sys

EXCEL_FILE = '/Users/ekampannu7/Desktop/Convenc Fee 2025-26.xls'
API_BASE = 'http://localhost:3000/api'

# Bus IDs from database
BUS_IDS = {
    'RJ 13 PA 4821': 'cmidgrm4w0009jcde1p8hs7ag',
    'RJ 13 PA 5948': 'cmidgrn1d000jjcdebbq5f360',
    'RJ 13 PA 6146': 'cmidgrn7c000ljcde978q3m4w',
    'RJ 13 PA 6668': 'cmidgrnd9000njcdenpay6xj9',
    'RJ 13 PA 7172': 'cmidgrmmq000fjcdem85ac318',
    'RJ 13 PA 7673': 'cmidgro43000vjcdewzuhk6d3',
    'RJ 13 PA 7787': 'cmidgrmu8000hjcde5gcnms78',
    'RJ 13 PA 7881': 'cmidgrnjt000pjcde8fs0y9a9',
    'RJ 13 PA 7929': 'cmidgrlyy0007jcdethjnsohs',
    'RJ 13 PA 7988': 'cmidgrny4000tjcde312g57cy',
    'RJ 13 PA 8281': 'cmidgrll40003jcdek4lwp9eg',
    'RJ 13 TA 0991': 'cmidgrl6k0001jcdezhwa7f4n',
    'RJ 13PA 4746': 'cmidgrmaw000bjcdego9qez52',
}

# Map driver sheet names to bus info
DRIVER_MAPPINGS = [
    {'sheet': 'Manjeet Singh', 'driver': 'Manjeet Singh', 'reg': 'RJ 13 PA 4821'},
    {'sheet': 'Jasveer Singh', 'driver': 'Jasveer Singh', 'reg': 'RJ 13 PA 5948'},
    {'sheet': 'Jaspal S', 'driver': 'Jaspal Singh', 'reg': 'RJ 13 PA 6146'},
    {'sheet': 'Nanak', 'driver': 'Nanak Singh', 'reg': 'RJ 13 PA 6668'},
    {'sheet': 'Jaswant Singh', 'driver': 'Jaswant Singh', 'reg': 'RJ 13 PA 7172'},
    {'sheet': 'Rajwant S', 'driver': 'Rajwant Singh', 'reg': 'RJ 13 PA 7673'},
    {'sheet': 'Manjinder Singh', 'driver': 'Manjinder Singh', 'reg': 'RJ 13 PA 7787'},
    {'sheet': 'Kamaljeet Singh', 'driver': 'Kamaljeet Singh', 'reg': 'RJ 13 PA 7881'},
    {'sheet': 'Mahma S', 'driver': 'Mahma Singh', 'reg': 'RJ 13 PA 7929'},
    {'sheet': 'Baldev S', 'driver': 'Baldev Singh', 'reg': 'RJ 13 PA 7988'},
    {'sheet': 'Labh S', 'driver': 'Labh Singh', 'reg': 'RJ 13 PA 8281'},
    {'sheet': 'HARBANS SINGH ', 'driver': 'Harbans Singh', 'reg': 'RJ 13 TA 0991'},
    {'sheet': 'Ram Singh', 'driver': 'Ram Singh', 'reg': 'RJ 13PA 4746'},
]

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
    if 'NUR' in class_str.upper():
        return 'Nursery', None

    # Convert "X S" → class="10", section="S"
    for roman, num in ROMAN_TO_NUM.items():
        if class_str.startswith(roman + ' '):
            section = class_str.replace(roman + ' ', '').strip()
            return num, section if section else None

    return class_str, None

def get_bus_id(registration):
    """Get bus ID from mapping"""
    return BUS_IDS.get(registration)

def import_students_for_driver(driver_info):
    """Import students for a single driver"""
    sheet_name = driver_info['sheet']
    driver_name = driver_info['driver']
    registration = driver_info['reg']

    print(f'\n🚌 Processing: {driver_name} ({registration})')
    print('=' * 70)

    # Get bus ID
    bus_id = get_bus_id(registration)
    if not bus_id:
        print(f'❌ Bus not found: {registration}')
        return 0

    # Read Excel
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name)
    except Exception as e:
        print(f'❌ Error reading sheet "{sheet_name}": {e}')
        return 0

    imported = 0
    failed = 0

    for idx in range(2, len(df)):
        row = df.iloc[idx]

        name = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ""
        class_raw = str(row.iloc[2]) if pd.notna(row.iloc[2]) else ""
        village = str(row.iloc[3]) if pd.notna(row.iloc[3]) else ""
        fee = str(row.iloc[4]) if pd.notna(row.iloc[4]) else "0"

        if not name or name == 'nan' or 'total' in name.lower() or 'student name' in name.lower():
            continue

        name = name.strip()
        student_class, section = convert_class_and_section(class_raw)
        village = village.strip() if village != 'nan' else 'Unknown'

        try:
            monthly_fee = float(''.join(c for c in fee if c.isdigit() or c == '.'))
        except:
            monthly_fee = 1500

        student_data = {
            'name': name,
            'class': student_class,
            'section': section,
            'village': village,
            'monthlyFee': monthly_fee,
            'parentName': 'Parent',
            'parentContact': '0000000000',
            'busId': bus_id
        }

        try:
            response = requests.post(f'{API_BASE}/students', json=student_data)
            if response.ok:
                imported += 1
            else:
                failed += 1
                if failed <= 3:  # Only show first 3 errors
                    error_msg = response.json().get('error', 'Unknown error')
                    print(f'❌ {name}: {error_msg}')
        except Exception as e:
            failed += 1
            if failed <= 3:
                print(f'❌ {name}: {str(e)}')

    print(f'✅ Imported: {imported} students')
    if failed > 0:
        print(f'❌ Failed: {failed} students')

    return imported

def main():
    print('🚀 Batch Import - All Remaining Drivers')
    print('=' * 70)

    total_imported = 0

    for driver_info in DRIVER_MAPPINGS:
        imported = import_students_for_driver(driver_info)
        total_imported += imported

    print('\n' + '=' * 70)
    print(f'📊 FINAL SUMMARY: {total_imported} students imported across {len(DRIVER_MAPPINGS)} buses')
    print('=' * 70)

if __name__ == '__main__':
    main()
