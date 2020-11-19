import json
import requests
from bs4 import BeautifulSoup, NavigableString, Tag
import psycopg2
from models.close_match_indexes import get_close_matches_indexes
from models.format_nytimes_intro import format_intro
from models.nytimes_to_panelixir_style import arrange_nytimes_info
import datetime
import difflib


def auto_update_nytimes(event, context):
    id_response = ""
    response = ""
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
        if news_breaking_news[i][1] > 3:
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

    # Find Latest News Section
    nytimes_news = soup.find_all('p', attrs={"class": "g-body"})
    latest_news = []
    for news in nytimes_news:
        if '•' in news.text:
            latest_news.append(news)

    latest_update_array = []
    for idx, news in enumerate(latest_news):
        news_array = []
        update_time = news.find('span', class_="g-updated")
        if "June" in update_time.text:
            update_time.text = update_time.text.replace('June', 'Jun.')
        if "July" in update_time.text:
            update_time.text = update_time.text.replace('July', 'Jul.')
        if "Sept." in update_time.text:
            update_time.text = update_time.text.replace('Sept.', 'Sep.')
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

            index = get_close_matches_indexes(company_string, company_array_possibilities, n=1, cutoff=0.7)
            try:
                vaccine_id = info_id_and_company[index[0]][0]
            except IndexError:
                # Find match for vaccines with multiple companies but only one shows in news
                # Problem: possible repeats in companies!
                for a in range(len(info_id_and_company)):
                    each_id_company = company_array_possibilities[a].split(', ')
                    match = difflib.get_close_matches(company_string, each_id_company, n=1, cutoff=1.0)
                    if match:
                        vaccine_id = info_id_and_company[a][0]
                        id_response += "Found match for news #" + str(idx + 1) + \
                                       " in try-except-1. Paired with VaccineID " + str(vaccine_id) + ".||"
                        break
                    else:
                        vaccine_id = -1

                # Find match for vaccines with multiple companies - rearrange the order in company_string
                # Iterate through every possible combination of company names to find match
                if vaccine_id == -1 and len(news_company) > 1:
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
                                new_company_string += news_company[order_start].a.text
                            else:
                                new_company_string += news_company[order_start].a.text + ", "
                            order_count += 1
                            if order_start >= len(news_company) - 1:
                                order_start = 0
                            else:
                                order_start += 1

                        index = get_close_matches_indexes(new_company_string, company_array_possibilities, n=1,
                                                          cutoff=0.6)
                        try:
                            vaccine_id = info_id_and_company[index[0]][0]
                            id_response += "Found match for news #" + str(idx + 1) + \
                                           " in try-except-2. Paired with VaccineID " + str(vaccine_id) + ".||"
                        except IndexError:
                            vaccine_id = -1
                        increment += 1
                        count += 1

                if vaccine_id == -1:
                    modified_string = company_string + " Biological"
                    index = get_close_matches_indexes(modified_string, company_array_possibilities, n=1, cutoff=0.7)
                    try:
                        vaccine_id = info_id_and_company[index[0]][0]
                        id_response += "Found match for news #" + str(idx + 1) + \
                                       " in try-except-3. Paired with VaccineID " + str(vaccine_id) + ".||"
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
            response += "No Updates"
            break
        else:
            # if there is an update...
            if latest_update_array[i][0] == existing_news_array[0][0]:
                response += str(i) + " update(s) found.||"
                for j in range(1, i + 1):
                    # Change the format of the new update
                    update = arrange_nytimes_info(latest_update_array[i - j][0])
                    VaccineID = latest_update_array[i - j][3]
                    breaking_news_keywords = ["promising", "early approval"]
                    tag = "New"
                    for keyword in breaking_news_keywords:
                        if keyword in update:
                            tag = "Breaking News"

                    cur.execute('''INSERT INTO news(key, vac_id, tag, company, news_text, date)
                        VALUES (DEFAULT, %s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'))''',
                                (VaccineID,
                                 tag,
                                 latest_update_array[i - j][1],
                                 update,
                                 latest_update_array[i - j][2]))
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
                                    response += "No INFO update executed."

                                # If not updated and the algorithm can identify the new Phase
                                if new_phase != -1 and not isUpdated:
                                    # update stage in info database
                                    cur.execute("UPDATE info SET stage = %s, update_date = CURRENT_DATE "
                                                "WHERE vac_id = %s",
                                                (new_phase, VaccineID))
                                    conn.commit()
                                    response += "Updated INFO database of VaccineID " + str(VaccineID) \
                                                + " to Phase " + str(new_phase) + ".||"
                                # Return error if the algorithm cannot identify new Phase (new_phase = -1)
                                elif new_phase == -1:
                                    response += "ERROR: Cannot find the keyword in NEWS to update INFO database.||"
                break

    # ------------------------------------------------------------------------------------------------------------------
    # Section 2: Update Vaccine Intro
    update_date_count = 0
    update_stage_count = 0
    update_is_early_count = 0
    update_is_paused_count = 0
    update_is_combined_count = 0
    update_intro_count = 0
    new_companies_added = 0
    new_assigned_id_count = 0

    phase0_count = 0
    phase1_count = 0
    phase2_count = 0
    phase3_count = 0

    vaccine_platform_heading = soup.find_all('h2', attrs={"class": "g-subhed g-optimize-type g-filtered"})
    # print(vaccine_platform_heading)
    text = ''
    for child in soup:
        if isinstance(child, NavigableString):
            text += str(child)
        elif isinstance(child, Tag):
            # print(child['class'])
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

        # Find all Phase III intro
        phase2_and_3_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase2 g-filter-phase3"})
        phase3_and_limited_approval_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase3 g-filter-approved"})
        phase3_company_intro = new_soup.find_all('p', attrs={"class": "g-body g-list-item g-filter-item g-filter-phase3"})
        all_phase3_intro = phase3_company_intro + phase3_and_limited_approval_company_intro + phase2_and_3_company_intro
        phase3_count += len(all_phase3_intro)

        # Find all Phase II intro
        phase2_company_intro = new_soup.find_all('p', attrs={"class": "g-body g-list-item g-filter-item g-filter-phase2"})
        phase1_and_2_company_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase1 g-filter-phase2"})
        phase1_and_2_and_approval_intro = new_soup.find_all('p', attrs={
            "class": "g-body g-list-item g-filter-item g-filter-phase1 g-filter-phase2 g-filter-approved"})
        all_phase2_intro = phase2_company_intro + phase1_and_2_company_intro + phase1_and_2_and_approval_intro
        phase2_count += len(all_phase2_intro)

        # Find all Phase I intro
        all_phase1_company_intro = new_soup.find_all('p', attrs={"class": "g-body g-list-item g-filter-item g-filter-phase1"})
        phase1_count += len(all_phase1_company_intro)

        all_preclinical_intro = new_soup.find_all('p', attrs={"class": "g-body g-list-item g-filter-item g-filter-phase0"})
        phase0_count += len(all_preclinical_intro)

        all_vaccines_intro = all_phase3_intro + all_phase2_intro + all_phase1_company_intro + all_preclinical_intro

        for intro in all_vaccines_intro:
            vaccine_array = []
            discard = False
            for br in intro.find_all('br'):
                br.replace_with(' ')
            intro_text = intro.text

            update_time = intro.find('span', class_="g-updated")
            company_names = intro.find_all('strong')
            phase0 = intro.find('span', class_="g-phase0")
            phase1 = intro.find('span', class_="g-phase1")
            phase2 = intro.find('span', class_="g-phase2")
            phase3 = intro.find('span', class_="g-phase3")
            limited = intro.find('span', class_="g-limited")
            combined_phases = intro.find('span', class_="g-combined")
            paused = intro.find('span', class_="g-paused")

            company_string = ""
            for i in range(len(company_names)):
                if i == len(company_names) - 1:
                    company_string += company_names[i].text
                else:
                    company_string += company_names[i].text + ", "
            if "Finlay Vaccine Institute" in company_string and "Sovereign 2" in intro_text:
                company_string += "-2"

            index = get_close_matches_indexes(company_string, company_array_possibilities, n=1, cutoff=0.7)
            try:
                vaccine_id = info_id_and_company[index[0]][0]
            except IndexError:
                vaccine_id = -1
                # Find match for vaccines with multiple companies but only one shows in news
                # Problem: possible repeats in companies!
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

                # Find match for vaccines with multiple companies - rearrange the order in company_string
                # Iterate through every possible combination of company names to find match
                if vaccine_id == -1 and len(company_names) > 1:
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
                                new_company_string += company_names[order_start].text
                            else:
                                new_company_string += company_names[order_start].text + ", "
                            order_count += 1
                            if order_start >= len(company_names) - 1:
                                order_start = 0
                            else:
                                order_start += 1

                        index = get_close_matches_indexes(new_company_string, company_array_possibilities, n=1,
                                                          cutoff=0.6)
                        try:
                            vaccine_id = info_id_and_company[index[0]][0]
                            # id_response += "Found match for news #" + str(idx + 1) + \
                            #                " in try-except-2. Paired with VaccineID " + str(vaccine_id) + ".||"
                        except IndexError:
                            vaccine_id = -1
                        increment += 1
                        count += 1

                if vaccine_id == -1:
                    modified_string = company_string + " Biological"
                    index = get_close_matches_indexes(modified_string, company_array_possibilities, n=1, cutoff=0.7)
                    try:
                        vaccine_id = info_id_and_company[index[0]][0]
                        # id_response += "Found match for news #" + str(idx + 1) + \
                        #                " in try-except-3. Paired with VaccineID " + str(vaccine_id) + ".||"
                    except IndexError:
                        vaccine_id = -1

            company_string = company_string.replace('-2', '')

            vaccine_stage = -1
            is_combined_phases = False
            is_early = False
            is_paused = False
            # Remove Tags from Intro
            if phase0 is not None and phase0.text in intro_text:
                intro_text = intro_text.replace(phase0.text, '')
                vaccine_stage = 0
            if phase1 is not None and phase1.text in intro_text:
                intro_text = intro_text.replace(phase1.text, '')
                vaccine_stage = 1
            if phase2 is not None and phase2.text in intro_text:
                intro_text = intro_text.replace(phase2.text, '')
                vaccine_stage = 2
            if combined_phases is not None and combined_phases.text in intro_text:
                intro_text = intro_text.replace(combined_phases.text, '')
                is_combined_phases = True
            if phase3 is not None and phase3.text in intro_text:
                intro_text = intro_text.replace(phase3.text, '')
                vaccine_stage = 3
            if limited is not None and limited.text in intro_text:
                intro_text = intro_text.replace(limited.text, '')
                is_early = True
            if paused is not None and paused.text in intro_text:
                intro_text = intro_text.replace(paused.text, '')
                is_paused = True

            # Discard the "Other" section of Pre-Clinical from NYTimes
            if vaccine_stage == 0 and "Other" in company_string and ":" in intro_text:
                discard = True

            date = ""
            # Remove final "updated" time in Intro
            if update_time is not None and update_time.text in intro_text:
                date = update_time.text.replace('Updated ', '')
                if "June" in date:
                    date = date.replace('June', 'Jun.')
                if "July" in date:
                    date = date.replace('July', 'Jul.')
                if "Sept." in date:
                    date = date.replace('Sept.', 'Sep.')
                date += " " + str(now.year)
                intro_text = intro_text.replace(update_time.text, '')

            if update_time is None:
                date = ""

            formatted_intro = intro_text.replace('\n', '').replace('  ', ' ')
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
                vaccine_array.append(vaccine_platform)

                new_data_array.append(vaccine_array)

    # Get last fetched data from database
    cur.execute("SELECT * from nytimes ORDER BY intro_id;")
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
        new_vaccine_intro = new_data_array[i][3]
        new_date = new_data_array[i][4]
        new_is_combined_phases = str(new_data_array[i][5])
        new_is_early = str(new_data_array[i][6])
        new_is_paused = str(new_data_array[i][7])
        new_vaccine_platform = new_data_array[i][8]

        old_vaccine_id = existing_data_array[i][0]
        old_stage = existing_data_array[i][1]
        old_company_name = existing_data_array[i][2]
        old_vaccine_intro = existing_data_array[i][3]
        old_date = existing_data_array[i][4]
        old_is_combined_phases = str(existing_data_array[i][5])
        old_is_early = str(existing_data_array[i][6])
        old_is_paused = str(existing_data_array[i][7])
        old_vaccine_platform = existing_data_array[i][8]

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
                        old_vaccine_intro = existing_data_array[found_index][3]
                        old_date = existing_data_array[found_index][4]
                        old_is_combined_phases = str(existing_data_array[found_index][5])
                        old_is_early = str(existing_data_array[found_index][6])
                        old_is_paused = str(existing_data_array[found_index][7])
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

            # If update in date: interval!=0(not None)-->update; original None + new NOT None-->update
            if (date_interval != 0 and date_interval is not None) or (old_date is None and new_date != ''):
                # update date
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
            if new_stage != old_stage:
                cur.execute("UPDATE nytimes SET stage = %s WHERE vac_id = %s", (new_stage, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET stage = %s WHERE vac_id = %s", (new_stage, new_vaccine_id))
                    conn.commit()
                    update_stage_count += 1

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

            # update paused
            if new_is_paused != old_is_paused:
                # Update nytimes
                cur.execute("UPDATE nytimes SET paused = %s WHERE vac_id = %s", (new_is_paused, new_vaccine_id))
                conn.commit()

                if allow_auto_update:
                    cur.execute("UPDATE info SET paused = %s WHERE vac_id = %s", (new_is_paused, new_vaccine_id))
                    conn.commit()
                    update_is_paused_count += 1

            # If there is an update in vaccine intro
            new_intro_array = new_vaccine_intro.split('. ')
            old_intro_array = old_vaccine_intro.split('. ')

            new_intro_array = list(filter(None, new_intro_array))
            old_intro_array = list(filter(None, old_intro_array))

            formatted_new_intro = format_intro(new_intro_array)
            formatted_old_intro = format_intro(old_intro_array)

            if formatted_new_intro != formatted_old_intro:
                match_intro = False
                for new_intro in formatted_new_intro:
                    # new_intro = new_intro.strip()
                    for old_intro in formatted_old_intro:
                        # old_intro = old_intro.strip()
                        if new_intro == old_intro:
                            match_intro = True
                            break
                        else:
                            match_intro = False
                    # If intros do not match--> Update! NYTIMES: intro_update, vaccine_intro; INFO: intro/latest_news
                    if not match_intro:
                        cur.execute("SELECT intro_update FROM nytimes WHERE vac_id = %s", (new_vaccine_id,))
                        existing_update = cur.fetchone()[0]
                        # Update database
                        if existing_update is not None:
                            new_update = existing_update + new_intro
                        else:
                            new_update = new_intro
                        # Update format of new_update
                        new_update = arrange_nytimes_info(new_update)
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
                cur.execute("SELECT latest_news FROM info WHERE vac_id = %s", (new_vaccine_id,))
                existing_latest_news = cur.fetchone()[0]
                try:
                    updated_latest_news = intro_updates + "<br><br>" + existing_latest_news
                # If existing_latest_news is None -- raise TypeError
                except TypeError:
                    updated_latest_news = intro_updates
                cur.execute("UPDATE info SET latest_news = %s WHERE vac_id = %s",
                            (updated_latest_news, new_vaccine_id))
                conn.commit()

                # clear intro_update after update
                cur.execute("UPDATE nytimes SET intro_update = %s WHERE vac_id = %s", ('', new_vaccine_id))
                conn.commit()
                update_intro_count += 1

        else:
            if old_company_name != new_company_name:
                if new_vaccine_id == -1:
                    cur.execute("SELECT vac_id, company FROM info")
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
                        # Find match for vaccines with multiple companies but only one shows in news
                        # Problem: possible repeats in companies!
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
                        split_company_array = new_company_name.split(', ')
                        # Find match for vaccines with multiple companies - rearrange the order in company_string
                        # Iterate through every possible combination of company names to find match
                        if new_vaccine_id == -1 and ", " in new_company_name:
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
                                        new_company_string += split_company_array[order_start]
                                    else:
                                        new_company_string += split_company_array[order_start] + ", "
                                    order_count += 1
                                    if order_start >= len(split_company_array) - 1:
                                        order_start = 0
                                    else:
                                        order_start += 1

                                index = get_close_matches_indexes(new_company_string, info_company_array_possibilities,
                                                                  n=1,
                                                                  cutoff=0.6)
                                try:
                                    new_vaccine_id = alternate_info_id_and_company[index[0]][0]
                                    # id_response += "Found match for news #" + str(idx + 1) + \
                                    #                " in try-except-2. Paired with VaccineID " + str(new_vaccine_id) + ".||"
                                except IndexError:
                                    new_vaccine_id = -1
                                increment += 1
                                count += 1

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
                    # Update NYTimes table
                    if new_date == '':
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, combined_phases, early_approval,
                                                        paused, intro_id)
                                                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                                    (
                                        new_assigned_id, new_stage, new_company_name, new_vaccine_intro,
                                        new_is_combined_phases,
                                        new_is_early, new_is_paused, i))
                        conn.commit()

                    else:
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, date, combined_phases,
                                                        early_approval, paused, intro_id)
                                                        VALUES (%s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'), %s, %s, %s, %s)''',
                                    (new_assigned_id, new_stage, new_company_name, new_vaccine_intro, new_date,
                                     new_is_combined_phases, new_is_early, new_is_paused, i))
                        conn.commit()

                    # Update INFO table
                    cur.execute('''INSERT INTO info(vac_id, stage, company, intro, country, vac_type,
                                                        update_date, combined_phases, early_approval, paused)
                                                        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE, %s, %s, %s)''',
                                (new_assigned_id, new_stage, new_company_name, new_vaccine_intro, '',
                                 new_vaccine_platform, new_is_combined_phases, new_is_early, new_is_paused))
                    # Update COMPANIES table
                    cur.execute("INSERT INTO companies(vac_id, co_name, company_nytimes) VALUES (%s, %s, %s)",
                                (new_assigned_id, new_company_name, new_company_name))
                    conn.commit()

                    new_assigned_id_count += 1
                # If found vaccine_id --> update existing intro
                else:
                    # Update NYTimes table
                    if new_date == '':
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, combined_phases, early_approval,
                                                        paused, intro_id)
                                                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                                    (
                                        new_vaccine_id, new_stage, new_company_name, new_vaccine_intro,
                                        new_is_combined_phases,
                                        new_is_early, new_is_paused, i))
                        conn.commit()

                    else:
                        cur.execute('''INSERT INTO nytimes(vac_id, stage, company_name, vaccine_intro, date, combined_phases,
                                                        early_approval, paused, intro_id)
                                                        VALUES (%s, %s, %s, %s, TO_DATE(%s, 'Mon FMDD YYYY'), %s, %s, %s, %s)''',
                                    (new_vaccine_id, new_stage, new_company_name, new_vaccine_intro, new_date,
                                     new_is_combined_phases, new_is_early, new_is_paused, i))
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
                                    "combined_phases = %s, early_approval = %s, paused = %s",
                                    (new_stage, updated_intro, new_is_combined_phases, new_is_early, new_is_paused))

                new_companies_added += 1

    # TODO: Add exception handler: id different(not proceed), company same
    return_response = {
        'news_update': {
            'statusCode': 200,
            'VaccineID Algorithm': id_response,
            'News Update': response
        },

        'intro_update': {

            'statusCode': 200,
            'platforms_found': platforms_found,
            'vaccine_count': {
                'Pre-Clinical': phase0_count,
                'Phase I': phase1_count,
                'Phase II': phase2_count,
                'Phase III': phase3_count
            },
            'updates_count': {
                'date': update_date_count,
                'stage': update_stage_count,
                'combined_phases': update_is_combined_count,
                'early_approval': update_is_early_count,
                'paused': update_is_paused_count,
                'intro': update_intro_count
            },
            'new_vaccines': {
                'total_new_added': new_companies_added,
                'number of vaccine_id assigned': new_assigned_id_count
            }

        }
    }

    print(json.dumps(return_response))

    return return_response
