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
app.config['SQLALCHEMY_DATABASE_URI'] = \
    'postgresql://internetuser:welcometopanelixir@panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com/vaccinedb'
app.secret_key = "panelixir-key"
conn = psycopg2.connect("host=panelixirdb.cxpzv5isdmqi.us-west-1.rds.amazonaws.com"
                        " dbname=vaccinedb user=internetuser password=welcometopanelixir")
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


@app.route('/', methods=['GET'])
def index():
    cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news, "
                "TO_CHAR(update_date, 'Month FMDD')"
                " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
                "ORDER BY stage DESC, co_name, partner_name LIMIT 10")
    data = cur.fetchall()
    cur.execute("rollback")
    cur.execute("SELECT vac_id, tag, company, news_text, TO_CHAR(date, 'Month FMDD') FROM news "
                "ORDER BY date DESC, key DESC LIMIT 6")
    news_data = cur.fetchall()
    cur.execute("rollback")
    return render_template("index.html", data=data, news_data=news_data)


@app.route("/desktop-form", methods=['GET'])
def desktopForm():
    global filter_limit
    desktop_stages = str(request.args.get('desktop_stage'))
    desktop_country = str(request.args.get('desktop_country'))
    desktop_type = str(request.args.get('desktop_type'))

    if desktop_stages == "4-1":
        desktop_stages = "_"
        filter_limit = "AND (info.vac_id = 29 or info.vac_id = 12 or info.vac_id = 28 " \
                              "or info.vac_id = 35 or info.vac_id = 13 or info.vac_id = 119)"
    else:
        filter_limit = ""

    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD')"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + desktop_stages + "%' "
        " AND country LIKE '%" + desktop_country + "%' "
        " AND (vac_type LIKE '%" + desktop_type + "%') "
        "" + filter_limit + " "
        "ORDER BY stage DESC, co_name, partner_name LIMIT 10")

    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("desktop-card.html", data=data)


@app.route("/card", methods=['GET'])
def card():
    desktop_stages = str(request.args.get('desktop_stage'))
    desktop_country = str(request.args.get('desktop_country'))
    desktop_type = str(request.args.get('desktop_type'))
    limit = int(request.args.get('limit'))
    count = int(request.args.get('count'))

    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD')"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + desktop_stages + "%' "
        " AND country LIKE '%" + desktop_country + "%' "
        " AND (vac_type LIKE '%" + desktop_type + "%') "
        "" + filter_limit + " "
        " ORDER BY stage DESC, co_name, partner_name "
        " OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("card.html", data=data)


@app.route("/mobile-form", methods=['GET'])
def mobileForm():
    global filter_limit
    mobile_stages = str(request.args.get('mobile_stage'))
    mobile_country = str(request.args.get('mobile_country'))
    mobile_type = str(request.args.get('mobile_type'))

    if mobile_stages == "4-1":
        mobile_stages = "_"
        filter_limit = "AND (info.vac_id = 29 or info.vac_id = 12 or info.vac_id = 28 " \
                              "or info.vac_id = 35 or info.vac_id = 13 or info.vac_id = 119)"
    else:
        filter_limit = ""

    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD')"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + mobile_stages + "%' "
        " AND country LIKE '%" + mobile_country + "%' "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + filter_limit + " "
        "ORDER BY stage DESC, co_name, partner_name LIMIT 10")

    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("mobile-card.html", data=data)


@app.route("/mobile-card", methods=['GET'])
def mobileAppendCards():
    mobile_stages = str(request.args.get('mobile_stage'))
    mobile_country = str(request.args.get('mobile_country'))
    mobile_type = str(request.args.get('mobile_type'))
    count = int(request.args.get('mobile_count'))
    limit = int(request.args.get('limit'))
    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD')"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE CAST(stage AS VARCHAR(1)) LIKE '%" + mobile_stages + "%' "
        " AND country LIKE '%" + mobile_country + "%' "
        " AND (vac_type LIKE '%" + mobile_type + "%') "
        "" + filter_limit + " "
        " ORDER BY stage DESC, co_name, partner_name "
        " OFFSET " + str(count * limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("card.html", data=data)


@app.route("/about-us")
def aboutUs():
    return render_template("about-us.html")


@app.route("/display-company", methods=['GET'])
def displayCompany():
    companyID = str(request.args.get('company_id'))
    cur.execute(
        "SELECT info.vac_id, stage, website, logo, intro, country, vac_type, latest_news, "
        "TO_CHAR(update_date, 'Month FMDD')"
        " FROM info INNER JOIN companies ON info.vac_id = companies.vac_id "
        " WHERE info.vac_id = " + companyID + "")
    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("card.html", data=data)


@app.route("/get_update_time", methods=['GET'])
def getUpdateTime():
    # cur.execute("rollback")
    cur.execute("SELECT TO_CHAR(update_date, 'Month FMDDth, YYYY') FROM "
                "(SELECT update_date FROM info "
                "WHERE update_date IS NOT NULL "
                "UNION "
                "SELECT date AS update_date FROM news "
                "ORDER BY update_date DESC LIMIT 1) AS date")
    update_time = cur.fetchone()
    cur.execute("rollback")
    # while update_time is None:
    #     cur.execute("SELECT TO_CHAR(update_date, 'Month FMDDth') FROM info WHERE update_date IS NOT NULL "
    #                 "ORDER BY update_date DESC LIMIT 1")
    #     update_time = cur.fetchone()
    #     cur.execute("rollback")
    if update_time is not None:
        return update_time[0]


@app.route("/get_bars_data", methods=['GET'])
def getBarsData():
    continent = str(request.args.get('continent'))
    if request.args.get('continent') is None or continent == "World":
        continent = ""
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
