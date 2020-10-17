import requests
import re
import psycopg2
import difflib
from bs4 import BeautifulSoup
from models.close_match_indexes import get_close_matches_indexes
import datetime

now = datetime.datetime.now()

# case_a = 'Moderna develops vaccines based on messenger RNA (mRNA) to produce viral proteins in the body. They have yet to bring one to the market. This is a sentence. In January, they began developing a vaccine for the coronavirus and since then the government has bankrolled Moderna’s efforts, providing nearly $1 billion. In partnership with National Institutes of Health, they found that the vaccine protects monkeys from the coronavirus. In March, the company put the first Covid-19 vaccine into human trials, which yielded promising results. The vaccine has progressed into Phase 3 testing, which began on July 27. The final trial is enrolling 30,000 healthy people at about 89 sites around the United States. On Aug. 11, the government awarded the company an additional $1.5 billion in exchange for 100 million doses if the vaccine proves safe and effective. Canada agreed in September to acquire 20 million doses. In July, Moderna lost a patent dispute over some of their vaccine technology. The following month, the company stated that it could not be certain it was the first to make the inventions claimed in their patents, including its coronavirus vaccine. On Sept. 17, Moderna shared their protocol for determining if their vaccine was safe and effective. Hi. They planned to wait until a significant number of volunteers became sick with Covid-19 and then see how many had been vaccinated. It may take till the end of 2020 or early 2021 to reach the necessary numbers.'
# case_b = 'Moderna develops vaccines based on messenger RNA (mRNA) to produce viral proteins in the body. They have yet to bring one to the market. In January, they began developing a vaccine for the coronavirus and since then the government has bankrolled Moderna’s efforts, providing nearly $1 billion. In partnership with National Institutes of Health, they found that the vaccine protects monkeys from the coronavirus. In March, the company put the first Covid-19 vaccine into human trials, which yielded promising results. The vaccine has progressed into Phase 3 testing, which began on July 27. The final trial is enrolling 30,000 healthy people at about 89 sites around the United States. On Aug. 11, the government awarded the company an additional $1.5 billion in exchange for 100 million doses if the vaccine proves safe and effective. Canada agreed in September to acquire 20 million doses. In July, Moderna lost a patent dispute over some of their vaccine technology. The following month, the company stated that it could not be certain it was the first to make the inventions claimed in their patents, including its coronavirus vaccine. On Sept. 17, Moderna shared their protocol for determining if their vaccine was safe and effective. They planned to wait until a significant number of volunteers became sick with Covid-19 and then see how many had been vaccinated. It may take till the end of 2020 or early 2021 to reach the necessary numbers. This is an update.'
#
# output_list = [li for li in difflib.ndiff(case_a, case_b) if li[0] != ' ']
# diff_nl = ''.join([x[2:] for x in output_list if x.startswith('+ ')])
# # print(diff_nl)

# connect to database
# conn = psycopg2.connect("host=localhost dbname=vaccinedb user=tonyliu")
conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                        " dbname=vaccinedb user=postgres password=iloveNYC0704")
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
#         print(news.strong.a.text)
#         print(news.span.text)
#         print(news.span.attrs['class'])
latest_update_array = []
for news in latest_news:
    news_array = []
    update_time = news.find('span', class_="g-updated")
    if update_time is not None and update_time.text in news.text:
        news_company = news.strong.a
        news_text = news.text
        news_text = news_text.replace(update_time.text, '')
        # print(news_text)
        news_array.append(news_text.replace('\n\t•\xa0 ', '').replace(' \n', ''))
        news_array.append(news_company.text)
        news_array.append(update_time.text + " " + str(now.year))

        latest_update_array.append(news_array)
# print(latest_update_array)

cur.execute("SELECT news_text, news_company, update_time FROM news_nytimes;")
existing_news_array = cur.fetchall()
cur.execute("rollback")
# existing_news_array = []
# for i in range(len(existing_news)):
#     existing_news_array.append(existing_news[i][0])

# Update table
cur.execute("DROP TABLE if exists news_nytimes;")
cur.execute(
    "CREATE TABLE news_nytimes(vac_id INT, news_text VARCHAR, news_company VARCHAR, update_time date);")
for j in range(0, len(latest_update_array)):
    cur.execute('''INSERT INTO news_nytimes(news_text, news_company, update_time) 
    VALUES (%s, %s, TO_DATE(%s, 'Mon FMDD YYYY'))''',
                (latest_update_array[j][0], latest_update_array[j][1], latest_update_array[j][2]))
    conn.commit()

for i in range(len(latest_update_array)):
    if latest_update_array[0][0] == existing_news_array[0][0]:
        print("No Updates")
        break
    else:
        # if there is an update...
        # for j in range(1, len(existing_news_array)):
        if latest_update_array[i][0] == existing_news_array[0][0]:
            for j in range(1, i+1):
                update = latest_update_array[i - j][0]
                cur.execute("INSERT INTO news(key, tag, company, news_text, date) "
                            "VALUES (DEFAULT, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'))",
                            ("New", latest_update_array[i - j][1], update, latest_update_array[i - j][2]))
                conn.commit()

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

# # cur.execute("SELECT vac_id, company FROM info WHERE stage >= 1")
# cur.execute("SELECT vac_id, company_nytimes FROM companies WHERE company_nytimes IS NOT NULL")
# info_id_and_company = cur.fetchall()
# cur.execute("rollback")
# company_array_possibilities = []
# # Update data format - transform to 1d array
# for i in range(len(info_id_and_company)):
#     company_array_possibilities.append(info_id_and_company[i][1])
# # print(company_array_possibilities)
#
# new_data_array = []
# matched_array_indexes = []
# for intro in all_vaccines_intro:
#     vaccine_array = []
#     intro_text = intro.text
#
#     update_time = intro.find('span', class_="g-updated")
#     company_names = intro.find_all('strong')
#     phase1 = intro.find('span', class_="g-phase1")
#     phase2 = intro.find('span', class_="g-phase2")
#     phase3 = intro.find('span', class_="g-phase3")
#     limited = intro.find('span', class_="g-limited")
#     combined_phases = intro.find('span', class_="g-combined")
#     paused = intro.find('span', class_="g-paused")
#
#     company_string = ""
#     for i in range(len(company_names)):
#         if i == len(company_names) - 1:
#             company_string += company_names[i].text
#         else:
#             company_string += company_names[i].text + ", "
#     # Append company
#     vaccine_array.append(company_string)
#     match = get_close_matches_indexes(company_string, company_array_possibilities, n=1, cutoff=0.4)
#     try:
#         matched_array_indexes.append(match[0])
#     except IndexError:
#         matched_array_indexes.append('')
#     # print(match)
#
#     # Remove Tags from Intro
#     if phase1 is not None and phase1.text in intro_text:
#         intro_text = intro_text.replace(phase1.text, '')
#     if phase2 is not None and phase2.text in intro_text:
#         intro_text = intro_text.replace(phase2.text, '')
#     if combined_phases is not None and combined_phases.text in intro_text:
#         intro_text = intro_text.replace(combined_phases.text, '')
#     if phase3 is not None and phase3.text in intro_text:
#         intro_text = intro_text.replace(phase3.text, '')
#     if limited is not None and limited.text in intro_text:
#         intro_text = intro_text.replace(limited.text, '')
#     if paused is not None and paused.text in intro_text:
#         intro_text = intro_text.replace(paused.text, '')
#
#     date = ""
#     # Remove final "updated" time in Intro
#     if update_time is not None and update_time.text in intro_text:
#         date = update_time.text
#         intro_text = intro_text.replace(update_time.text, '')
#
#     if update_time is None:
#         date = ""
#
#     formatted_intro = intro_text.replace('\n', '').replace('  ', '')
#     intro_arr = formatted_intro.split('.')
#     print(intro_arr)
#     vaccine_array.append(formatted_intro)  # Formatting - remove redundant new lines
#     vaccine_array.append(date)
#     # print(intro_text)
#     new_data_array.append(vaccine_array)
#
# # print(new_data_array[0])
# # print(matched_array_indexes)
# vac_id_array = []
# for i in range(len(matched_array_indexes)):
#     try:
#         index = matched_array_indexes[i]
#         vaccine_id = info_id_and_company[index][0]
#         vac_id_array.append(vaccine_id)
#     except TypeError:
#         vac_id_array.append(-1)
#
# # print(vac_id_array)
#
# # Get last fetched data from database
# cur.execute("SELECT vaccine_intro from nytimes ORDER BY intro_id;")
# existing_data = cur.fetchall()
# cur.execute("rollback")
# existing_data_array = []
# # Update data format - transform to 1d array
# for i in range(len(existing_data)):
#     existing_data_array.append(existing_data[i][0])
#
# cur.execute("DROP TABLE IF EXISTS nytimes;")
#
# cur.execute('''CREATE TABLE nytimes(
#                     vac_id INT,
#                     intro_id INT NOT NULL,
#                     company_name VARCHAR,
#                     vaccine_intro VARCHAR,
#                     update_time VARCHAR,
#                     intro_update VARCHAR);''')
# conn.commit()
#
# # Add new data to database
# for i in range(len(new_data_array)):
#     cur.execute('''INSERT INTO nytimes(vac_id, intro_id, company_name, vaccine_intro, update_time)
#                 VALUES (%s, %s, %s, %s, %s)''',
#                 (vac_id_array[i], i, new_data_array[i][0], new_data_array[i][1], new_data_array[i][2]))
#     conn.commit()

# if len(existing_data_array) == len(new_data_array):
#     for i in range(len(new_data_array)):
#         # If there is an update in vaccine intro
#         if new_data_array[i][1] != existing_data_array[i]:
#             output_list = [li for li in difflib.ndiff(existing_data_array[i], new_data_array[i][1]) if li[0] != ' ']
#             intro_update = ''.join([x[2] for x in output_list if x.startswith('+ ')])
#             # Add new data to database
#             if not intro_update.startswith('.'):
#                 print('update')
#                 cur.execute('''UPDATE nytimes SET intro_update = %s WHERE intro_id = %s''', (intro_update, i))
#                 conn.commit()

# cur.execute("SELECT nyt.vac_id, nyt.intro_update, intro FROM nytimes nyt INNER JOIN info i ON nyt.vac_id = i.vac_id"
#             " WHERE intro_update IS NOT NULL")
# id_and_update = cur.fetchall()
# cur.execute("rollback")
# for i in range(len(id_and_update)):
#     vac_id = id_and_update[i][0]
#     new_update = id_and_update[i][1]
#     vaccine_intro = id_and_update[i][2]
#     updated_intro = vaccine_intro + new_update
#     print(updated_intro)
#
#     cur.execute("UPDATE info SET intro = %s WHERE vac_id = %s", (updated_intro, vac_id))
#     conn.commit()
# cur.execute("SELECT vac_id, intro FROM info ")
# # Add to companies nytimes company name
# cur.execute("SELECT company_name from nytimes ORDER BY intro_id;")
# nytimes_company = cur.fetchall()
# cur.execute("rollback")
# nytimes_company_array = []
# # Update data format - transform to 1d array
# for i in range(len(nytimes_company)):
#     nytimes_company_array.append(nytimes_company[i][0])
#
# for i in range(len(existing_data_array)):
#     cur.execute("UPDATE companies SET company_nytimes= %s WHERE vac_id = %s", (nytimes_company_array[i], vac_id_array[i]))
#     conn.commit()

cur.close()
conn.close()
