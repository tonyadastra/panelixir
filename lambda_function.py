import json
import requests
from bs4 import BeautifulSoup
import psycopg2
from close_match_indexes import get_close_matches_indexes
import datetime
import difflib


def lambda_handler(event, context):
    # TODO implement
    id_response = ""
    response = ""
    now = datetime.datetime.now()
    # connect to database
    # conn = psycopg2.connect("host=localhost dbname=vaccinedb user=tonyliu")
    conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                            " dbname=vaccinedb user=postgres password=iloveNYC0704")
    cur = conn.cursor()

    # Remove News Tag IF three days or more
    cur.execute("SELECT key, CURRENT_DATE - date AS interval FROM news WHERE tag = %s", ("New",))
    news_new = cur.fetchall()
    cur.execute("rollback")
    # print(news_new)
    for i in range(len(news_new)):
        if news_new[i][1] >= 3:
            cur.execute("UPDATE news SET tag = %s WHERE key = %s", ('', news_new[i][0]))
            conn.commit()

    # Remove Breaking News Tag IF more than three days
    cur.execute("SELECT key, CURRENT_DATE - date AS interval FROM news WHERE tag = %s", ("Breaking News",))
    news_breaking_news = cur.fetchall()
    cur.execute("rollback")
    for i in range(len(news_breaking_news)):
        if news_breaking_news[i][1] > 3:
            cur.execute("UPDATE news SET tag = %s WHERE key = %s", ('', news_breaking_news[i][0]))
            conn.commit()

    cur.execute("SELECT vac_id, company_nytimes FROM companies WHERE company_nytimes IS NOT NULL")
    info_id_and_company = cur.fetchall()
    cur.execute("rollback")
    company_array_possibilities = []
    # Update data format - transform to 1d array
    for i in range(len(info_id_and_company)):
        company_array_possibilities.append(info_id_and_company[i][1])

    # scrape results from the New York Times
    result = requests.get("https://www.nytimes.com/interactive/2020/science/coronavirus-vaccine-tracker.html")
    src = result.content
    soup = BeautifulSoup(src, "html.parser")

    # Find Latest News Section
    nytimes_news = soup.find_all('p', attrs={"class": "g-body"})
    latest_news = []
    for news in nytimes_news:
        if '•' in news.text:
            latest_news.append(news)

    latest_update_array = []
    for idx, news in enumerate(latest_news):
        news_array = []
        update_time = news.find('span', class_="g-updated")
        if update_time is not None and update_time.text in news.text:
            news_company = news.find_all('strong')
            news_text = news.text
            news_text = news_text.replace(update_time.text, '')

            company_string = ""
            for i in range(len(news_company)):
                if i == len(news_company) - 1:
                    company_string += news_company[i].a.text
                else:
                    company_string += news_company[i].a.text + ", "

            index = get_close_matches_indexes(company_string, company_array_possibilities, n=1, cutoff=0.7)
            try:
                vaccine_id = info_id_and_company[index[0]][0]
            except IndexError:
                # Find match for vaccines with multiple companies but only one shows in news
                # Problem: possible repeats in companies!
                for a in range(len(info_id_and_company)):
                    each_id_company = company_array_possibilities[a].split(', ')
                    match = difflib.get_close_matches(company_string, each_id_company, n=1, cutoff=1.0)
                    if match:
                        vaccine_id = info_id_and_company[a][0]
                        id_response += "Found match for news #" + str(idx + 1) + \
                                       " in try-except-1. Paired with VaccineID " + str(vaccine_id) + ".||"
                        break
                    else:
                        vaccine_id = -1

                # Find match for vaccines with multiple companies - rearrange the order in company_string
                # Iterate through every possible combination of company names to find match
                if vaccine_id == -1 and len(news_company) > 1:
                    count = 0
                    increment = 0
                    while count < len(news_company) and vaccine_id == -1:
                        order_start = 1 + increment
                        order_count = 0
                        if order_start >= len(news_company):
                            order_start = 0
                        new_company_string = ""
                        while order_count < len(news_company):
                            if order_count == len(news_company) - 1:
                                new_company_string += news_company[order_start].a.text
                            else:
                                new_company_string += news_company[order_start].a.text + ", "
                            order_count += 1
                            if order_start >= len(news_company) - 1:
                                order_start = 0
                            else:
                                order_start += 1

                        index = get_close_matches_indexes(new_company_string, company_array_possibilities, n=1,
                                                          cutoff=0.6)
                        try:
                            vaccine_id = info_id_and_company[index[0]][0]
                            id_response += "Found match for news #" + str(idx + 1) + \
                                           " in try-except-2. Paired with VaccineID " + str(vaccine_id) + ".||"
                        except IndexError:
                            vaccine_id = -1
                        increment += 1
                        count += 1

                if vaccine_id == -1:
                    modified_string = company_string + " Biological"
                    index = get_close_matches_indexes(modified_string, company_array_possibilities, n=1, cutoff=0.7)
                    try:
                        vaccine_id = info_id_and_company[index[0]][0]
                        id_response += "Found match for news #" + str(idx + 1) + \
                                       " in try-except-3. Paired with VaccineID " + str(vaccine_id) + ".||"
                    except IndexError:
                        vaccine_id = -1

            news_array.append(news_text.replace('\n\t•\xa0 ', '').replace(' \n', ''))
            news_array.append(company_string)
            news_array.append(update_time.text + " " + str(now.year))
            news_array.append(vaccine_id)

            latest_update_array.append(news_array)

    cur.execute("SELECT news_text, news_company, update_time FROM news_nytimes;")
    existing_news_array = cur.fetchall()
    cur.execute("rollback")

    # Update table
    cur.execute("DROP TABLE if exists news_nytimes;")
    cur.execute(
        '''CREATE TABLE news_nytimes(vac_id INT,
                                    news_text VARCHAR,
                                    news_company VARCHAR,
                                    update_time date);''')
    for j in range(0, len(latest_update_array)):
        cur.execute('''INSERT INTO news_nytimes(vac_id, news_text, news_company, update_time)
        VALUES (%s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'))''',
                    (latest_update_array[j][3],
                     latest_update_array[j][0],
                     latest_update_array[j][1],
                     latest_update_array[j][2]))
        conn.commit()

    for i in range(len(latest_update_array)):
        if latest_update_array[0][0] == existing_news_array[0][0]:
            response += "No Updates"
            break
        else:
            # if there is an update...
            if latest_update_array[i][0] == existing_news_array[0][0]:
                response += str(i) + " updates found.||"
                for j in range(1, i + 1):
                    update = latest_update_array[i - j][0] \
                        .replace('Phase 1/2', 'Phase I/II').replace('Phase 2/3', 'Phase II/III') \
                        .replace('Phase 1', 'Phase I').replace('Phase 2', 'Phase II').replace('Phase 3', 'Phase III')
                    VaccineID = latest_update_array[i - j][3]

                    cur.execute('''INSERT INTO news(key, vac_id, tag, company, news_text, date)
                    VALUES (DEFAULT, %s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'))''',
                                (VaccineID,
                                 "New",
                                 latest_update_array[i - j][1],
                                 update,
                                 latest_update_array[i - j][2]))
                    conn.commit()

                    if VaccineID != -1:
                        if "Phase" in update:
                            # Algorithm to identify new Phase for vaccine
                            if "enters" in update or "enter" in update or "begins" in update or "begin" in update \
                                    or "moves into" in update or "move into" in update:
                                new_phase = -1

                                if "Phase I/II" in update:
                                    new_phase = 2
                                elif "Phase II/III" in update:
                                    new_phase = 3
                                elif "Phase I" in update:
                                    new_phase = 1
                                elif "Phase II" in update:
                                    new_phase = 2
                                elif "Phase III" in update:
                                    new_phase = 3

                                # Fetch existing stage of this vaccine from INFO database
                                cur.execute("SELECT stage FROM info WHERE vac_id = %s", (VaccineID,))
                                existing_info_stage = cur.fetchone()
                                cur.execute("rollback")

                                # determine whether it is already updated in INFO database
                                isUpdated = True
                                if new_phase != existing_info_stage[0]:
                                    isUpdated = False
                                else:
                                    response += "No INFO update executed."

                                # If not updated and the algorithm can identify the new Phase
                                if new_phase != -1 and not isUpdated:
                                    # update stage in info database
                                    cur.execute("UPDATE info SET stage = %s, update_date = CURRENT_DATE "
                                                "WHERE vac_id = %s",
                                                (new_phase, VaccineID))
                                    conn.commit()
                                    response += "Updated INFO database of VaccineID " + str(VaccineID) \
                                                + " to Phase " + str(new_phase) + ".||"
                                # Return error if the algorithm cannot identify new Phase (new_phase = -1)
                                elif new_phase == -1:
                                    response += "ERROR: Cannot find the keyword in NEWS to update INFO database.||"
                break

    return {
        'statusCode': 200,
        'VaccineID Algorithm': id_response,
        'News Update': response
    }
