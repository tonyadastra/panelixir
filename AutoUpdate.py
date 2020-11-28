#!/usr/bin/python3
import json
import requests
from bs4 import BeautifulSoup
import psycopg2
import datetime

update_count = 0


# def auto_update_google(event, context):
# global update_count
# connect to database
# conn = psycopg2.connect("dbname=vaccinedb user=postgres")
conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                        " dbname=vaccinedb user=postgres password=iloveNYC0704")
cur = conn.cursor()
# scrape results from the New York Times
result = requests.get("https://www.google.com/search?tbm=nws&q=vaccine+news&oq=vaccine+news")
if result.status_code == 200:
    src = result.content
    soup = BeautifulSoup(src, "html.parser")

    # Remove News Tag if yesterday
    cur.execute("SELECT key, CURRENT_DATE - date AS interval FROM news WHERE tag = %s AND category = %s", ("New", 'G'))
    news_g_new = cur.fetchall()
    cur.execute("rollback")

    for i in range(len(news_g_new)):
        if news_g_new[i][1] >= 1:
            cur.execute("UPDATE news SET tag = %s WHERE key = %s AND category = %s", ('', news_g_new[i][0], 'G'))
            conn.commit()

    # Find Latest News Section
    cur.execute("SELECT news_text, source, link FROM news WHERE category = %s", ('G',))
    existing_articles = cur.fetchall()
    cur.execute("rollback")

    google_news = soup.find_all('div', attrs={"class": "kCrYT"})

    new_vaccine_articles = []
    for news in google_news:
        news_array = []
        news_title = news.find_all('div', attrs={"class": "BNeawe vvjwJb AP7Wnd"})
        if news_title:
            source = news.find_all('div', attrs={"class": "BNeawe UPmit AP7Wnd"})
            link = news.a['href'].replace('/url?q=', '').split('&sa=U')[0]
            news_array.append(news_title[0].text)
            news_array.append(source[0].text)
            news_array.append(link)

            new_vaccine_articles.append(news_array)
            print(news_title)
            print(source)
            print(link)

    print(new_vaccine_articles)
    for i in range(len(new_vaccine_articles)):
        new_text = new_vaccine_articles[i][0]
        new_source = new_vaccine_articles[i][1]
        new_link = new_vaccine_articles[i][2]
        proceed = True
        for j in range(len(existing_articles)):
            old_text = existing_articles[j][0]
            old_source = existing_articles[j][1]
            old_link = existing_articles[j][2]
            if new_text == old_text or new_link == old_link:
                proceed = False
        # TODO: Filter News from Google
        discard_keywords = ["Biden", "fact check"]
        if "vaccine".lower() not in new_text.lower():
            proceed = False

        for keyword in discard_keywords:
            if keyword in new_text:
                proceed = False
                break

        print(proceed)
        if proceed:
            cur.execute('''INSERT INTO news(tag, news_text, source, link, category) VALUES (%s, %s, %s, %s, %s)''',
                        ("New", new_text, new_source, new_link, 'G'))
            conn.commit()
            update_count += 1

return_response = {
    'URLStatusCode': result.status_code,
    'update_count': update_count

}

print(json.dumps(return_response))




