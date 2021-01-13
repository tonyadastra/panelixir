import requests
import psycopg2


def update_world_vaccinations(event, context):
    updates = 0
    conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                            " dbname=vaccinedb user=postgres password=iloveNYC0704")
    cur = conn.cursor()

    # Get Existing Data from database WorldVaccinations
    cur.execute(
        '''SELECT country, iso, vaccinations, new_vaccinations, 
        vaccinations_per_hundred, date FROM "WorldVaccinations"''')
    existing_vaccinations_data = cur.fetchall()
    cur.execute("rollback")

    world_vaccination_api = requests.get('https://covid.ourworldindata.org/data/owid-covid-data.json')
    world_vaccination_data = []
    for key, country_data in world_vaccination_api.json().items():
        country = country_data['location']
        population = country_data['population']
        iso = key
        total_vaccinations = 0
        new_vaccinations = 0
        vaccinations_per_hundred = 0.0
        hasUpdate = False
        date = "2021-01-01"
        try:
            date = str(country_data['data'][-1]['date'])
            total_vaccinations = int(country_data['data'][-1]['total_vaccinations'])
            new_vaccinations = int(country_data['data'][-1]['new_vaccinations'])
            vaccinations_per_hundred = country_data['data'][-1]['total_vaccinations_per_hundred']
            hasUpdate = True
        except KeyError:
            hasUpdate = False
            # country_data['data'].reverse()
            # for data in country_data['data']:
            #     if "total_vaccinations_per_hundred" in data:
            #         print(data)
            #         date = str(data['date'])
            #         total_vaccinations = int(data['total_vaccinations'])
            #         if "new_vaccinations" in data:
            #             new_vaccinations = int(data['new_vaccinations'])
            #         else:
            #             new_vaccinations = 0
            #         vaccinations_per_hundred = data['total_vaccinations_per_hundred']
            #         break
            pass
        country_data = {"country": country, "iso": iso, "total_vaccinations": total_vaccinations,
                        "new_vaccinations": new_vaccinations, "vaccinations_per_hundred": vaccinations_per_hundred,
                        "date": date, "hasUpdate": hasUpdate}
        world_vaccination_data.append(country_data)

    for data in world_vaccination_data:
        for existing_data in existing_vaccinations_data:
            if data['iso'] == existing_data[1]:
                previous_date = str(existing_data[5])
                if (int(data['total_vaccinations']) > existing_data[2] and data['hasUpdate']
                        and not (existing_data[2] > 0 and int(data['total_vaccinations']) == 0)):
                    cur.execute('''UPDATE "WorldVaccinations" 
                    SET vaccinations = %s, 
                    new_vaccinations = %s, 
                    vaccinations_per_hundred = %s, 
                    date = %s WHERE iso = %s''',
                                (str(data['total_vaccinations']), str(data['new_vaccinations']),
                                 str(data['vaccinations_per_hundred']),
                                 data['date'], data['iso']))
                    conn.commit()
                    updates += 1

    cur.execute(
        '''SELECT SUM(vaccinations) FROM "WorldVaccinations" WHERE iso != \'OWID_WRL\' and iso != \'USA\'''')
    updated_world_vaccinations = cur.fetchall()[0][0]
    cur.execute("rollback")

    cur.execute(
        '''SELECT doses_administered FROM "VaccineDistributionUSA" 
        WHERE jurisdiction = \'U.S. Total\'''')
    updated_usa_vaccinations = cur.fetchall()[0][0]
    cur.execute("rollback")

    total_world_vaccinations = int(updated_world_vaccinations) + int(updated_usa_vaccinations)
    cur.execute(
        '''SELECT vaccinations FROM "WorldVaccinations" WHERE iso = \'OWID_WRL\'''')
    existing_world_vaccinations = cur.fetchall()[0][0]
    cur.execute("rollback")

    if total_world_vaccinations > existing_world_vaccinations:
        cur.execute('''UPDATE "WorldVaccinations" SET vaccinations = %s WHERE iso = \'OWID_WRL\'''',
                    (total_world_vaccinations,))
        conn.commit()

    return_response = {
        "statusCode": world_vaccination_api.status_code,
        "databaseUpdates": updates,
        "totalWorldVaccinations": total_world_vaccinations
    }
    print(return_response)

    return return_response

# update_world_vaccinations(1, 2)
