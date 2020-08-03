import random
import string
import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from models.vaccine_info import Db, Vaccine
import psycopg2
import numpy as np
import json
import csv

# Quote following line to run at local
# from flask_heroku import Heroku
app = Flask(__name__)
# Quote following line to run at local
# heroku = Heroku(app)
# Unquote following line to run at local

# # User - Tony
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/vaccinedb'
app.secret_key = "ILoveNewYork"
conn = psycopg2.connect("dbname=vaccinedb user=postgres")

# # User - Lola
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///covid19_db'
# app.secret_key = "lola980109"
# conn = psycopg2.connect("dbname=covid19_db user=lola")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
Db.init_app(app)
cur = conn.cursor()


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'static/favicon.ico', mimetype='image/vnd.microsoft.icon')

stages = "Stages"
country = "Country"
types = "Vaccine Types"
status = "status"
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        global stages, country, types, status
        stages = request.form.get("stages", "Stages")
        country = request.form.get("country", "Country")
        types = request.form.get("type", "Vaccine Types")
        status = request.form.get("status", "status")

        prev_stages = request.form.get("prev_stages", "Stages")
        prev_country = request.form.get("prev_country", "Country")
        prev_types = request.form.get("prev_types", "Vaccine Types")
        country_dis = country
        types_dis = types

        if status == "clear":
            stages_dis = "Stages"
            country_dis = "Country"
            types_dis = "Vaccine Types"
            cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM "
                        "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                        "ORDER BY stage DESC, co_name, partner_name LIMIT 5;")
        else:
            if stages == "Stages":
                if prev_stages != "Stages":
                    stages = prev_stages
                else:
                    stages = "_"

            if country == "Country":
                if prev_country != "Country":
                    country = prev_country
                    country_dis = prev_country
                    if prev_country == "":
                        country_dis = "Country"
                else:
                    country = ""
                    country_dis = "Country"

            if types == "Vaccine Types":
                if prev_types != "Vaccine Types":
                    types = prev_types
                    types_dis = prev_types
                    if prev_types == "":
                        types_dis = "Vaccine Types"
                else:
                    types = ""
                    types_dis = "Vaccine Types"

            if types == "Genetic":
                types_dis = types
                types = "DNA%' or vac_type LIKE '%RNA"
            elif types == "Protein":
                types_dis = "Protein-Based Vaccines"
            elif types == "Virus":
                types_dis = "Whole-Virus Vaccines"
            elif types == "Repurposed":
                types_dis = "Others"

            # elif types== 

            cur.execute("rollback")
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM info INNER "
                " JOIN companies ON info.vac_id = companies.vac_id "
                " WHERE CAST(stage AS VARCHAR(1)) LIKE '" + stages + "' "
                " AND country LIKE '%" + country + "%' "
                # "AND '" + types + "' ~ vac_type "
                " AND vac_type LIKE '%" + types + "%' "
                "ORDER BY stage DESC, co_name, partner_name LIMIT 5;")

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
                stages_dis = "Stages"

        data = np.array(cur.fetchall(), dtype=object)
        cur.execute("rollback")
        return render_template("index.html", data=data, stages_dis=stages_dis, stages=stages,
                               country=country, country_dis=country_dis, types=types, types_dis=types_dis,
                               scrollToAnchor="TagIWantToLoadTo")
    else:
        cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, company, partner_name LIMIT 5")
                    # "OFFSET 0 ROWS FETCH FIRST 5 ROW O NLY")
        data = cur.fetchall()
        cur.execute("rollback")
        stages_dis = "Stages"
        country_dis = "Country"
        types_dis = "Vaccine Types"
        return render_template("index.html", data=data, stages_dis=stages_dis, stages="Stages",
                               country_dis=country_dis, country="Country", types_dis=types_dis, types="Vaccine Types")


@app.route("/card", methods=['GET','POST'])
def card():
    limit = int(request.args.get('limit'))
    count = int(request.args.get('count'))

    if (status == "clear"):
        cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, company, partner_name "
                    "OFFSET " + str(count*limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    elif (stages != "Stages" or country !="Country" or types !="Vaccine Types"):
    #     if types == "Genetic":
    #         types = "DNA%' or vac_type LIKE '%RNA"

        cur.execute(
            "SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM info INNER "
            " JOIN companies ON info.vac_id = companies.vac_id "
            " WHERE CAST(stage AS VARCHAR(1)) LIKE '" + stages + "' "
            " AND country LIKE '%" + country + "%' "
            " AND vac_type LIKE '%" + types + "%' "
            "ORDER BY stage DESC, co_name, partner_name "
            "OFFSET " + str(count*limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")

    else:
        cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, company, partner_name "
                    "OFFSET " + str(count*limit) + " ROWS FETCH FIRST " + str(limit) + " ROW ONLY")
    
    # cur.execute("rollback")    
    data = cur.fetchall()
    cur.execute("rollback")
    return render_template("card.html", data=data)


@app.route("/about-us")
def aboutUs():
    return render_template("about-us.html")


@app.route("/get_bars_data")
def getBarsData():
    continent = str(request.args.get('continent'))
    if request.args.get('continent') is None or continent == "World":
        continent = ""
    cur.execute("rollback")
    cur.execute("SELECT json_agg(json_build_object('company', company, "
                "'stage', stage,"
                " 'country', country,"
                " 'flag', flag )) "
                " FROM info "
                " INNER JOIN companies ON info.vac_id = companies.vac_id "
                " WHERE continent LIKE '%"+continent+"%' "
                "GROUP BY stage, co_name, partner_name ORDER BY stage DESC, co_name, partner_name LIMIT 5;")
    bars_data = cur.fetchall()
    cur.execute("rollback")

    # bar chart
    cur.execute("SELECT stage, COUNT(stage) as count "
                "FROM info "
                "WHERE continent LIKE '%" + continent + "%' "
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


