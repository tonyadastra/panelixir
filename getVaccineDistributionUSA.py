import requests
import psycopg2


def update_usa_distribution(event, context):
    updates = 0
    conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                            " dbname=vaccinedb user=postgres password=iloveNYC0704")
    cur = conn.cursor()

    # Get Existing Data from database VaccineDistributionDataUSA
    cur.execute('''SELECT jurisdiction, doses_available FROM "VaccineDistributionUSA"''')
    existing_distribution_data = cur.fetchall()
    cur.execute("rollback")

    moderna_distribution_api = requests.get('https://data.cdc.gov/resource/b7pe-5nws.json')
    moderna_vaccine_data = []
    moderna_nyc_doses = "-1"
    for data in moderna_distribution_api.json():
        state_data = {}
        try:
            if data['jurisdiction']:
                state_data['state'] = data['jurisdiction'].replace('***', '').replace('**', '').replace('*', '').strip()
                if data['jurisdiction'] == "New York City":
                    moderna_nyc_doses = data['total_moderna_allocation_first_dose_shipments']
                if data['total_moderna_allocation_first_dose_shipments'] \
                        and data['total_moderna_allocation_first_dose_shipments'] != "N/A":
                    state_data['doses'] = int(data['total_moderna_allocation_first_dose_shipments'].replace(',', ''))
            if state_data and data['total_moderna_allocation_first_dose_shipments'] != "N/A":
                moderna_vaccine_data.append(state_data)
        except KeyError:
            continue

    for s_data in moderna_vaccine_data:
        if s_data['state'] == "New York" and moderna_nyc_doses != "-1":
            total_doses = int(s_data['doses']) + int(moderna_nyc_doses.replace(',', ''))
            s_data.update({"doses": total_doses})


    pfizer_distribution_api = requests.get('https://data.cdc.gov/resource/saz5-9hgg.json')
    pfizer_vaccine_data = []
    pfizer_nyc_doses = "-1"
    for data in pfizer_distribution_api.json():
        state_data = {}
        try:
            if data['jurisdiction']:
                state_data['state'] = data['jurisdiction'].replace('***', '').replace('**', '').replace('*', '').strip()
                if data['jurisdiction'] == "New York City":
                    pfizer_nyc_doses = data['total_pfizer_allocation_first_dose_shipments']
                if data['total_pfizer_allocation_first_dose_shipments'] \
                        and data['total_pfizer_allocation_first_dose_shipments'] != "N/A":
                    state_data['doses'] = int(data['total_pfizer_allocation_first_dose_shipments'].replace(',', ''))
            if state_data and data['total_pfizer_allocation_first_dose_shipments'] != "N/A":
                pfizer_vaccine_data.append(state_data)
        except KeyError:
            continue
    for s_data in pfizer_vaccine_data:
        if s_data['state'] == "New York" and pfizer_nyc_doses != "-1":
            total_doses = int(s_data['doses']) + int(pfizer_nyc_doses.replace(',', ''))
            s_data.update({"doses": total_doses})

    all_vaccines_data = []
    for state_moderna in moderna_vaccine_data:
        state_data_total = {}
        for state_pfizer in pfizer_vaccine_data:
            if state_moderna['state'] == state_pfizer['state']:
                state_data_total['state'] = state_pfizer['state']
                state_data_total['doses'] = state_moderna['doses'] + state_pfizer['doses']
                all_vaccines_data.append(state_data_total)

    for all_data in all_vaccines_data:
        for all_existing_data in existing_distribution_data:
            if all_data['state'] == all_existing_data[0]:
                if all_data['doses'] != all_existing_data[1]:
                    # Update in doses for this state
                    cur.execute('''UPDATE "VaccineDistributionUSA" 
                        SET doses_available = %s, 
                        date = CURRENT_DATE
                        WHERE jurisdiction = %s''',
                                (all_data['doses'], all_data['state']))
                    conn.commit()
                    updates += 1

                    # cur.execute('''INSERT INTO "VaccineDistributionUSA" (jurisdiction, doses_available)
                    # VALUES (%s, %s)''', (all_data['state'], all_data['doses']))
                    # conn.commit()

    return_response = {
        "statusCode-Moderna": moderna_distribution_api.status_code,
        "statusCode-Pfizer": pfizer_distribution_api.status_code,
        "databaseUpdates": updates
    }

    return return_response

