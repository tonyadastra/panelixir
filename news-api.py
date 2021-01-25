import requests
import psycopg2
import re
# from newsapi import NewsApiClient

conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                        " dbname=vaccinedb user=postgres password=iloveNYC0704")
cur = conn.cursor()

result = requests.get('https://newsapi.org/v2/everything?q=san%20francisco%20bay%20area%20covid%20vaccine&apiKey=a0832e04c08e426e979ab84d74401580')

newsResponseBayArea = result.json()

cur.execute('''SELECT title, content, source, url FROM "newsAPI"''')
existing_articles = cur.fetchall()
cur.execute("rollback")

# newsAPI = NewsApiClient(api_key='a0832e04c08e426e979ab84d74401580')
#
# newsResponseBayArea = newsAPI.get_everything(q='bay%area%20covid%20vaccine')
updates = 0
if newsResponseBayArea['status'] == "ok" and newsResponseBayArea['totalResults'] != 0:
    for article in newsResponseBayArea['articles']:
        hasUpdate = False
        try:
            source = article['source']['name']
            author = article['author']
            title = article['title']
            url = article['url']
            imageUrl = article['urlToImage']
            content = re.sub(r'\[.*?\]', '', str(article['content']))
            time = article['publishedAt']

            keywords = ["Bay Area", "California", "San Mateo", "Burlingame", "vaccine", "distribution"]
            abandon_keywords = []

            if "vaccin" in title.lower() or "vaccine" in content.lower():
                for keyword in keywords:
                    if keyword in title.lower() or keyword in content.lower():
                        hasUpdate = True
            # news = {"title": title, "content": content, "url": url, "source": source,
            #         "author": author, "imageUrl": imageUrl}

            if hasUpdate:
                for existing_article in existing_articles:
                    if existing_article[3] == url:
                        hasUpdate = False

            if hasUpdate:
                cur.execute('''INSERT INTO "newsAPI" 
                (title, content, url, image_url, source, author, area, time) 
                VALUES (%s, %s, %s, %s, %s, %s, 'San Francisco Bay Area', %s)''', (
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

    # return return_response


# update_prev_usa_distribution(1, 2)
