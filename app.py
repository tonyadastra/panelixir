import random
import string
import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from models.vaccine_info import Db, Vaccine
from models.match_company_to_logo import match_logo
import psycopg2
import numpy as np
import json
import csv

application = app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = \
    'postgresql://internetuser:welcometopanelixir@panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com/vaccinedb'
conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                        " dbname=vaccinedb user=internetuser password=welcometopanelixir")
# conn = psycopg2.connect("dbname=vaccinedb user=postgres")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
Db.init_app(app)
cur = conn.cursor()

filter_limit = ""


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'static/favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/', methods=['GET'])
def index():
    cur.execute("SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
                "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
                "dose, injection_type, storage "
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
                "WHERE category = 'G' AND (CURRENT_DATE - date <= 3 OR tag='Top') "
                "ORDER BY CASE WHEN tag='Top' THEN tag END, date DESC, key DESC LIMIT 30")
    general_news = cur.fetchall()
    cur.execute("rollback")
    return render_template("index.html", data=data, news_data=news_data, general_news=general_news)


@app.route("/desktop-form", methods=['GET'])
def desktopForm():
    global filter_limit
    desktop_stages = str(request.args.get('desktop_stage'))
    desktop_country = str(request.args.get('desktop_country'))
    desktop_type = str(request.args.get('desktop_type'))

    if desktop_stages == "4-1":
        desktop_stages = "_"
        filter_limit = "AND early_approval"
    else:
        filter_limit = ""

    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + desktop_stages + "%' "
        " AND country LIKE '%" + desktop_country + "%' "
        " AND (vac_type LIKE '%" + desktop_type + "%') "
        "" + filter_limit + " "
        "ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company "
        "LIMIT 10")

    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("institutions.html", data=data)


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
        "dose, injection_type, storage"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + desktop_stages + "%' "
        " AND country LIKE '%" + desktop_country + "%' "
        " AND (vac_type LIKE '%" + desktop_type + "%') "
        "" + filter_limit + " "
        " ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company "
        " OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

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
        filter_limit = "AND early_approval"
    else:
        filter_limit = ""

    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news,  "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + mobile_stages + "%' "
        " AND country LIKE '%" + mobile_country + "%' "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + filter_limit + " "
        "ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company "
        "LIMIT 10")

    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("institutions.html", data=data)


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
        "dose, injection_type, storage"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + mobile_stages + "%' "
        " AND country LIKE '%" + mobile_country + "%' "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + filter_limit + " "
        " ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company"
        " OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("card.html", data=data)


@app.route("/about-us")
def aboutUs():
    return render_template("about-us.html")


@app.route("/display-company", methods=['GET'])
def displayCompany():
    companyID = str(request.args.get('company_id'))
    cur.execute(
        "SELECT info.vac_id, stage, website, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD'), company, early_approval, candidate_name, efficacy, "
        "dose, injection_type, storage"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE info.vac_id = " + companyID + "")
    data = cur.fetchall()
    cur.execute("rollback")
    # call function match_logo([data], [position of company in data])
    match_logo(data, 8)
    return render_template("card.html", data=data)


@app.route("/get_update_time", methods=['GET'])
def getUpdateTime():
    cur.execute("SELECT TO_CHAR(update_date, 'Month FMDDth, YYYY') FROM "
                "(SELECT update_date FROM info "
                "WHERE update_date IS NOT NULL "
                "UNION "
                "SELECT date AS update_date FROM news "
                "ORDER BY update_date DESC LIMIT 1) AS date")
    update_time = cur.fetchone()[0]
    cur.execute("rollback")

    cur.execute("SELECT COUNT(*) FROM info")
    total_rows = cur.fetchone()[0]
    cur.execute("rollback")
    return json.dumps({'update_time': update_time, 'total_rows': total_rows})


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
                " WHERE continent LIKE %s"
                " GROUP BY stage, progress, phase3_start_date, company"
                " ORDER BY stage DESC, progress DESC NULLS LAST, phase3_start_date NULLS LAST, company LIMIT 5;",
                ("%" + continent + "%", ))
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
                " WHERE continent LIKE %s"
                " GROUP BY stage ORDER BY stage",
                ("%" + continent + "%", ))
    continent_data = np.array(cur.fetchall(), dtype=object)
    cur.execute("rollback")
    data_arr = []
    for i in range(5):
        found = False
        for j in continent_data:
            if i == j[0]:
                data_arr.append(j[1])
                found = True
        if not found:
            data_arr.append(0)
    bars_data_json = {'bars_data': []}
    for i in range(len(bars_data)):
        bars_data_json['bars_data'].append(bars_data[i][0][0])

    return json.dumps({'count': data_arr, 'bars_data': bars_data_json})


@app.route('/load_data', methods=['GET'])
def load_data():
    # map data - uses SQLAlchemy models/vaccine_intro.py
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


@app.route('/data/map.json', methods=['GET'])
def load_string():
    with open('data/map.json') as json_file:
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


if __name__ == '__main__':
    app.secret_key = ''.join(random.choice(string.printable)
                             for _ in range(20))
    app.run(debug=True)


# cur.close()
# conn.close()
