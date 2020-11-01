import requests
import psycopg2
from bs4 import BeautifulSoup
import datetime
import io
from PyPDF2 import PdfFileReader
import tabula
import re

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
# df = tabula.read_pdf("https://www.who.int/docs/default-source/coronaviruse/novel-coronavirus-landscape-covid-19cc0232c16129498983a6a0e30ca94000.pdf", pages=1)
# print(df)
# print(reader.numPages)

# String to Search
String = "Developer"
page_divider = -1

# Search for page with keyword "Developer" - separate section Clinical Trials and Pre-Clinical
for i in range(0, reader.numPages):
    PageObj = reader.getPage(i)
    Text = PageObj.extractText()
    ResSearch = re.search(String, Text)
    # print(ResSearch)
    if ResSearch is not None:
        page_divider = i + 1
        break


for j in range(1, page_divider):
    df = tabula.read_pdf(who_document_link, pages=j, pandas_options={'header': None})
    table = df[0].to_numpy()
    #     # contents = reader.getPage(i).extractText()
    #     # print(contents)
    # print(df[0])
    for k in range(len(table)):
        if str(table[k, 0]) != 'nan':
            print(table[k, 0])
