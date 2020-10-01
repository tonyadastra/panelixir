import random
import string
import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from models.vaccine_info import Db, Vaccine
import psycopg2
import numpy as np
import json
import csv

application = app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://internetuser:welcometopanelixir@panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com/vaccinedb'
app.secret_key = "panelixir-key"
conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com dbname=vaccinedb user=internetuser password=welcometopanelixir")
# conn = psycopg2.connect("dbname=vaccinedb user=postgres")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
Db.init_app(app)
cur = conn.cursor()


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'static/favicon.ico', mimetype='image/vnd.microsoft.icon')


stages = "Vaccine Stage"
country = "Country / Region"
types = "Vaccine Platform"
status = "status"
filter_limit = ""
mobile_filter_limit = ""


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        global stages, country, types, status, filter_limit
        stages = request.form.get("stages", "Vaccine Stage")
        country = request.form.get("country", "Country / Region")
        types = request.form.get("type", "Vaccine Platform")
        status = request.form.get("status", "status")

        prev_stages = request.form.get("prev_stages", "Vaccine Stage")
        prev_country = request.form.get("prev_country", "Country / Region")
        prev_types = request.form.get("prev_types", "Vaccine Platform")
        country_dis = country
        types_dis = types

        if status == "clear":
            stages_dis = "Vaccine Stage"
            country_dis = "Country / Region"
            types_dis = "Vaccine Platform"
            cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM "
                        "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                        "ORDER BY stage DESC, co_name, partner_name LIMIT 10;")
        else:
            if stages == "Vaccine Stage":
                if prev_stages != "Vaccine Stage":
                    stages = prev_stages
                else:
                    stages = "_"

            if country == "Country / Region":
                if prev_country != "Country / Region":
                    country = prev_country
                    country_dis = prev_country
                    if prev_country == "":
                        country_dis = "Country / Region"
                else:
                    country = ""
                    country_dis = "Country / Region"

            if types == "Vaccine Platform":
                if prev_types != "Vaccine Platform":
                    types = prev_types
                    types_dis = prev_types
                    if prev_types == "":
                        types_dis = "Vaccine Platform"
                else:
                    types = ""
                    types_dis = "Vaccine Platform"

            if types == "Genetic":
                types_dis = "Nucleic Acid Vaccines"
                types = "DNA%' or vac_type LIKE '%RNA"
            elif types == "Protein":
                types_dis = "Subunit Vaccines"
            elif types == "Viral Vector":
                types_dis = "Viral Vector Vaccines"
            elif types == "Virus":
                types_dis = "Whole-Pathogen Vaccines"
                types = "Virus%' or vac_type LIKE '%Inactivated"
            elif types == "VLP":
                types_dis = "Nanoparticle Vaccines"
            elif types == "Others":
                types = "Repurposed"
                types_dis = "Others"

            if types_dis == "DNA%' or vac_type LIKE '%RNA":
                types_dis = "Nucleic Acid Vaccines"
            if types_dis == "Virus%' or vac_type LIKE '%Inactivated":
                types_dis = "Whole-Pathogen Vaccines"
            if types_dis == "Repurposed":
                types_dis = "Others"

            if stages == "4-1":
                stages = "_"
                filter_limit = "AND (info.vac_id = 29 or info.vac_id = 12 or info.vac_id = 28 or info.vac_id = 35)"
            else:
                filter_limit = ""

            cur.execute("rollback")
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM info INNER "
                " JOIN companies ON info.vac_id = companies.vac_id "
                " WHERE CAST(stage AS VARCHAR(1)) LIKE '" + stages + "' "
                " AND country LIKE '%" + country + "%' "
                # "AND '" + types + "' ~ vac_type "
                " AND (vac_type LIKE '%" + types + "%')"
                " " + filter_limit + " "
                "ORDER BY stage DESC, co_name, partner_name LIMIT 10;")

            if stages == "0":
                stages_dis = "Pre-Clinical"
            elif stages == "1":
                stages_dis = "Phase I"
            elif stages == "2":
                stages_dis = "Phase II"
            elif stages == "3":
                stages_dis = "Phase III"
            elif stages == "4":
                stages_dis = "Approval"
            else:
                stages_dis = "Vaccine Stage"
            if filter_limit == "AND (info.vac_id = 29 or info.vac_id = 12 or info.vac_id = 28 or info.vac_id = 35)":
                stages = "4-1"
                stages_dis = "Limited Use"

        data = np.array(cur.fetchall(), dtype=object)
        cur.execute("rollback")
        return render_template("index.html", data=data, stages_dis=stages_dis, stages=stages,
                               country=country, country_dis=country_dis, types=types, types_dis=types_dis,
                               scrollToAnchor="TagIWantToLoadTo")
    else:
        cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, co_name, partner_name LIMIT 10")
        # "OFFSET 0 ROWS FETCH FIRST 5 ROW O NLY")
        data = cur.fetchall()
        cur.execute("rollback")
        # cur.execute("SELECT vac_id, news_tag, news_text, date, display_order FROM news "
        #             "ORDER BY date DESC, display_order LIMIT 6")
        # news_data = cur.fetchall()
        # cur.execute("rollback")
        stages_dis = "Vaccine Stage"
        country_dis = "Country / Region"
        types_dis = "Vaccine Platform"
        # print(news_data)
        return render_template("index.html", data=data,
                               # news_data=news_data,
                               stages_dis=stages_dis,
                               stages="Vaccine Stage", country_dis=country_dis, country="Country / Region",
                               types_dis=types_dis, types="Vaccine Platform")


@app.route("/card", methods=['GET', 'POST'])
def card():
    limit = int(request.args.get('limit'))
    count = int(request.args.get('count'))

    if status == "clear" or (stages == "Vaccine Stage" and country == "Country / Region" and types == "Vaccine Platform"):
        cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, company, partner_name "
                    "OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    elif stages != "Vaccine Stage" or country != "Country / Region" or types != "Vaccine Platform":
        # print('2')
        #     if types == "Genetic":
        #         types = "DNA%' or vac_type LIKE '%RNA"

        cur.execute(
            "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM info INNER "
            " JOIN companies ON info.vac_id = companies.vac_id "
            " WHERE CAST(stage AS VARCHAR(1)) LIKE '" + stages + "' "
            " AND country LIKE '%" + country + "%' "
            " AND (vac_type LIKE '%" + types + "%') "
            "" + filter_limit + " "
            " ORDER BY stage DESC, co_name, partner_name "
            " OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    else:
        # print('1')
        cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    " ORDER BY stage DESC, company, partner_name "
                    " OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("card.html", data=data)


@app.route("/mobile-form", methods=['GET', 'POST'])
def mobileForm():
    global mobile_filter_limit
    # global mobile_stages, mobile_country, mobile_type
    mobile_stages = str(request.args.get('mobile_stage'))
    mobile_country = str(request.args.get('mobile_country'))
    mobile_type = str(request.args.get('mobile_type'))
    # print(mobile_stages)
    # print(mobile_country)
    # print(mobile_type)
    # print(request.args.get('mobile_count'))
    if mobile_type == "Genetic":
        mobile_type = "DNA%' or vac_type LIKE '%RNA"
    elif mobile_type == "Others":
        mobile_type = "Repurposed"
    elif mobile_type == "Virus":
        mobile_type = "Virus%' or vac_type LIKE '%Inactivated"

    if mobile_stages == "4-1":
        mobile_stages = "_"
        mobile_filter_limit = "AND (info.vac_id = 29 or info.vac_id = 12 or info.vac_id = 28 or info.vac_id = 35)"
    else:
        mobile_filter_limit = ""

    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM info INNER "
        " JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + mobile_stages + "%' "
        " AND country LIKE '%" + mobile_country + "%' "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + mobile_filter_limit + " "
        "ORDER BY stage DESC, co_name, partner_name LIMIT 10")

    data = cur.fetchall()
    cur.execute("rollback")
    # print(data)

    return render_template("mobile-card.html", data=data)


@app.route("/mobile-card")
def mobileAppendCards():
    mobile_stages = str(request.args.get('mobile_stage'))
    mobile_country = str(request.args.get('mobile_country'))
    mobile_type = str(request.args.get('mobile_type'))
    count = int(request.args.get('mobile_count'))
    limit = int(request.args.get('limit'))
    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM info INNER "
        " JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + mobile_stages + "%' "
        " AND country LIKE '%" + mobile_country + "%' "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + mobile_filter_limit + " "
        " ORDER BY stage DESC, co_name, partner_name "
        " OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("card.html", data=data)


@app.route("/about-us")
def aboutUs():
    return render_template("about-us.html")


@app.route("/display-company", methods=['GET', 'POST'])
def displayCompany():
    companyID = str(request.args.get('company_id'))
    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news FROM info INNER "
        " JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE info.vac_id = " + companyID + "")
    company = cur.fetchall()
    cur.execute("rollback")
    # print(company)
    return render_template("display-company.html", company=company)


@app.route("/get_bars_data")
def getBarsData():
    continent = str(request.args.get('continent'))
    if request.args.get('continent') is None or continent == "World":
        continent = ""
    cur.execute("rollback")
    cur.execute("SELECT json_agg(json_build_object('company', company, "
                "'stage', stage,"
                " 'country', country,"
                " 'flag', flag, "
                " 'vac_id', info.vac_id )) "
                " FROM info "
                " INNER JOIN companies ON info.vac_id = companies.vac_id "
                " WHERE continent LIKE '%" + continent + "%' "
                "GROUP BY stage, co_name, partner_name ORDER BY stage DESC, co_name, partner_name LIMIT 5;")
    bars_data = cur.fetchall()
    cur.execute("rollback")

    # bar chart
    cur.execute("SELECT stage, COUNT(stage) as count "
                " FROM info "
                " WHERE continent LIKE '%" + continent + "%' "
                "GROUP BY stage ORDER BY stage")
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
    # print(json.dumps({'count': data_arr, 'bars_data': bars_data_json}))

    # map
    vaccines_json = {'vaccines': []}
    vaccines = Vaccine.query.all()
    for vaccine in vaccines:
        vaccine_info = vaccine.__dict__
        del vaccine_info['_sa_instance_state']
        vaccines_json['vaccines'].append(vaccine_info)

    return json.dumps({'count': data_arr, 'bars_data': bars_data_json, 'map_data': vaccines_json})


@app.route('/load_data', methods=['GET'])
def load_data():
    vaccines_json = {'vaccines': []}
    vaccines = Vaccine.query.all()
    for vaccine in vaccines:
        vaccine_info = vaccine.__dict__
        del vaccine_info['_sa_instance_state']
        vaccines_json['vaccines'].append(vaccine_info)
    return json.dumps({'map_data': vaccines_json})


@app.route('/data/map.json', methods=['GET'])
def load_string():
    with open('data/map.json') as json_file:
        data = json.load(json_file)
    return jsonify(data)


@app.route('/data/world-country-names.tsv', methods=['GET'])
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
