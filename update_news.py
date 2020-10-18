import requests
import re
import psycopg2
from bs4 import BeautifulSoup
from models.close_match_indexes import get_close_matches_indexes
import datetime
import schedule
import time


def update_news():
    now = datetime.datetime.now()
    # connect to database
    # conn = psycopg2.connect("host=localhost dbname=vaccinedb user=tonyliu")
    conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                            " dbname=vaccinedb user=postgres password=iloveNYC0704")
    cur = conn.cursor()

    # Remove News Tag IF more than three days - TO BE CONTINUED
    cur.execute("SELECT key, CURRENT_DATE - date AS interval FROM news WHERE tag = %s", ("New",))
    news_new = cur.fetchall()
    cur.execute("rollback")
    print(news_new)
    for i in range(len(news_new)):
        if news_new[i][1] > 3:
            cur.execute("UPDATE news SET tag = %s WHERE key = %s", ('', news_new[i][0]))
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
    soup = BeautifulSoup(src, 'lxml')

    # Find Latest News Section
    latest_news = soup.find(text=re.compile('New additions and recent updates:')).parent.parent.parent.find_all(
        'p', attrs={"class": "g-body "})

    latest_update_array = []
    matched_array_indexes = []
    for news in latest_news:
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

            index = get_close_matches_indexes(company_string, company_array_possibilities, n=1, cutoff=0.4)
            # print(index)
            try:
                vaccine_id = info_id_and_company[index[0]][0]
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
            print("No Updates")
            break
        else:
            # if there is an update...
            if latest_update_array[i][0] == existing_news_array[0][0]:
                print(str(i - 1) + "updates found")
                for j in range(1, i + 1):
                    update = latest_update_array[i - j][0]
                    cur.execute('''INSERT INTO news(key, vac_id, tag, company, news_text, date)
                    VALUES (DEFAULT, %s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'))''',
                                (latest_update_array[i - j][3],
                                 "New",
                                 latest_update_array[i - j][1],
                                 update,
                                 latest_update_array[i - j][2]))
                    conn.commit()

    cur.close()
    conn.close()


schedule.every().day.at("10:30").do(update_news)
schedule.every().day.at("18:30").do(update_news)

while True:
    schedule.run_pending()
    time.sleep(1)
