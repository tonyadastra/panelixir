import requests
from bs4 import BeautifulSoup
import re

result = requests.get("https://www.nytimes.com/interactive/2020/science/coronavirus-vaccine-tracker.html")
src = result.content
soup = BeautifulSoup(src, 'lxml')

# Find Latest News Section
latest_news = soup.find(text=re.compile('New additions and recent updates:')).parent.parent.parent.find_all(
    'p', attrs={"class": "g-body "})

for news in latest_news:
    if news.strong in news:
        print(news.strong.a.text)
        print(news.span.text)
        # print(news.span.attrs['class'])
# for news in latest_news:
#     print(news.text)
# print(latest_news[3].strong)
