import random
import string
import os
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session
from flask_mail import Mail, Message
import psycopg2
import numpy as np
import json
import csv
from dotenv import load_dotenv

from models.models import Db, Vaccine
from modules.match_company_to_logo import match_logo
import modules.gapi as PanElixirGAPI
import google_auth
import forum


load_dotenv('.env')

application = app = Flask(__name__)
app.register_blueprint(PanElixirGAPI.app)
app.register_blueprint(google_auth.app)
app.register_blueprint(forum.app)

# # Send static files to subdomain
# app.add_url_rule('/static/<path:filename>',
#                  endpoint='static',
#                  subdomain='forum',
#                  view_func=app.send_static_file)
#
# app.config['SERVER_NAME'] = 'localhost:7000'

app.secret_key = ''.join(random.choice(string.printable)
                         for _ in range(20))

# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config.update(dict(
    MAIL_SERVER='smtp.googlemail.com',
    MAIL_PORT=465,
    MAIL_USE_TLS=False,
    MAIL_USE_SSL=True,
    MAIL_USERNAME='info.panelixir',
    MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD")
))
mail = Mail(app)

app.config['SQLALCHEMY_DATABASE_URI'] = \
    'postgresql://internetuser:welcometopanelixir@panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com/vaccinedb'
conn = psycopg2.connect(f'''host={os.environ.get('AWS_DATABASE_HOST')} dbname=vaccinedb 
                    user={os.environ.get('AWS_DATABASE_USER')} password={os.environ.get('AWS_DATABASE_PASSWORD')}''')
conn2 = psycopg2.connect(f'''host={os.environ.get('AWS_DATABASE_HOST')} dbname=vaccinedb 
                    user={os.environ.get('AWS_DATABASE_USER')} password={os.environ.get('AWS_DATABASE_PASSWORD')}''')
conn3 = psycopg2.connect(f'''host={os.environ.get('AWS_DATABASE_HOST')} dbname=vaccinedb 
                    user={os.environ.get('AWS_DATABASE_USER')} password={os.environ.get('AWS_DATABASE_PASSWORD')}''')
# conn = psycopg2.connect("dbname=vaccinedb user=postgres")
app.config['SQLALCHEMY_BINDS'] = {
    'vaccinedb': 'postgresql://postgres:iloveNYC0704@panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com/vaccinedb',
    'forumdb': 'postgresql://postgres:iloveNYC0704@panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com/forumdb'
}

# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://' \
#                                         'postgres:iloveNYC0704' \
#                                         '@panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com/vaccinedb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
Db.init_app(app)
cur = conn.cursor()
cur2 = conn2.cursor()
cur3 = conn3.cursor()

filter_limit = ""


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'static/favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/email-form-submission-beta-section', methods=['POST'])
def processEmailBetaSection():
    email = request.form['email']
    feedback = request.form['feedback']

    if not email:
        email = "anonymous user"

    msg = Message('Bay Area Feedback Form Submission',
                  sender='info.panelixir@gmail.com',
                  recipients=['tonyliunyc@hotmail.com'])
    msg.body = 'Feedback from ' + email + ': \n' + feedback
    mail.send(msg)
    session['submit'] = True

    return redirect(url_for('getSFBayAreaVaccination'))


@app.route('/email-form-submission-question', methods=['POST'])
def processEmailQuestion():
    feedback = request.form['question']

    msg = Message('New Question for FAQ',
                  sender='info.panelixir@gmail.com',
                  recipients=['tonyliunyc@hotmail.com'])
    msg.body = 'Question for Vaccination FAQs: ' + feedback
    mail.send(msg)
    session['submit'] = True

    return redirect(url_for('vaccineFAQ'))


@app.route('/', methods=['GET'])
def index():
    # if google_auth.is_logged_in():
    #     user_info = google_auth.get_user_info()
    cur.execute("SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
                "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
                "dose, injection_type, storage, abandoned, approved_countries, paused, limited_countries, "
                "side_effects, trial_size, age_group "
                "FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
                "ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company "
                "LIMIT 10")

    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data]) - insert logo at index 3
    match_logo(data, 8)

    cur.execute("SELECT vac_id, tag, company, news_text, TO_CHAR(date, 'Month FMDD'), source, category, link FROM news "
                "WHERE category = 'S' AND (CURRENT_DATE - date <= 30 OR tag='Top') "
                "ORDER BY CASE WHEN tag='Top' THEN tag END, date DESC, key DESC LIMIT 30")
    news_data = cur.fetchall()
    cur.execute("rollback")

    cur.execute("SELECT vac_id, tag, company, news_text, TO_CHAR(date, 'Month FMDD'), source, category, link FROM news "
                "WHERE category = 'G' AND (CURRENT_DATE - date <= 4 OR tag='Top') "
                "ORDER BY CASE WHEN tag='Top' THEN tag END, date DESC, key DESC LIMIT 45")
    general_news = cur.fetchall()
    for i in range(len(general_news)):
        news = list(general_news[i])
        for j in range(len(general_news[i])):
            if news[j] is None:
                news[j] = "None"
        general_news[i] = news
    cur.execute("rollback")

    cur.execute("SELECT tag, title, image, body, body_text, link, source, category FROM stories "
                # "WHERE category = 'H' "
                "ORDER BY CASE WHEN tag='Featured' THEN tag END, "
                "CASE WHEN tag='New' THEN tag END, "
                "date DESC LIMIT 1")
    top_headlines = cur.fetchall()
    cur.execute("rollback")

    cur.execute("SELECT tag, title, image, body, body_text, link, source, category FROM stories "
                "ORDER BY CASE WHEN tag='Featured' THEN tag END, "
                "CASE WHEN tag='New' THEN tag END, "
                "date DESC")
    stories = cur.fetchall()
    cur.execute("rollback")

    return render_template("index.html", data=data, news_data=news_data, top_headlines=top_headlines,
                           general_news=general_news, stories=stories)


@app.route("/desktop-form", methods=['GET'])
def desktopForm():
    global filter_limit
    desktop_stages = str(request.args.get('desktop_stage'))
    desktop_country = str(request.args.get('desktop_country'))
    desktop_type = str(request.args.get('desktop_type'))

    if desktop_stages == "4-1":
        desktop_stages = "_"
        filter_limit = "AND early_approval AND NOT abandoned"
    elif desktop_stages == "0-1":
        desktop_stages = "_"
        filter_limit = "AND abandoned"
    else:
        filter_limit = "AND NOT abandoned"

    print(desktop_type)
    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage, abandoned, approved_countries, paused, limited_countries, "
        "side_effects, trial_size, age_group"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE %s "
        " AND country LIKE %s "
        " AND (vac_type LIKE '%%" + desktop_type.replace("%", "%%") + "%%') "
        "" + filter_limit + " "
        "ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company",
        (f"%{desktop_stages}%", f"%{desktop_country}%")
    )

    data = cur.fetchall()
    cur.execute("rollback")
    total_rows = len(data)
    # if total_rows > 11:
    data = data[:10]
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("institutions.html", data=data, total_rows=total_rows)


@app.route("/card", methods=['GET'])
def card():
    desktop_stages = str(request.args.get('desktop_stage'))
    desktop_country = str(request.args.get('desktop_country'))
    desktop_type = str(request.args.get('desktop_type'))
    limit = int(request.args.get('limit'))
    count = int(request.args.get('count'))

    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage, abandoned, approved_countries, paused, limited_countries, "
        "side_effects, trial_size, age_group"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE %s "
        " AND country LIKE %s "
        " AND (vac_type LIKE '%" + desktop_type + "%') "
        "" + filter_limit + " "
        " ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company "
        # " OFFSET " + str(count * limit) + " ROWS"
        " FETCH FIRST %s ROWS ONLY",
        (f"%{desktop_stages}%", f"%{desktop_country}%", str((count + 1) * limit)))

    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)

    # if data:
    return render_template("card.html", data=data)


@app.route("/mobile-form", methods=['GET'])
def mobileForm():
    global filter_limit
    mobile_stages = str(request.args.get('mobile_stage'))
    mobile_country = str(request.args.get('mobile_country'))
    mobile_type = str(request.args.get('mobile_type'))

    if mobile_stages == "4-1":
        mobile_stages = "_"
        filter_limit = "AND early_approval AND NOT abandoned"
    elif mobile_stages == "0-1":
        mobile_stages = "_"
        filter_limit = "AND abandoned"
    else:
        filter_limit = "AND NOT abandoned"

    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news,  "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage, abandoned, approved_countries, paused, limited_countries, "
        "side_effects, trial_size, age_group"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE %s "
        " AND country LIKE %s "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + filter_limit + " "
        "ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company",
        (f"%{mobile_stages}%", f"%{mobile_country}%"))

    data = cur.fetchall()
    cur.execute("rollback")
    total_rows = len(data)
    data = data[:10]
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("institutions.html", data=data, total_rows=total_rows)


@app.route("/mobile-card", methods=['GET'])
def mobileAppendCards():
    mobile_stages = str(request.args.get('mobile_stage'))
    mobile_country = str(request.args.get('mobile_country'))
    mobile_type = str(request.args.get('mobile_type'))
    count = int(request.args.get('mobile_count'))
    limit = int(request.args.get('limit'))
    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage, abandoned, approved_countries, paused, limited_countries, "
        "side_effects, trial_size, age_group"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE %s "
        " AND country LIKE %s "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + filter_limit + " "
        " ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company"
        # " OFFSET " + str(count * limit) + " ROWS"
        " FETCH FIRST %s ROWS ONLY",
        (f"%{mobile_stages}%", f"%{mobile_country}%", str((count + 1) * limit)))

    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("card.html", data=data)


@app.route("/display-company", methods=['GET'])
def displayCompany():
    companyID = str(request.args.get('company_id'))
    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage, abandoned, approved_countries, paused, limited_countries, "
        "side_effects, trial_size, age_group"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE info.vac_id = %s ",
        (companyID,))
    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("card.html", data=data)


@app.route("/about-us")
def aboutUs():
    return render_template("about-us.html")


@app.route("/vaccine-developing-process")
def vaccineDevelopingProcess():
    return render_template("card-vaccine-developing-process.html")


@app.route("/vaccine-faq")
def vaccineFAQ():
    session_submit = False
    if 'submit' in session:
        session_submit = True
        session.clear()
    return render_template("vaccine-faq.html", session_submit=session_submit)


@app.route("/virus-variants")
def vaccineVirusVariants():
    return render_template("virus-variants.html")


@app.route("/bay-area-vaccination")
def getSFBayAreaVaccination():
    session_submit = False
    cur.execute("SELECT l.county, area, phase, info_website, appointment_website, doses_administered, "
                "doses_available, eligibility_text, body_text, additional_info, "
                "TO_CHAR(date, 'Month FMDDth, YYYY'), notification_website, population, "
                "l.administered_1, l.administered_2 "
                # ", (SELECT address, time_window FROM facilities WHERE l.id = cid LIMIT 1) "
                "FROM local_vaccinations l "
                # "LEFT OUTER JOIN facilities f ON l.id = f.cid "
                "ORDER BY l.id ")
    local_data = cur.fetchall()
    # print(local_data)
    cur.execute("rollback")

    cur.execute('''SELECT title, content, url, image_url, source, author, tag
               FROM "newsAPI" ORDER BY CASE WHEN tag = 'Top' THEN tag END, time DESC LIMIT 15''')
    local_news = cur.fetchall()
    cur.execute("rollback")

    if 'submit' in session:
        session_submit = True
        session.clear()

    return render_template("san-francisco-bay-area-info.html", local_data=local_data, local_news=local_news,
                           session_submit=session_submit)


@app.route("/get-bay-area-news")
def getBayAreaNews():
    limit = int(request.args.get('limit'))
    count = int(request.args.get('count'))
    cur.execute('''SELECT title, content, url, image_url, source, author, tag
               FROM "newsAPI" ORDER BY CASE WHEN tag = 'Top' THEN tag END, time DESC 
               OFFSET %s ROWS FETCH FIRST %s ROW ONLY''',
                (str(count * limit), str(limit)))
    local_news = cur.fetchall()
    cur.execute("rollback")
    return render_template("bay-area-news.html", local_news=local_news)


@app.route("/get_update_time", methods=['GET'])
def getUpdateTime():
    # cur.execute("SELECT TO_CHAR(update_date, 'Month FMDDth, YYYY') FROM "
    #             "(SELECT update_date FROM info "
    #             "WHERE update_date IS NOT NULL "
    #             "UNION "
    #             "SELECT date AS update_date FROM news "
    #             "ORDER BY update_date DESC LIMIT 1) AS date")
    # update_time = cur.fetchone()[0]
    # cur.execute("rollback")

    cur.execute("SELECT COUNT(*) FROM info")
    total_rows = cur.fetchone()[0]
    cur.execute("rollback")
    return json.dumps({'update_time': None, 'total_rows': total_rows})


@app.route("/get_local_data", methods=['GET'])
def getLocalData():
    cur.execute("SELECT county, area, phase, info_website, appointment_website, doses_administered, "
                "doses_available, eligibility_text, body_text, additional_info, "
                "TO_CHAR(date, 'Month FMDDth, YYYY') FROM local_vaccinations")
    local_data = cur.fetchone()[0]
    cur.execute("rollback")
    return render_template("san-francisco-bay-area-info.html", local_data=local_data)


@app.route("/get_bars_data", methods=['GET'])
def getBarsData():
    continent = str(request.args.get('continent'))
    if request.args.get('continent') is None or continent == "World":
        continent = ""

    # interactive bars
    cur.execute("SELECT json_agg(json_build_object('company', company,"
                " 'stage', stage,"
                " 'country', country,"
                " 'vac_id', info.vac_id, "
                " 'company', company)) "
                " FROM info "
                " INNER JOIN companies ON info.vac_id = companies.vac_id "
                " WHERE continent LIKE %s AND (abandoned = false OR abandoned IS NULL)"
                " GROUP BY stage, progress, phase3_start_date, company, efficacy"
                " ORDER BY stage DESC, progress DESC NULLS LAST,"
                " phase3_start_date NULLS LAST, company LIMIT 5;",
                (f"%{continent}%",))
    bars_data = cur.fetchall()
    cur.execute("rollback")

    # Add 'flag' to JSON - replace column 'flag' in database
    for data in bars_data:
        country_array = data[0][0]['country'].replace(', ', ',').split(',')
        flag_array = []
        for country in country_array:
            if country == "United States":
                country = "USA"
            if country == "United Kingdom":
                country = "UK"
            flag = '../static/img/flag/' + country.replace(' ', '') + '.png'
            flag_array.append(flag)
        data[0][0]['flag'] = flag_array

    # progress bar
    cur.execute("SELECT stage, COUNT(stage) as count "
                " FROM info "
                " WHERE continent LIKE %s AND (abandoned = false OR abandoned IS NULL)"
                " GROUP BY stage ORDER BY stage",
                (f"%{continent}%", ))
    continent_data = np.array(cur.fetchall(), dtype=object)
    cur.execute("rollback")

    # cur.execute("SELECT COUNT(early_approval) as count "
    #             " FROM info "
    #             " WHERE continent LIKE %s AND (abandoned = false OR abandoned IS NULL)"
    #             " AND early_approval",
    #             # " GROUP BY early_approval",
    #             ("%" + continent + "%",))
    # limited_count = cur.fetchall()[0][0]
    # print(limited_count)
    # cur.execute("rollback")

    data_arr = []
    for i in range(5):
        found = False
        for j in continent_data:
            if i == j[0]:
                data_arr.append(j[1])
                found = True
        if not found:
            data_arr.append(0)
    # data_arr.insert(4, limited_count)

    bars_data_json = {'bars_data': []}
    for i in range(len(bars_data)):
        bars_data_json['bars_data'].append(bars_data[i][0][0])

    return json.dumps({'count': data_arr, 'bars_data': bars_data_json})


@app.route('/load_data', methods=['GET'])
def load_data():
    # map data - uses SQLAlchemy models/models.py/Vaccine
    vaccines_json = {'vaccines': []}
    vaccines = Vaccine.query.all()
    for vaccine in vaccines:
        vaccine_info = vaccine.__dict__
        del vaccine_info['_sa_instance_state']
        vaccines_json['vaccines'].append(vaccine_info)
    return json.dumps({'map_data': vaccines_json})


@app.route('/get_vaccine_countries', methods=['GET'])
def get_vaccine_countries():
    cur.execute("SELECT country FROM info WHERE stage >= 3 "
                "ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company "
                "LIMIT 5")
    top_countries = cur.fetchall()
    cur.execute("rollback")
    top_countries_array = ["United States", "United Kingdom", "China", "Russia"]
    for country in top_countries:
        country_array = country[0].replace(', ', ',').split(',')
        for each_country in country_array:
            if each_country not in top_countries_array:
                top_countries_array.append(each_country)

    cur.execute("SELECT country FROM info")
    world_countries = cur.fetchall()
    cur.execute("rollback")

    world_countries_array = []
    for country in world_countries:
        country_array = country[0].replace(', ', ',').split(',')
        for each_country in country_array:
            if each_country not in world_countries_array and each_country not in top_countries_array:
                world_countries_array.append(each_country)

    world_countries_array.sort()
    # print(world_countries_array)
    all_countries_array = top_countries_array + world_countries_array
    all_countries_array.sort()
    return json.dumps({'top_countries': top_countries_array,
                       'world_countries': world_countries_array,
                       'all_countries': all_countries_array})


@app.route('/get-compare-vaccine-info', methods=['GET'])
def get_compare_info():
    vaccine1 = str(request.args.get('vaccine1'))
    vaccine2 = str(request.args.get('vaccine2'))
    # vaccine1 = "2"
    # vaccine2 = "1"
    categories = ['type', 'efficacy', 'trial_size', 'dose', 'injection_type', 'storage', 'side_effects',
                  'candidate_name', 'age_group']

    cur.execute("SELECT json_agg(json_build_object("
                "'type', vac_type, "
                "'efficacy', efficacy, "
                "'trial_size', trial_size, "
                "'dose', dose, "
                "'injection_type', injection_type, "
                "'storage', storage, "
                "'age_group', age_group, "
                "'side_effects', side_effects, "
                "'approved', approved_countries, "
                "'limited', limited_countries, "
                "'candidate_name', candidate_name)) "
                "FROM info WHERE vac_id = %s", (vaccine1,))
    summary1 = cur.fetchall()[0][0][0]
    status1 = ""
    if summary1['approved'] is not None and summary1['approved'] != "":
        approved1_array = summary1['approved'].replace(', ', ',').split(',')
        if len(approved1_array) <= 3:
            status1 += "Approved in " + summary1['approved'] + ". "
        else:
            status1 += "Approved in " + str(len(approved1_array)) + " countries. "
    if summary1['limited'] is not None and summary1['limited'] != "":
        limited1_array = summary1['limited'].replace(', ', ',').split(',')
        if len(limited1_array) <= 3:
            status1 += "Limited Use in " + summary1['limited'] + "."
        else:
            status1 += "Limited Use in " + str(len(limited1_array)) + " countries."

    summary1['status'] = status1

    cur.execute("SELECT json_agg(json_build_object("
                "'type', vac_type, "
                "'efficacy', efficacy, "
                "'trial_size', trial_size, "
                "'dose', dose, "
                "'injection_type', injection_type, "
                "'storage', storage, "
                "'age_group', age_group, "
                "'side_effects', side_effects, "
                "'approved', approved_countries, "
                "'limited', limited_countries, "
                "'candidate_name', candidate_name)) "
                "FROM info WHERE vac_id = %s", (vaccine2,))
    summary2 = cur.fetchall()[0][0][0]
    status2 = ""
    if summary2['approved'] is not None and summary2['approved'] != "":
        approved2_array = summary2['approved'].replace(', ', ',').split(',')
        if len(approved2_array) <= 3:
            status2 += "Approved in " + summary2['approved'] + ". "
        else:
            status2 += "Approved in " + str(len(approved2_array)) + " countries. "
    if summary2['limited'] is not None and summary2['limited'] != "":
        limited2_array = summary2['limited'].replace(', ', ',').split(',')
        if len(limited2_array) <= 3:
            status2 += "Limited Use in " + summary2['limited'] + "."
        else:
            status2 += "Limited Use in " + str(len(limited2_array)) + " countries."
    summary2['status'] = status2

    for category in categories:
        if summary1[category] is None or not summary1[category]:
            summary1[category] = "Currently unavailable"
        if summary2[category] is None or not summary2[category]:
            summary2[category] = "Currently unavailable"

    return render_template("compare-vaccines.html", summary1=summary1, summary2=summary2)


@app.route('/data/map.json', methods=['GET'])
def load_string():
    with open('data/map.json') as json_file:
        data = json.load(json_file)
    return jsonify(data)


@app.route('/data/us-map.json', methods=['GET'])
def load_us_map():
    with open('data/us-map-states.json') as json_file:
        data = json.load(json_file)
    return jsonify(data)


@app.route('/data/countries-50m.json', methods=['GET'])
def load_world_map():
    with open('data/countries-50m.json') as json_file:
        data = json.load(json_file)
    return jsonify(data)


@app.route('/data/world-countries.csv', methods=['GET'])
def load_country():
    data = {}
    with open('data/WorldCountries.csv') as csvFile:
        csvReader = csv.DictReader(csvFile)
        for rows in csvReader:
            id = rows['id']
            data[id] = rows
    return jsonify(data)


@app.route('/get-usa-distribution-data', methods=['GET'])
def getUSADistributionData():
    cur2.execute('''SELECT json_agg(json_build_object(
                'jurisdiction', jurisdiction, 
                'doses', doses_available, 
                'doses_administered', doses_administered, 
                'new_administered', (doses_administered - prev_administered), 
                'new_distributed', (doses_available - prev_distributed), 
                'population', population, 
                'code', code, 
                'administered1', administered_1, 
                'administered2', administered_2
                )) 
                FROM "VaccineDistributionUSA"''')
    usa_distribution_data = cur2.fetchall()[0][0]
    cur2.execute("rollback")
    return jsonify(usa_distribution_data)


@app.route('/get-world-vaccination-data', methods=['GET'])
def getWorldVaccinationData():
    cur3.execute('''SELECT json_agg(json_build_object(
                'date', TO_CHAR(date, 'Month FMDD, YYYY'),
                'country', country, 
                'vaccinations', vaccinations, 
                'new_vaccinations', new_vaccinations, 
                'vaccinations_per_hundred', vaccinations_per_hundred,
                'population', population)
                ) 
                FROM "WorldVaccinations" WHERE country != \'United States\'''')
    world_vaccination_data = cur3.fetchall()[0][0]
    cur3.execute("rollback")

    cur3.execute('''SELECT json_agg(json_build_object(
                'date', TO_CHAR(date, 'Month FMDD, YYYY'),
                'country', CASE WHEN jurisdiction = \'U.S. Total\' THEN \'United States\' ELSE jurisdiction END,
                'vaccinations', doses_administered, 
                'new_vaccinations', (doses_administered - prev_administered), 
                'vaccinations_per_hundred', ROUND(doses_administered  * 100.0 / population, 2),
                'population', population)) 
                FROM "VaccineDistributionUSA" 
                WHERE jurisdiction = \'U.S. Total\'''')
    us_vaccination_data = cur3.fetchall()[0][0]
    cur3.execute("rollback")

    for vaccination_data in world_vaccination_data:
        if vaccination_data['country'] == "Vatican":
            vaccination_data['country'] = "Vatican City"
        if vaccination_data['country'] == "Cote d'Ivoire":
            vaccination_data['country'] = "Côte d'Ivoire"

    world_vaccination_data.extend(us_vaccination_data)

    return jsonify(world_vaccination_data)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('error/404.html'), 404


if __name__ == '__main__':
    Db.create_all()
    app.run(debug=True)


# cur.close()
# conn.close()
