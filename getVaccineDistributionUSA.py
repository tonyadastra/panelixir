import requests
import psycopg2


def update_usa_distribution(event, context):
    updates = 0
    administered_updates = 0

    conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                            " dbname=vaccinedb user=postgres password=iloveNYC0704")
    cur = conn.cursor()

    # Get Existing Data from database VaccineDistributionDataUSA
    cur.execute('''SELECT jurisdiction, doses_available, doses_administered FROM "VaccineDistributionUSA"''')
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

    usa_vaccination_api = requests.get(
        'https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data')
    usa_vaccination_data = []
    for key, value in usa_vaccination_api.json().items():
        if key == "vaccination_data":
            for vaccination_data in value:
                state = vaccination_data['LongName']
                if vaccination_data['LongName'] == "New York State":
                    state = "New York"
                if vaccination_data['LongName'] == "Virgin Islands":
                    state = "U.S. Virgin Islands"
                if vaccination_data['LongName'] == "Northern Mariana Islands":
                    state = "Mariana Islands"
                if vaccination_data['LongName'] == "Federated States of Micronesia":
                    state = "Micronesia"
                if vaccination_data['LongName'] == "Federated States of Micronesia":
                    state = "Micronesia"

                administered_doses = vaccination_data['Doses_Administered']
                state_vaccination_data = {"state": state, "doses_administered": administered_doses}
                usa_vaccination_data.append(state_vaccination_data)

    all_vaccines_data = []
    for state_moderna in moderna_vaccine_data:
        for state_pfizer in pfizer_vaccine_data:
            for state_vaccination in usa_vaccination_data:
                if state_moderna['state'] == state_pfizer['state'] and state_moderna['state'] == state_vaccination['state']:
                    state_data_total = {"state": state_pfizer['state'],
                                        "doses": state_moderna['doses'] + state_pfizer['doses'],
                                        "doses_administered": state_vaccination['doses_administered']}
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

                if all_data['doses_administered'] != all_existing_data[2]:
                    # Update in doses for this state
                    cur.execute('''UPDATE "VaccineDistributionUSA" 
                        SET doses_administered = %s 
                        WHERE jurisdiction = %s''',
                                (all_data['doses_administered'], all_data['state']))
                    conn.commit()
                    administered_updates += 1

                    # cur.execute('''INSERT INTO "VaccineDistributionUSA" (jurisdiction, doses_available)
                    # VALUES (%s, %s)''', (all_data['state'], all_data['doses']))
                    # conn.commit()

    return_response = {
        "statusCode-Moderna": moderna_distribution_api.status_code,
        "statusCode-Pfizer": pfizer_distribution_api.status_code,
        "statusCode-Vaccination": usa_vaccination_api.status_code,
        "distributionUpdates": updates,
        "administeredUpdates": administered_updates
    }
    print(return_response)

    return return_response


# update_usa_distribution(1, 2)

