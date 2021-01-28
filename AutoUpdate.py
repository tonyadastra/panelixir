import json
import re
import requests
from bs4 import BeautifulSoup, NavigableString, Tag
import psycopg2
from models.close_match_indexes import get_close_matches_indexes
from models.format_nytimes_intro import format_intro
from models.nytimes_to_panelixir_style import arrange_nytimes_info
from models.hasNumbers import hasNumbers
from models.approved_country_format import format_country
import datetime
import difflib

update_date_count = 0
update_stage_count = 0
update_is_early_count = 0
update_is_paused_count = 0
update_is_combined_count = 0
update_is_abandoned_count = 0
update_intro_count = 0
new_companies_added = 0
new_assigned_id_count = 0
new_assigned_message = ""
new_vaccines_message = ""
update_message = ""
id_response = ""
news_update_response = ""

phase0_count = 0
phase1_count = 0
phase2_count = 0
phase3_count = 0
limited_count = 0
approved_count = 0
paused_count = 0
abandoned_count = 0


def auto_update_nytimes(event, context):
    global update_date_count, update_stage_count, update_is_early_count, update_is_paused_count, \
        update_is_combined_count, update_intro_count, new_companies_added, new_assigned_id_count, \
        new_assigned_message, new_assigned_message, new_vaccines_message, update_message, id_response, \
        news_update_response, phase0_count, phase1_count, phase2_count, phase3_count, approved_count, paused_count, \
        abandoned_count, update_is_abandoned_count, limited_count

    # Reset count
    update_date_count = 0
    update_stage_count = 0
    update_is_early_count = 0
    update_is_paused_count = 0
    update_is_combined_count = 0
    update_is_abandoned_count = 0
    update_intro_count = 0
    new_companies_added = 0
    new_assigned_id_count = 0
    new_assigned_message = ""
    new_vaccines_message = ""
    update_message = ""
    id_response = ""
    news_update_response = ""

    phase0_count = 0
    phase1_count = 0
    phase2_count = 0
    phase3_count = 0
    limited_count = 0
    approved_count = 0
    paused_count = 0
    abandoned_count = 0

    def similar(phrase_a, phrase_b):
        return difflib.SequenceMatcher(None, phrase_a, phrase_b).ratio()

    def cleanhtml(raw_html):
        cleanr = re.compile('<.*?>')
        cleantext = re.sub(cleanr, '', raw_html)
        return cleantext

    now = datetime.datetime.now()
    # connect to database
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
        if news_breaking_news[i][1] >= 3:
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

    # Find Latest News Section - nytimes_news_parent[0]; Leading Candidates - nytimes_news_parent[1]
    nytimes_news_parent = soup.find_all('table', class_="g-vaccine-table")
    nytimes_news = nytimes_news_parent[0].find_all('tr')

    # index0 - title; index1 - column title; data starts at 2
    leading_candidates = nytimes_news_parent[1].find_all('tr')[2:]
    # print(leading_candidates)
    # print(leading_candidates[2:])
    cur.execute("SELECT info.vac_id, leading_company_nytimes FROM info "
                "INNER JOIN companies ON info.vac_id = companies.vac_id "
                "WHERE (leading_company_nytimes IS NOT NULL AND leading_company_nytimes != '') "
                "AND (early_approval OR stage >= 3)")
    top_candidates_id_and_company = cur.fetchall()
    cur.execute("rollback")

    top_developers = []
    for i in range(len(top_candidates_id_and_company)):
        top_developers.append(top_candidates_id_and_company[i][1])
    # print(top_developers)
    leading_match_string = ""
    for candidate in leading_candidates:
        candidate_developer = candidate.find('a').text
        index = get_close_matches_indexes(candidate_developer, top_developers, n=1, cutoff=0.9)
        try:
            leading_vaccine_id = top_candidates_id_and_company[index[0]][0]
        except IndexError:
            leading_vaccine_id = -1
            leading_match_string += "New leading company: " + candidate_developer + ".||"

        approved_and_limited_countries = candidate.find('td', class_="g-small g-last")
        if approved_and_limited_countries is None and leading_vaccine_id == 29:
            approved_and_limited_countries = candidate.find_all('td', class_="g-small")[-1]
        ALText = approved_and_limited_countries.text

        if approved_and_limited_countries is not None and "in" in ALText \
                and ("Approved".lower() in ALText.lower()
                     or "Limited".lower() in ALText.lower()
                     or "Emergency".lower() in ALText.lower()
                     or "Early".lower() in ALText.lower()):
            LC_output = [ALText]
            # print(ALText)
            approved_countries = ""
            limited_countries = ""

            if "Early use in " in ALText:
                ALText = ALText.replace("Early use in ", "Emergency use in ")
            if "Limited use in " in ALText:
                ALText = ALText.replace("Limited use in ", "Emergency use in ")

            # if a_index != -1 and e_index != -1:
            countries_array = ALText.split("Emergency use in ")
            for i in range(len(countries_array)):
                if i != 0:
                    countries_array[i] = "Emergency use in " + countries_array[i]

            for countries in countries_array:
                if "Approved in " in countries:
                    countries = countries.replace("Approved in ", "")
                    country_array = countries.split(', ')
                    format_country(country_array)
                    for j in range(len(country_array)):
                        if j == len(country_array) - 1:
                            approved_countries += country_array[j]
                        else:
                            approved_countries += country_array[j] + ", "

                elif "Emergency use in " in countries:
                    countries = countries.replace("Emergency use in ", "")
                    country_array = countries.split(', ')
                    format_country(country_array)
                    for j in range(len(country_array)):
                        limited_countries += country_array[j] + ", "

            if limited_countries.endswith(", "):
                limited_countries = limited_countries[0: len(limited_countries) - 2]

            if leading_vaccine_id != -1:
                cur.execute("SELECT allow_auto_update FROM info WHERE vac_id = %s", (leading_vaccine_id,))
                LC_allow_auto_update = cur.fetchall()[0]
                if LC_allow_auto_update:
                    if approved_countries and "other countries" not in approved_countries:
                        cur.execute("UPDATE info SET approved_countries = %s WHERE vac_id = %s",
                                    (approved_countries, leading_vaccine_id))
                        conn.commit()
                    if limited_countries and "other countries" not in limited_countries:
                        cur.execute("UPDATE info SET limited_countries = %s WHERE vac_id = %s",
                                    (limited_countries, leading_vaccine_id))
                        conn.commit()
                    LC_output.append(approved_countries)
                    LC_output.append(limited_countries)
            print(LC_output)

    latest_news = []
    for news in nytimes_news:
        if 'New additions and recent updates' not in news.text:
            latest_news.append(news)

    latest_update_array = []
    newYear = False
    for idx, news in enumerate(latest_news):
        news_array = []
        update_time = news.find('td', class_="g-small g-gray")
        if "June" in update_time.text:
            update_time.text = update_time.text.replace('June', 'Jun.')
        if "July" in update_time.text:
            update_time.text = update_time.text.replace('July', 'Jul.')
        if "Sept." in update_time.text:
            update_time.text = update_time.text.replace('Sept.', 'Sep.')
        if "Jan." in update_time.text:
            newYear = True

        news_text = news.find('td', class_="g-news g-last").text.strip()
        # if update_time is not None and update_time.text in news.text:
        news_company = news.find_all('a')
        # news_text = news.text
        # news_text = news_text.replace(update_time.text, '')

        company_string = ""
        for i in range(len(news_company)):
            if i == len(news_company) - 1:
                company_string += news_company[i].text.strip()
            else:
                company_string += news_company[i].text.strip() + ", "

        if company_string == "GeneOne":
            company_string = "GeneOne Life Science"

        index = get_close_matches_indexes(company_string, company_array_possibilities, n=1, cutoff=0.7)
        try:
            vaccine_id = info_id_and_company[index[0]][0]
        except IndexError:
            # Find match for vaccines with multiple companies but only one shows in news
            # Problem: possible repeats in companies!
            vaccine_id = -1
            # Find match for vaccines with multiple companies - rearrange the order in company_string
            # Iterate through every possible combination of company names to find match
            if len(news_company) > 1:
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
                            new_company_string += news_company[order_start].text.strip()
                        else:
                            new_company_string += news_company[order_start].text.strip() + ", "
                        order_count += 1
                        if order_start >= len(news_company) - 1:
                            order_start = 0
                        else:
                            order_start += 1

                    index = get_close_matches_indexes(new_company_string, company_array_possibilities, n=1,
                                                      cutoff=0.8)
                    try:
                        vaccine_id = info_id_and_company[index[0]][0]
                        id_response += "Found match for news #" + str(idx + 1) + \
                                       " in except-2. Paired with VaccineID " + str(vaccine_id) + ".||"
                    except IndexError:
                        vaccine_id = -1
                    increment += 1
                    count += 1

            if vaccine_id == -1:
                for a in range(len(info_id_and_company)):
                    each_id_company = company_array_possibilities[a].split(', ')
                    match = difflib.get_close_matches(company_string, each_id_company, n=1, cutoff=1.0)
                    if match:
                        vaccine_id = info_id_and_company[a][0]
                        id_response += "Found match for news #" + str(idx + 1) + \
                                       " in except-1. Paired with VaccineID " + str(vaccine_id) + ".||"
                        break

            if vaccine_id == -1:
                modified_string = company_string + " Biological"
                index = get_close_matches_indexes(modified_string, company_array_possibilities, n=1, cutoff=0.8)
                try:
                    vaccine_id = info_id_and_company[index[0]][0]
                    id_response += "Found match for news #" + str(idx + 1) + \
                                   " in except-3. Paired with VaccineID " + str(vaccine_id) + ".||"
                except IndexError:
                    vaccine_id = -1

            if vaccine_id == -1:
                modified_string = company_string + " Biopharmaceutical"
                index = get_close_matches_indexes(modified_string, company_array_possibilities, n=1, cutoff=0.8)
                try:
                    vaccine_id = info_id_and_company[index[0]][0]
                    id_response += "Found match for news #" + str(idx + 1) + \
                                   " in except-4. Paired with VaccineID " + str(vaccine_id) + ".||"
                except IndexError:
                    vaccine_id = -1

            if vaccine_id == -1:
                modified_string = company_string + " Life Science"
                index = get_close_matches_indexes(modified_string, company_array_possibilities, n=1, cutoff=0.8)
                try:
                    vaccine_id = info_id_and_company[index[0]][0]
                    id_response += "Found match for news #" + str(idx + 1) + \
                                   " in except-5. Paired with VaccineID " + str(vaccine_id) + ".||"
                except IndexError:
                    vaccine_id = -1

        if company_string == "Oxford-AstraZeneca":
            vaccine_id = 11
        if company_string == "Sinovac":
            vaccine_id = 29

        if company_string == "GeneOne Life Science" and "GeneOne Life Science" not in news_text:
            company_string = "GeneOne"

        year = now.year
        if newYear and "Dec." in update_time.text:
            year -= 1

        news_array.append(news_text.replace('\n\t•\xa0 ', '').replace(' \n', ''))
        news_array.append(company_string)
        news_array.append(update_time.text + " " + str(year))
        # Issue: When entering a new year, dates of previous years would be changed to new, making them at the top
        news_array.append(vaccine_id)

        latest_update_array.append(news_array)
    # print(latest_update_array)

    cur.execute("SELECT news_text, news_company, update_time FROM news_nytimes ORDER BY update_time DESC NULLS LAST;")
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
                     latest_update_array[j][1].strip(),
                     latest_update_array[j][2]))
        conn.commit()

    cur.execute('''SELECT vac_id, news_company FROM news_nytimes''')
    new_news_nytimes_id_company = cur.fetchall()

    cur.execute('''SELECT vac_id, company FROM news WHERE category = 'S' AND vac_id = -1 
                ORDER BY date DESC, key DESC''')
    news_id_company = cur.fetchall()

    # Check if new id exists when vac_id = -1 is in news_id_company
    for i in range(len(news_id_company)):
        if news_id_company[i][0] == -1:
            found_news_nytimes_index = -1
            for j in range(len(new_news_nytimes_id_company)):
                if new_news_nytimes_id_company[j][1] == news_id_company[i][1]:
                    found_news_nytimes_index = j
            if found_news_nytimes_index != -1:
                new_news_updated_id = new_news_nytimes_id_company[found_news_nytimes_index][0]
                if new_news_updated_id != -1:
                    cur.execute('''UPDATE news SET vac_id = %s WHERE company = %s''',
                                (new_news_updated_id, new_news_nytimes_id_company[found_news_nytimes_index][1]))
                    conn.commit()

    if existing_news_array:
        if latest_update_array[0][0] == existing_news_array[0][0]:
            news_update_response += "No Updates"
            # break
        else:
            for i in range(len(latest_update_array)):
                # if there is an update...
                if latest_update_array[i][0] == existing_news_array[0][0]:
                    news_update_response += str(i) + " update(s) found.||"
                    for j in range(1, i + 1):
                        # Change the format of the new update
                        update = arrange_nytimes_info(latest_update_array[i - j][0])
                        VaccineID = latest_update_array[i - j][3]
                        breaking_news_keywords = ["promising", "early approval", "effective", "emergency use"]
                        top_keywords = ["approved"]
                        tag = "New"

                        for keyword in top_keywords:
                            if keyword in update:
                                tag = "Top"

                        for keyword in breaking_news_keywords:
                            if keyword in update:
                                tag = "Breaking News"

                        cur.execute('''INSERT INTO news(key, vac_id, tag, company, news_text, date, category, source)
                            VALUES (DEFAULT, %s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'), %s, %s)''',
                                    (VaccineID,
                                     tag,
                                     latest_update_array[i - j][1].strip(),
                                     update,
                                     latest_update_array[i - j][2],
                                     'S',
                                     'The New York Times'))
                        conn.commit()

                        if VaccineID != -1:
                            if "Phase" in update:
                                # Algorithm to identify new Phase for vaccine
                                if "enters" in update or "enter" in update or "begins" in update or "begin" in update \
                                        or "moves into" in update or "move into" in update or "moves from" in update:
                                    new_phase = -1

                                    if "Phase I" in update:
                                        new_phase = 1
                                    if "Phase II" in update:
                                        new_phase = 2
                                    if "Phase III" in update:
                                        new_phase = 3

                                    if "Phase I/II" in update:
                                        new_phase = 2
                                    if "Phase II/III" in update:
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
                                        news_update_response += "Detected update keyword, INFO already updated.||"

                                    # If not updated and the algorithm can identify the new Phase
                                    if new_phase != -1 and not isUpdated:
                                        # update stage in info database
                                        cur.execute("UPDATE info SET stage = %s, update_date = CURRENT_DATE "
                                                    "WHERE vac_id = %s",
                                                    (new_phase, VaccineID))
                                        conn.commit()
                                        news_update_response += "Updated INFO database of VaccineID " + str(VaccineID) \
                                                                + " to Phase " + str(new_phase) + ".||"
                                        # Update phase3_start_date if new vaccine enters Phase 3
                                        if new_phase == 3:
                                            cur.execute("UPDATE info SET phase_3_start_date = CURRENT_DATE "
                                                        "WHERE vac_id = %s",
                                                        (VaccineID,))
                                            conn.commit()
                                            news_update_response += "Found new Phase 3 vaccine, updated INFO database of VaccineID " \
                                                                    + str(VaccineID) + "'s phase3_start_date to " + \
                                                                    str(now.strftime("%Y-%m-%d")) + ".||"
                                    # Return error if the algorithm cannot identify new Phase (new_phase = -1)
                                    elif new_phase == -1:
                                        news_update_response += "ERROR: Cannot find the stage number to update INFO database.||"

                    break

    # ------------------------------------------------------------------------------------------------------------------
    # Section 2: Update Vaccine Intro
    text = ""
    # local run
    # for child in soup:
    # # AWS Lambda run
    for child in nytimes_news_parent[0].parent.parent.parent:
        if isinstance(child, NavigableString):
            text += str(child)
        elif isinstance(child, Tag):
            if child.name == 'h2' and ("g-subhed" in child['class'] and "g-optimize-type" in child['class']
                                       and "g-filtered" in child['class']):
                text += '<split>'
            else:
                text += str(child)

    soup_split = text.split('<split>')

    platforms_found = len(soup_split) - 1

    new_data_array = []
    for i_platform, info in enumerate(soup_split):
        new_soup = BeautifulSoup(info, 'html.parser')

        if i_platform == 0:
            continue
        # Find all Approved count
        phase2_and_3_and_approved_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase2 g-filter-phase3 g-filter-approved"})
        phase3_and_approved_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase3 g-filter-approved"})
        approved_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-approved"})
        all_approved_intro = phase2_and_3_and_approved_company_intro + phase3_and_approved_company_intro + approved_company_intro
        # approved_count += len(all_approved_intro)

        # Find all Phase III intro
        phase2_and_3_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase2 g-filter-phase3"})
        phase3_and_limited_approval_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase3 g-filter-approved"})
        phase3_company_intro = new_soup.find_all('p',
                                                 attrs={"class": "g-body g-list-item g-filter-item g-filter-phase3"})
        all_phase3_intro = phase3_company_intro + phase3_and_limited_approval_company_intro + phase2_and_3_company_intro
        phase3_count += len(all_phase3_intro)

        # Find all Phase II intro
        phase2_company_intro = new_soup.find_all('p',
                                                 attrs={"class": "g-body g-list-item g-filter-item g-filter-phase2"})
        phase1_and_2_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase1 g-filter-phase2"})
        phase1_and_2_and_approval_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase1 g-filter-phase2 g-filter-approved"})
        all_phase2_intro = phase2_company_intro + phase1_and_2_company_intro + phase1_and_2_and_approval_intro
        phase2_count += len(all_phase2_intro)

        # Find all Phase I intro
        all_phase1_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase1"})
        phase1_count += len(all_phase1_company_intro)

        all_preclinical_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase0"})
        phase0_count += len(all_preclinical_intro)

        # Abandoned Intro
        abandoned_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-abandoned"})
        abandoned_count += len(abandoned_intro)

        all_vaccines_intro = all_approved_intro + all_phase3_intro + all_phase2_intro + all_phase1_company_intro + \
                             all_preclinical_intro + abandoned_intro
        for intro in all_vaccines_intro:
            vaccine_array = []
            discard = False
            for br in intro.find_all('br'):
                br.replace_with('<THIS IS A LINE BREAK>')
            intro_text = intro.text.replace('\n', '')
            intro_text = intro_text.replace('<THIS IS A LINE BREAK>', '\n')

            vaccine_info_html = intro.find_all('span', class_="g-info")
            candidate_name = ""
            efficacy = ""
            dose = ""
            injection_type = ""
            storage = ""

            if vaccine_info_html:
                all_intro_text = intro_text.split(vaccine_info_html[-1].text)[1] \
                    .split('\n\n', 1)[1].strip()
                all_intro_text = all_intro_text.replace('\n', ' ')

                vaccine_info_text = "Vaccine Name:" + \
                                    (intro_text.split(vaccine_info_html[0].text, 1)[1]
                                        .split('\n\n', 1)[0])

                vaccine_info_text_array = vaccine_info_text.split('\n')
                # print(vaccine_info_text_array)

                for vaccine_info in vaccine_info_text_array:
                    if "Vaccine Name" in vaccine_info:
                        start_index = vaccine_info.find(': ') + 2
                        if start_index != -1:
                            candidate_name = vaccine_info[start_index:]
                        else:
                            candidate_name = ""
                    if "Efficacy" in vaccine_info:
                        start_index = vaccine_info.find(': ') + 2
                        if start_index != -1:
                            efficacy = vaccine_info[start_index:]
                        else:
                            efficacy = ""
                    if "Dose" in vaccine_info:
                        start_index = vaccine_info.find(': ') + 2
                        if start_index != -1:
                            dose = vaccine_info[start_index:]
                        else:
                            dose = ""
                    if "Type" in vaccine_info:
                        start_index = vaccine_info.find(': ') + 2
                        if start_index != -1:
                            injection_type = vaccine_info[start_index:]
                        else:
                            injection_type = ""
                    if "Storage" in vaccine_info:
                        start_index = vaccine_info.find(': ') + 2
                        if start_index != -1:
                            storage = vaccine_info[start_index:]
                        else:
                            storage = ""
            else:
                all_intro_text = intro_text.replace('\n', ' ')

            # if vaccine_info_html:
            #     print(intro_text)

            update_time = intro.find('span', class_="g-updated")
            company_names = intro.find_all('strong')
            phase0 = intro.find('span', class_="g-phase0")
            phase1 = intro.find('span', class_="g-phase1")
            phase2 = intro.find('span', class_="g-phase2")
            phase3 = intro.find('span', class_="g-phase3")
            limited = intro.find('span', class_="g-limited")
            combined_phases = intro.find('span', class_="g-combined")
            paused = intro.find('span', class_="g-paused")
            abandoned = intro.find('span', class_="g-abandoned")
            approved = intro.find('span', class_="g-approval")

            company_string = ""
            # remove "how ... vaccine works"
            # print(company_names)
            i_index = 0
            while i_index < len(company_names):
                # try:
                #     print(company_names[i].strong.a)
                # except AttributeError:
                #     continue
                if ("how" in company_names[i_index].text.lower() and "works" in company_names[i_index].text.lower()
                        or "Inside the B.1.1.7 Coronavirus Variant" in company_names[i_index].text.lower()):
                    company_names.remove(company_names[i_index])
                    i_index -= 1
                i_index += 1


            for i in range(len(company_names)):
                if "how" not in company_names[i].text.lower() and "works" not in company_names[i].text.lower() and \
                        "Inside the B.1.1.7 Coronavirus Variant" not in company_names[i].text.lower():
                    if i == len(company_names) - 1:
                        company_string += company_names[i].text.strip()
                    else:
                        company_string += company_names[i].text.strip() + ", "

            if "Finlay Vaccine Institute" in company_string and "Soberana 2" in all_intro_text:
                company_string += "-2"

            if "Center for Genetic Engineering and Biotechnology of Cuba" in company_string and "Abadala" in all_intro_text:
                company_string += "-2"

            index = get_close_matches_indexes(company_string, company_array_possibilities, n=1, cutoff=0.7)
            try:
                vaccine_id = info_id_and_company[index[0]][0]
            except IndexError:
                vaccine_id = -1
                # Find match for vaccines with multiple companies - rearrange the order in company_string
                # Iterate through every possible combination of company names to find match
                if len(company_names) > 1:
                    count = 0
                    increment = 0
                    while count < len(company_names) and vaccine_id == -1:
                        order_start = 1 + increment
                        order_count = 0
                        if order_start >= len(company_names):
                            order_start = 0
                        new_company_string = ""
                        while order_count < len(company_names):
                            if order_count == len(company_names) - 1:
                                new_company_string += company_names[order_start].text.strip()
                            else:
                                new_company_string += company_names[order_start].text.strip() + ", "
                            order_count += 1
                            if order_start >= len(company_names) - 1:
                                order_start = 0
                            else:
                                order_start += 1

                        index = get_close_matches_indexes(new_company_string, company_array_possibilities, n=1,
                                                          cutoff=0.8)
                        try:
                            vaccine_id = info_id_and_company[index[0]][0]
                            # id_response += "Found match for news #" + str(idx + 1) + \
                            #                " in try-except-2. Paired with VaccineID " + str(vaccine_id) + ".||"
                        except IndexError:
                            vaccine_id = -1
                        increment += 1
                        count += 1

                # Find match for vaccines with multiple companies but only one shows in news
                # Problem: possible repeats in companies!
                if vaccine_id == -1:
                    for a in range(len(info_id_and_company)):
                        each_id_company = company_array_possibilities[a].split(', ')
                        match = difflib.get_close_matches(company_string, each_id_company, n=1, cutoff=1.0)
                        if match:
                            vaccine_id = info_id_and_company[a][0]
                            # intro_id_response += "Found match for news #" + str(idx + 1) + \
                            #                " in try-except-1. Paired with VaccineID " + str(vaccine_id) + ".||"
                            break
                        else:
                            vaccine_id = -1

                if vaccine_id == -1:
                    modified_string = company_string + " Biological"
                    index = get_close_matches_indexes(modified_string, company_array_possibilities, n=1, cutoff=0.7)
                    try:
                        vaccine_id = info_id_and_company[index[0]][0]
                        # id_response += "Found match for news #" + str(idx + 1) + \
                        #                " in try-except-3. Paired with VaccineID " + str(vaccine_id) + ".||"
                    except IndexError:
                        vaccine_id = -1
            if "-2" in company_string:
                company_string = company_string.replace('-2', '')

            vaccine_stage = -1
            is_combined_phases = False
            is_early = False
            is_paused = False
            is_abandoned = False
            # Remove Tags from Intro
            if phase0 is not None and phase0.text in intro.text:
                all_intro_text = all_intro_text.replace(phase0.text, '')
                vaccine_stage = 0
            if phase1 is not None and phase1.text in intro.text:
                all_intro_text = all_intro_text.replace(phase1.text, '')
                vaccine_stage = 1
            if phase2 is not None and phase2.text in intro.text:
                all_intro_text = all_intro_text.replace(phase2.text, '')
                vaccine_stage = 2
            if phase3 is not None and phase3.text in intro.text:
                all_intro_text = all_intro_text.replace(phase3.text, '')
                vaccine_stage = 3
            if limited is not None and limited.text in intro.text:
                all_intro_text = all_intro_text.replace(limited.text, '')
                is_early = True
                limited_count += 1
            if approved is not None and approved.text in intro.text:
                all_intro_text = all_intro_text.replace(approved.text, '')
                vaccine_stage = 4
                approved_count += 1
            if combined_phases is not None and combined_phases.text in intro.text:
                all_intro_text = all_intro_text.replace(combined_phases.text, '')
                is_combined_phases = True
            if paused is not None and paused.text in intro.text:
                all_intro_text = all_intro_text.replace(paused.text, '')
                is_paused = True
                paused_count += 1
            if abandoned is not None and abandoned.text in intro.text:
                all_intro_text = all_intro_text.replace(abandoned.text, '')
                is_abandoned = True

            # Discard the "Other" section of Pre-Clinical from NYTimes
            if vaccine_stage == 0 and "Other" in company_string and ":" in all_intro_text:
                discard = True

            date = ""
            # Remove final "updated" time in Intro
            if update_time is not None and update_time.text in all_intro_text:
                date = update_time.text.replace('Updated ', '')
                if "June" in date:
                    date = date.replace('June', 'Jun.')
                if "July" in date:
                    date = date.replace('July', 'Jul.')
                if "Sept." in date:
                    date = date.replace('Sept.', 'Sep.')
                date += " " + str(now.year)
                all_intro_text = all_intro_text.replace(update_time.text, '')

            if update_time is None:
                date = ""

            formatted_intro = all_intro_text.replace('\n', '').replace('  ', ' ')
            formatted_intro = formatted_intro.strip()
            if i_platform == 1:
                vaccine_platform = "Genetic"
            elif i_platform == 2:
                vaccine_platform = "Viral Vector"
            elif i_platform == 3:
                vaccine_platform = "Protein-Based"
            elif i_platform == 4:
                vaccine_platform = "Inactivated or Attenuated"
            elif i_platform == 5:
                vaccine_platform = "Repurposed"
            else:
                vaccine_platform = ""
            # print(formatted_intro)
            if not discard:
                vaccine_array.append(vaccine_id)
                vaccine_array.append(vaccine_stage)
                vaccine_array.append(company_string)
                vaccine_array.append(formatted_intro)  # Formatting - remove redundant new lines
                vaccine_array.append(date)
                vaccine_array.append(str(is_combined_phases))
                vaccine_array.append(str(is_early))
                vaccine_array.append(str(is_paused))
                vaccine_array.append(str(is_abandoned))
                vaccine_array.append(vaccine_platform)

                vaccine_array.append(candidate_name)
                vaccine_array.append(efficacy)
                vaccine_array.append(dose)
                vaccine_array.append(injection_type)
                vaccine_array.append(storage)

                new_data_array.append(vaccine_array)

    # Get last fetched data from database
    cur.execute("SELECT vac_id, stage, company_name, vaccine_intro, date, combined_phases, "
                "early_approval, paused, abandoned, platform, candidate, efficacy, dose, "
                "injection_type, storage from nytimes ORDER BY intro_id;")
    existing_data_array = cur.fetchall()
    cur.execute("rollback")
    existing_id_array = []
    for i in range(len(existing_data_array)):
        existing_id = existing_data_array[i][0]
        existing_id_array.append(existing_id)

    for i in range(len(new_data_array)):
        new_vaccine_id = new_data_array[i][0]
        new_stage = new_data_array[i][1]
        new_company_name = new_data_array[i][2]
        new_vaccine_intro = arrange_nytimes_info(new_data_array[i][3])
        new_date = new_data_array[i][4]
        new_is_combined_phases = str(new_data_array[i][5])
        new_is_early = str(new_data_array[i][6])
        new_is_paused = str(new_data_array[i][7])
        new_is_abandoned = str(new_data_array[i][8])
        new_vaccine_platform = new_data_array[i][9]
        new_candidate_name = new_data_array[i][10]
        new_efficacy = new_data_array[i][11]
        new_dose = new_data_array[i][12]
        new_injection_type = new_data_array[i][13]
        new_storage = new_data_array[i][14]

        try:
            old_vaccine_id = existing_data_array[i][0]
            old_stage = existing_data_array[i][1]
            old_company_name = existing_data_array[i][2]
            old_vaccine_intro = arrange_nytimes_info(existing_data_array[i][3])
            old_date = existing_data_array[i][4]
            old_is_combined_phases = str(existing_data_array[i][5])
            old_is_early = str(existing_data_array[i][6])
            old_is_paused = str(existing_data_array[i][7])
            old_is_abandoned = str(existing_data_array[i][8])
            old_vaccine_platform = existing_data_array[i][9]
            old_candidate_name = existing_data_array[i][10]
            old_efficacy = existing_data_array[i][11]
            old_dose = existing_data_array[i][12]
            old_injection_type = existing_data_array[i][13]
            old_storage = existing_data_array[i][14]
        except IndexError:
            # New intro might be longer than old - assign default values that would not match
            old_vaccine_id = -1000
            old_stage = -1
            old_company_name = ""
            old_vaccine_intro = ""
            old_date = ""
            old_is_combined_phases = "False"
            old_is_early = "False"
            old_is_paused = "False"
            old_is_abandoned = "False"
            old_vaccine_platform = ""
            old_candidate_name = ""
            old_efficacy = ""
            old_dose = ""
            old_injection_type = ""
            old_storage = ""

        proceed = False
        found_index = -1
        # Add check
        if new_vaccine_id == old_vaccine_id:
            proceed = True
        else:
            if new_vaccine_id in existing_id_array:
                for idx, existing_vaccine_id in enumerate(existing_id_array):
                    if new_vaccine_id == existing_vaccine_id:
                        found_index = idx
                        old_vaccine_id = existing_data_array[found_index][0]
                        old_stage = existing_data_array[found_index][1]
                        old_company_name = existing_data_array[found_index][2]
                        old_vaccine_intro = arrange_nytimes_info(existing_data_array[found_index][3])
                        old_date = existing_data_array[found_index][4]
                        old_is_combined_phases = str(existing_data_array[found_index][5])
                        old_is_early = str(existing_data_array[found_index][6])
                        old_is_paused = str(existing_data_array[found_index][7])
                        old_is_abandoned = str(existing_data_array[found_index][8])
                        old_vaccine_platform = existing_data_array[found_index][9]
                        old_candidate_name = existing_data_array[found_index][10]
                        old_efficacy = existing_data_array[found_index][11]
                        old_dose = existing_data_array[found_index][12]
                        old_injection_type = existing_data_array[found_index][13]
                        old_storage = existing_data_array[found_index][14]
                        proceed = True
                        break

        if proceed:
            try:
                cur.execute("SELECT TO_DATE(%s, 'Mon FMDD YYYY') - %s AS interval, "
                            "TO_DATE(%s, 'Mon FMDD YYYY') - update_date AS info_interval, "
                            "allow_auto_update "
                            "FROM info "
                            "WHERE vac_id = %s",
                            (new_date, old_date, new_date, new_vaccine_id))
                info_data = cur.fetchone()
                date_interval = info_data[0]
                interval_info = info_data[1]
                allow_auto_update = info_data[2]
            except TypeError:
                date_interval = None
                interval_info = None
                allow_auto_update = False

            def update_date():
                global update_date_count
                # If update in date: interval!=0(not None)-->update; original None + new NOT None-->update
                if (date_interval is not None) or (old_date is None and new_date != ''):
                    # update date NYTimes
                    cur.execute("UPDATE nytimes SET date = TO_DATE(%s, 'Mon FMDD YYYY') WHERE vac_id = %s",
                                (new_date, new_vaccine_id))
                    conn.commit()

                    # If new date from NYTimes is older than info date, abort the update
                    if interval_info is not None and interval_info >= 0 and allow_auto_update:
                        cur.execute("UPDATE info SET update_date = TO_DATE(%s, 'Mon FMDD YYYY') WHERE info.vac_id = %s",
                                    (new_date, new_vaccine_id))
                        conn.commit()
                        update_date_count += 1

            # update stage
            if new_stage != old_stage and new_stage != -1:
                cur.execute("UPDATE nytimes SET stage = %s WHERE vac_id = %s", (new_stage, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET stage = %s WHERE vac_id = %s", (new_stage, new_vaccine_id))
                    conn.commit()
                    update_stage_count += 1
                    update_date()

            # update combined phases
            if new_is_combined_phases != old_is_combined_phases:
                # Update nytimes
                cur.execute("UPDATE nytimes SET combined_phases = %s WHERE vac_id = %s",
                            (new_is_combined_phases, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET combined_phases = %s WHERE vac_id = %s",
                                (new_is_combined_phases, new_vaccine_id))
                    conn.commit()
                    update_is_combined_count += 1
                    update_date()

            # update early
            if new_is_early != old_is_early:
                # Update nytimes
                cur.execute("UPDATE nytimes SET early_approval = %s WHERE vac_id = %s",
                            (new_is_early, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET early_approval = %s WHERE vac_id = %s",
                                (new_is_early, new_vaccine_id))
                    conn.commit()
                    update_is_early_count += 1
                    update_date()

            # update paused
            if new_is_paused != old_is_paused:
                # Update nytimes
                cur.execute("UPDATE nytimes SET paused = %s WHERE vac_id = %s", (new_is_paused, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET paused = %s WHERE vac_id = %s", (new_is_paused, new_vaccine_id))
                    conn.commit()
                    update_is_paused_count += 1
                    update_date()

            # update abandoned
            if new_is_abandoned != old_is_abandoned:
                # Update nytimes
                cur.execute("UPDATE nytimes SET abandoned = %s WHERE vac_id = %s", (new_is_abandoned, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET abandoned = %s WHERE vac_id = %s",
                                (new_is_abandoned, new_vaccine_id))
                    conn.commit()
                    update_is_abandoned_count += 1
                    update_date()

            # update candidate name
            if new_candidate_name != old_candidate_name:
                # Update nytimes
                cur.execute("UPDATE nytimes SET candidate = %s WHERE vac_id = %s",
                            (new_candidate_name, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET candidate_name = %s WHERE vac_id = %s",
                                (new_candidate_name, new_vaccine_id))
                    conn.commit()
                    update_date()

            # update efficacy
            if new_efficacy != old_efficacy:
                # Update nytimes
                cur.execute("UPDATE nytimes SET efficacy = %s WHERE vac_id = %s", (new_efficacy, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET efficacy = %s WHERE vac_id = %s",
                                (new_efficacy, new_vaccine_id))
                    conn.commit()
                    update_date()

            # update dose
            if new_dose != old_dose:
                # Update nytimes
                cur.execute("UPDATE nytimes SET dose = %s WHERE vac_id = %s", (new_dose, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET dose = %s WHERE vac_id = %s",
                                (new_dose, new_vaccine_id))
                    conn.commit()
                    update_date()

            # update injection_type
            if new_injection_type != old_injection_type:
                # Update nytimes
                cur.execute("UPDATE nytimes SET injection_type = %s WHERE vac_id = %s",
                            (new_injection_type, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET injection_type = %s WHERE vac_id = %s",
                                (new_injection_type, new_vaccine_id))
                    conn.commit()
                    update_date()

            # update storage
            if new_storage != old_storage:
                # Update nytimes
                cur.execute("UPDATE nytimes SET storage = %s WHERE vac_id = %s", (new_storage, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET storage = %s WHERE vac_id = %s",
                                (new_storage, new_vaccine_id))
                    conn.commit()
                    update_date()

            # If there is an update in vaccine intro
            new_intro_array = new_vaccine_intro.split('. ')
            old_intro_array = old_vaccine_intro.split('. ')

            new_intro_array = list(filter(None, new_intro_array))
            old_intro_array = list(filter(None, old_intro_array))

            formatted_new_intro = format_intro(new_intro_array)
            formatted_old_intro = format_intro(old_intro_array)
            # print(formatted_new_intro)

            # Get existing latest news from INFO
            cur.execute("SELECT latest_news FROM info WHERE vac_id = %s", (new_vaccine_id,))
            existing_latest_news = cur.fetchone()[0]

            if formatted_new_intro != formatted_old_intro:
                match_intro = False
                for new_intro in formatted_new_intro:
                    for old_intro in formatted_old_intro:
                        if new_intro == old_intro:
                            match_intro = True
                            break
                        else:
                            match_intro = False
                    # If intros do not match--> Update! NYTIMES: intro_update, vaccine_intro; INFO: intro/latest_news
                    if not match_intro:
                        cur.execute("SELECT intro_update FROM nytimes WHERE vac_id = %s", (new_vaccine_id,))
                        existing_update = cur.fetchone()[0]
                        # Format
                        new_intro = arrange_nytimes_info(new_intro)
                        isAlreadyUpdated = False
                        if "For more details, see" in new_intro:
                            isAlreadyUpdated = True
                        if existing_latest_news is not None:
                            cleaned_html_existing_latest_news = cleanhtml(existing_latest_news)
                            existing_latest_news_array = cleaned_html_existing_latest_news.replace('<br><br>', ' ') \
                                .replace('<br>', ' ').replace('\xa0', ' ').split('. ')
                            formatted_existing_latest_news = format_intro(existing_latest_news_array)
                            for formatted_news in formatted_existing_latest_news:
                                similarity_score = similar(formatted_news, new_intro)
                                if similarity_score >= 0.9:
                                    isAlreadyUpdated = True

                        if not isAlreadyUpdated:
                            if existing_update is not None and new_intro.strip() not in existing_update:
                                new_update = existing_update + new_intro
                            else:
                                new_update = new_intro

                            # Update database
                            cur.execute("UPDATE nytimes SET intro_update = %s WHERE vac_id = %s",
                                        (new_update, new_vaccine_id))
                            conn.commit()

            new_vaccine_intro = ''.join(intro for intro in formatted_new_intro)
            cur.execute("UPDATE nytimes SET vaccine_intro = %s WHERE vac_id = %s",
                        (new_vaccine_intro, new_vaccine_id))
            conn.commit()

            cur.execute("SELECT intro_update FROM nytimes WHERE vac_id = %s", (new_vaccine_id,))
            intro_updates = cur.fetchone()[0]
            # Update INFO
            if allow_auto_update and intro_updates is not None and intro_updates != '':
                intro_updates = intro_updates.strip()

                def update_info(updated_latest_news_info):
                    global update_message, update_intro_count
                    # Update INFO
                    cur.execute("UPDATE info SET latest_news = %s WHERE vac_id = %s",
                                (updated_latest_news_info, new_vaccine_id))
                    conn.commit()
                    # Update date
                    update_date()
                    update_message += "Updated latest news of VaccineID " + str(new_vaccine_id) + ", new contents: " \
                                      + intro_updates + "|| "
                    update_intro_count += 1

                if now.strftime("%B") in intro_updates and hasNumbers(intro_updates):
                    if existing_latest_news is not None:
                        if intro_updates.lower().replace(',', '') not in existing_latest_news.lower().replace(',', ''):
                            updated_latest_news = intro_updates + "<br><br>" + existing_latest_news
                            update_info(updated_latest_news)
                    else:
                        updated_latest_news = intro_updates
                        update_info(updated_latest_news)
                else:
                    # Update intro section if current month not in intro_updates
                    cur.execute("SELECT intro FROM info WHERE vac_id = %s", (new_vaccine_id,))
                    existing_intro = cur.fetchone()[0]
                    if existing_intro is not None and existing_intro != '':
                        if len(intro_updates) >= 200:
                            updated_intro = existing_intro + "<br><br>" + intro_updates
                        else:
                            updated_intro = existing_intro + " " + intro_updates
                    else:
                        updated_intro = intro_updates
                    cur.execute("UPDATE info SET intro = %s WHERE vac_id = %s",
                                (updated_intro, new_vaccine_id))

                # clear intro_update
                cur.execute("UPDATE nytimes SET intro_update = %s WHERE vac_id = %s", ('', new_vaccine_id))
                conn.commit()

        else:
            if old_company_name != new_company_name:
                if new_vaccine_id == -1:
                    cur.execute("SELECT vac_id, company FROM info WHERE stage < 2")
                    alternate_info_id_and_company = cur.fetchall()
                    cur.execute("rollback")
                    info_company_array_possibilities = []
                    # Update data format - transform to 1d array
                    for j in range(len(alternate_info_id_and_company)):
                        info_company_array_possibilities.append(alternate_info_id_and_company[j][1])

                    index = get_close_matches_indexes(new_company_name, info_company_array_possibilities, n=1,
                                                      cutoff=0.7)
                    try:
                        new_vaccine_id = alternate_info_id_and_company[index[0]][0]
                    except IndexError:
                        new_vaccine_id = -1
                        # Find match for vaccines with multiple companies - rearrange the order in company_string
                        # Iterate through every possible combination of company names to find match
                        split_company_array = new_company_name.split(', ')
                        if ", " in new_company_name:
                            count = 0
                            increment = 0
                            while count < len(split_company_array) and new_vaccine_id == -1:
                                order_start = 1 + increment
                                order_count = 0
                                if order_start >= len(split_company_array):
                                    order_start = 0
                                new_company_string = ""
                                while order_count < len(split_company_array):
                                    if order_count == len(split_company_array) - 1:
                                        new_company_string += split_company_array[order_start].strip()
                                    else:
                                        new_company_string += split_company_array[order_start].strip() + ", "
                                    order_count += 1
                                    if order_start >= len(split_company_array) - 1:
                                        order_start = 0
                                    else:
                                        order_start += 1

                                index = get_close_matches_indexes(new_company_string, info_company_array_possibilities,
                                                                  n=1,
                                                                  cutoff=0.8)
                                try:
                                    new_vaccine_id = alternate_info_id_and_company[index[0]][0]
                                    # id_response += "Found match for news #" + str(idx + 1) + \
                                    #                " in try-except-2. Paired with VaccineID " + str(new_vaccine_id) + ".||"
                                except IndexError:
                                    new_vaccine_id = -1
                                increment += 1
                                count += 1

                        # Find match for vaccines with multiple companies but only one shows in news
                        # Problem: possible repeats in companies!
                        if new_vaccine_id == -1:
                            for a in range(len(alternate_info_id_and_company)):
                                each_id_company = info_company_array_possibilities[a].split(', ')
                                match = difflib.get_close_matches(new_company_name, each_id_company, n=1, cutoff=1.0)
                                if match:
                                    new_vaccine_id = alternate_info_id_and_company[a][0]
                                    # intro_id_response += "Found match for news #" + str(idx + 1) + \
                                    #                " in try-except-1. Paired with VaccineID " + str(new_vaccine_id) + ".||"
                                    break
                                else:
                                    new_vaccine_id = -1

                        if new_vaccine_id == -1:
                            modified_string = new_company_name + " Biological"
                            index = get_close_matches_indexes(modified_string, info_company_array_possibilities, n=1,
                                                              cutoff=0.7)
                            try:
                                new_vaccine_id = alternate_info_id_and_company[index[0]][0]
                                # id_response += "Found match for news #" + str(idx + 1) + \
                                #                " in try-except-3. Paired with VaccineID " + str(new_vaccine_id) + ".||"
                            except IndexError:
                                new_vaccine_id = -1

                # If cannot find vaccine_id--> Assign New ID
                if new_vaccine_id == -1:
                    cur.execute("SELECT vac_id FROM info ORDER BY vac_id DESC LIMIT 1")
                    new_assigned_id = cur.fetchone()[0] + 1
                    new_assigned_message += "Found new vaccine. Assigned ID " + str(new_assigned_id) + ".||"
                    # Update NYTimes table
                    if new_date == '':
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, combined_phases, early_approval,
                                                        paused, abandoned, platform, candidate, efficacy, dose, injection_type, storage, intro_id)
                                                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                    (
                                        new_assigned_id, new_stage, new_company_name, new_vaccine_intro,
                                        new_is_combined_phases, new_is_early, new_is_paused, new_is_abandoned,
                                        new_vaccine_platform, new_candidate_name,
                                        new_efficacy, new_dose, new_injection_type, new_storage, i))
                        conn.commit()

                    else:
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, date, combined_phases,
                                                        early_approval, paused, abandoned, platform, candidate, efficacy, dose, injection_type, storage, intro_id)
                                                        VALUES (%s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                    (new_assigned_id, new_stage, new_company_name, new_vaccine_intro, new_date,
                                     new_is_combined_phases, new_is_early, new_is_paused, new_is_abandoned,
                                     new_vaccine_platform, new_candidate_name,
                                     new_efficacy, new_dose, new_injection_type, new_storage, i))
                        conn.commit()

                    # Identify whether DNA or RNA for Genetic Vaccines
                    if new_vaccine_platform == "Genetic":
                        if "RNA" in new_vaccine_intro:
                            new_vaccine_platform = "RNA"
                        if "DNA" in new_vaccine_intro:
                            new_vaccine_platform = "DNA"

                    # Add <b> tag for companies in database
                    company_array = new_company_name.split(', ')
                    for company in company_array:
                        if company in new_vaccine_intro and "<b>" + company + "</b>" not in new_vaccine_intro:
                            intro_split_array = new_vaccine_intro.split(company, 1)
                            new_vaccine_intro = intro_split_array[0] + "<b>" + company + "</b>" + intro_split_array[1]

                    # Update INFO table
                    cur.execute('''INSERT INTO info(vac_id, stage, company, intro, country, vac_type,
                                update_date, combined_phases, early_approval, paused, abandoned, candidate_name, efficacy, dose, injection_type, storage)
                                                        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                (new_assigned_id, new_stage, new_company_name, new_vaccine_intro, '',
                                 new_vaccine_platform, new_is_combined_phases, new_is_early, new_is_paused,
                                 new_is_abandoned, new_candidate_name,
                                 new_efficacy, new_dose, new_injection_type, new_storage))
                    # Update COMPANIES table
                    cur.execute("INSERT INTO companies(vac_id, co_name, company_nytimes) VALUES (%s, %s, %s)",
                                (new_assigned_id, new_company_name, new_company_name))
                    conn.commit()

                    new_assigned_id_count += 1
                # If found vaccine_id --> update existing intro
                else:
                    new_vaccines_message += "Found new vaccine. Found match id " + str(new_vaccine_id) + ".||"
                    # Update NYTimes table
                    if new_date == '':
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, combined_phases, early_approval,
                                                        paused, abandoned, platform, candidate, efficacy, dose, injection_type, storage, intro_id)
                                                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                    (
                                        new_vaccine_id, new_stage, new_company_name, new_vaccine_intro,
                                        new_is_combined_phases, new_is_early, new_is_paused, new_is_abandoned,
                                        new_vaccine_platform, new_candidate_name,
                                        new_efficacy, new_dose, new_injection_type, new_storage, i))
                        conn.commit()

                    else:
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, date, combined_phases,
                                                        early_approval, paused, abandoned, platform, candidate, efficacy, dose, injection_type, storage, intro_id)
                                                        VALUES (%s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                    (new_vaccine_id, new_stage, new_company_name, new_vaccine_intro, new_date,
                                     new_is_combined_phases, new_is_early, new_is_paused, new_is_abandoned,
                                     new_vaccine_platform, new_candidate_name,
                                     new_efficacy, new_dose, new_injection_type, new_storage, i))
                        conn.commit()
                    try:
                        cur.execute("SELECT allow_auto_update "
                                    "FROM info "
                                    "WHERE vac_id = %s",
                                    (new_vaccine_id,))
                        allow_auto_update = cur.fetchone()[0]
                    except TypeError:
                        allow_auto_update = False

                    if allow_auto_update:
                        cur.execute("SELECT intro FROM info WHERE vac_id = %s", (new_vaccine_id,))
                        existing_intro = cur.fetchone()[0]
                        if existing_intro is not None and existing_intro != '':
                            updated_intro = existing_intro + "<br><br>" + new_vaccine_intro
                        else:
                            updated_intro = new_vaccine_intro
                        cur.execute("UPDATE info SET stage = %s, update_date = CURRENT_DATE, intro = %s, "
                                    "combined_phases = %s, early_approval = %s, paused = %s, abandoned = %s, "
                                    "candidate_name = %s, efficacy = %s, dose = %s, injection_type = %s, storage = %s "
                                    "WHERE vac_id = %s",
                                    (new_stage, updated_intro, new_is_combined_phases, new_is_early, new_is_paused,
                                     new_is_abandoned, new_candidate_name,
                                     new_efficacy, new_dose, new_injection_type, new_storage,
                                     new_vaccine_id))
                        new_vaccines_message += "Updated INFO.||"

                new_companies_added += 1
            else:
                new_vaccines_message += "ERROR: Found vaccine with same company, but different id."

    if not update_message:
        update_message = "No Updates"
    if not new_assigned_message:
        new_assigned_message = "No New ID"
    if not new_vaccines_message:
        new_vaccines_message = "No New Vaccines"
    if not id_response:
        id_response = "Matched all VaccineIDs successfully in the first round."

    return_response = {
        'URLStatusCode': result.status_code,

        'Updates': {
            'Latest News Update': news_update_response,
            'Intro Updates': {
                'date': update_date_count,
                'stage': update_stage_count,
                'combined_phases': update_is_combined_count,
                'early_approval': update_is_early_count,
                'paused': update_is_paused_count,
                'abandoned': update_is_abandoned_count,
                'intro': update_intro_count
            },
        },

        'Execution Details': {
            'platforms_found': platforms_found,
            'vaccine_count': {
                'Pre-Clinical': phase0_count,
                'Phase I': phase1_count,
                'Phase II': phase2_count,
                'Phase III': phase3_count,
                'Limited': limited_count,
                'Approved': approved_count,
                'Paused': paused_count,
                'Abandoned': abandoned_count
            },
            'new_vaccines': {
                'total_new_added': new_companies_added,
                'number of vaccine_id assigned': new_assigned_id_count
            },
            'message': {
                'update_message': update_message,
                'new_assigned_id': new_assigned_message,
                'new_vaccines': new_vaccines_message
            }
        },

        'Algorithm': {
            'VaccineID Algorithm': id_response
        }

    }

    print(json.dumps(return_response))

    return return_response


auto_update_nytimes(1, 2)
