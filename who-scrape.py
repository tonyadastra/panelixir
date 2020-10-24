import requests
import psycopg2
from bs4 import BeautifulSoup
import datetime
import io
from PyPDF2 import PdfFileReader

now = datetime.datetime.now()
# connect to database
conn = psycopg2.connect("host=localhost dbname=vaccinedb user=tonyliu")
# conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
#                         " dbname=vaccinedb user=postgres password=iloveNYC0704")
cur = conn.cursor()

# scrape results from the New York Times
result = requests.get("https://www.who.int/publications/m/item/draft-landscape-of-covid-19-candidate-vaccines")
src = result.content
soup = BeautifulSoup(src, "html.parser")

who_download_button = soup.find('div', attrs={"class": "button button-blue-background"})
who_document_link = who_download_button.a['href'].split('?')[0]
# print(who_document_link)

result_pdf = requests.get(who_document_link)
f = io.BytesIO(result_pdf.content)
reader = PdfFileReader(f)
# contents = reader.getPage(1).extractText().split('\n')
print(reader.numPages)
