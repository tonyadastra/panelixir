import requests
import psycopg2
from datetime import datetime, timedelta
import re


def updateBayAreaNews(event, context):
    now = datetime.now()
    limit_days = now - timedelta(days=3)

    conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                            " dbname=vaccinedb user=postgres password=iloveNYC0704")
    cur = conn.cursor()

    # Remove News that are too old
    cur.execute("DELETE FROM \"newsAPI\" WHERE (CURRENT_DATE - time::date) > 15")
    conn.commit()

    cur.execute("SELECT url, CURRENT_DATE - time AS interval FROM \"newsAPI\" WHERE tag = %s", ("New",))
    news_new = cur.fetchall()
    cur.execute("rollback")

    for i in range(len(news_new)):
        if news_new[i][1].days >= 1:
            cur.execute("UPDATE \"newsAPI\" SET tag = %s WHERE url = %s", ('', news_new[i][0]))
            conn.commit()

    result = requests.get('https://newsapi.org/v2/everything?'
                          'q=+((vaccine)AND(bay%20area)OR(san%20mateo)OR((san%20francisco)))'
                          '-((Quebec)OR(Canada)OR(warehouse))'
                          'san%20francisco%20bay%20area%20covid%20vaccine'
                          '&from=' + str(limit_days.year) + '-' + str(limit_days.month) + '-' + str(limit_days.day) +
                          '&to=' + str(now.year) + '-' + str(now.month) + '-' + str(now.day) +
                          '&excludeDomains=fool.com'
                          '&sortBy=relevancy'
                          '&language=en'
                          '&pageSize=40'
                          '&apiKey=a0832e04c08e426e979ab84d74401580')

    newsResponseBayArea = result.json()

    cur.execute('''SELECT title, content, source, url FROM "newsAPI"''')
    existing_articles = cur.fetchall()
    cur.execute("rollback")


    def cleanHTML(raw_html):
        cleanR = re.compile('<.*?>')
        cleanText = re.sub(cleanR, '', raw_html)
        return cleanText


    # newsAPI = NewsApiClient(api_key='a0832e04c08e426e979ab84d74401580')
    #
    # newsResponseBayArea = newsAPI.get_everything(q='bay%area%20covid%20vaccine')
    updates = 0
    if newsResponseBayArea['status'] == "ok" and newsResponseBayArea['totalResults'] != 0:
        for article in newsResponseBayArea['articles']:
            hasUpdate = True
            try:
                source = article['source']['name']
                author = article['author']
                title = article['title']
                url = article['url']
                imageUrl = article['urlToImage']
                content = re.sub(r'\[.*?\]', '', str(article['content']))
                content = cleanHTML(content)
                time = article['publishedAt']
                #
                # keywords = ["Bay Area", "California", "San Mateo", "Burlingame", "vaccine", "distribution"]
                # abandon_keywords = ["warehouse fire"]
                #
                # if "vaccin" in title.lower() or "vaccin" in content.lower():
                #     for keyword in keywords:
                #         if keyword in title.lower() or keyword in content.lower():
                #             hasUpdate = True
                #
                # for a_keyword in abandon_keywords:
                #     if a_keyword.lower() in title.lower() or a_keyword in content.lower():
                #         hasUpdate = False

                # news = {"title": title, "content": content, "url": url, "source": source,
                #         "author": author, "imageUrl": imageUrl}

                if hasUpdate:
                    for existing_article in existing_articles:
                        if existing_article[3] == url or existing_article[0] == title:
                            hasUpdate = False

                if hasUpdate:
                    cur.execute('''INSERT INTO "newsAPI" 
                    (title, content, url, image_url, source, author, area, time, tag) 
                    VALUES (%s, %s, %s, %s, %s, %s, 'San Francisco Bay Area', %s, 'New')''', (
                        title, content, url, imageUrl, source, author, time
                    ))
                    conn.commit()
                    updates += 1

            except KeyError:
                continue


    # def update_prev_usa_distribution(event, context):

    #
    # cur.execute('''UPDATE "VaccineDistributionUSA" SET prev_administered = doses_administered,
    # prev_distributed = doses_available''')
    # conn.commit()

    return_response = {
        "statusCode": result.status_code,
        "updates": updates
    }
    print(return_response)

    return return_response


# updateBayAreaNews(1, 2)
