import requests
import re
import psycopg2
from bs4 import BeautifulSoup

# connect to database
conn = psycopg2.connect("host=localhost dbname=vaccinedb user=tonyliu")
cur = conn.cursor()

# scrape results from the New York Times
result = requests.get("https://www.nytimes.com/interactive/2020/science/coronavirus-vaccine-tracker.html")
src = result.content
soup = BeautifulSoup(src, 'lxml')

# Find Latest News Section
latest_news = soup.find(text=re.compile('New additions and recent updates:')).parent.parent.parent.find_all(
    'p', attrs={"class": "g-body "})

# for news in latest_news:
#     if news.strong in news:
        # print(news.strong.a.text)
        # print(news.span.text)
        # print(news.span.attrs['class'])
# for news in latest_news:
#     print(news.text)
# print(latest_news[3].strong)

# Find all Phase III intro
phase2_and_3_company_intro = soup.find_all('p', attrs={
    "class": "g-body g-list-item g-filter-item g-filter-phase2 g-filter-phase3"})
phase3_and_limited_approval_company_intro = soup.find_all('p', attrs={
    "class": "g-body g-list-item g-filter-item g-filter-phase3 g-filter-approved"})
phase3_company_intro = soup.find_all('p', attrs={"class": "g-body g-list-item g-filter-item g-filter-phase3"})
all_phase3_intro = phase3_company_intro + phase3_and_limited_approval_company_intro + phase2_and_3_company_intro
print(len(all_phase3_intro))

# Find all Phase II intro
phase2_company_intro = soup.find_all('p', attrs={"class": "g-body g-list-item g-filter-item g-filter-phase2"})
phase1_and_2_company_intro = soup.find_all('p', attrs={
    "class": "g-body g-list-item g-filter-item g-filter-phase1 g-filter-phase2"})
all_phase2_intro = phase2_company_intro + phase1_and_2_company_intro
print(len(all_phase2_intro) + 1)  # plus Kentucky BioProcessing Vaccine

# Find all Phase I intro
all_phase1_company_intro = soup.find_all('p', attrs={"class": "g-body g-list-item g-filter-item g-filter-phase1"})
print(len(all_phase1_company_intro) - 2)  # minus North Korea Vaccine and Kentucky BioProcessing Vaccine(in Phase II)

all_vaccines_intro = all_phase3_intro + all_phase2_intro + all_phase1_company_intro
# print(all_phase1_company_intro)
intro_array = []
for intro in all_vaccines_intro:
    intro_text = intro.text

    update_time = intro.find('span', class_="g-updated")
    phase1 = intro.find('span', class_="g-phase1")
    phase2 = intro.find('span', class_="g-phase2")
    phase3 = intro.find('span', class_="g-phase3")
    limited = intro.find('span', class_="g-limited")
    combined_phases = intro.find('span', class_="g-combined")

    # Remove Tags from Intro
    if phase1 is not None and phase1.text in intro_text:
        intro_text = intro_text.replace(phase1.text, '')
    if phase2 is not None and phase2.text in intro_text:
        intro_text = intro_text.replace(phase2.text, '')
    if combined_phases is not None and combined_phases.text in intro_text:
        intro_text = intro_text.replace(combined_phases.text, '')
    if phase3 is not None and phase3.text in intro_text:
        intro_text = intro_text.replace(phase3.text, '')
    if limited is not None and limited.text in intro_text:
        intro_text = intro_text.replace(limited.text, '')

    # Remove final "updated" time in Intro
    if update_time is not None and update_time.text in intro_text:
        intro_text = intro_text.replace(update_time.text, '')
    intro_array.append(intro_text.replace('\n', '').replace('  ', ''))  # Formatting - remove \n and redundant spaces
# print(intro_array)
# print(len(intro_array))

cur.execute("DROP TABLE IF EXISTS nytimes;")

cur.execute('''CREATE TABLE nytimes(vac_id INT, news_intro VARCHAR);''')
conn.commit()

# Add array data to database
for i in range(0, len(intro_array)):
    cur.execute('''INSERT INTO nytimes(news_intro) VALUES (%s)''', (intro_array[i],))
    conn.commit()

# cur.execute("INSERT INTO nytimes(news_intro) VALUES (" + "Hello" + ")")

# print(all_phase2_intro[0])

# print(update)

cur.close()
conn.close()
