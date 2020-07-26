import random, string, re
from flask import Flask, render_template, request, jsonify
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

# User - Tony
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/vaccinedb'
app.secret_key = "ILoveNewYork"
conn = psycopg2.connect("dbname=vaccinedb user=postgres")

# User - Lola
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///covid19_db'
# app.secret_key = "lola980109"
# conn = psycopg2.connect("dbname=covid19_db user=lola")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
Db.init_app(app)
cur = conn.cursor()


@app.route('/', methods=['GET', 'POST'])
def index():
    # if request.method == 'GET':
    #     continent = str(request.args.get('continent'))
    #     if request.args.get('continent') is None or continent == "World":
    #         continent = ""

    #     cur.execute("SELECT stage, COUNT(stage) as count "
    #                 "FROM info "
    #                 "WHERE continent LIKE '%" + continent + "%' "
    #                 "GROUP BY stage ORDER BY stage")
    #     continent_data = np.array(cur.fetchall(), dtype=object)
    #     cur.execute("rollback")

    if request.method == 'POST':
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
                        "ORDER BY stage DESC, co_name, partner_name;")
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

            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM info INNER "
                "JOIN companies ON info.vac_id = companies.vac_id "
                "WHERE CAST(stage AS VARCHAR(1)) LIKE '" + stages + "' "
                                                                    "AND country LIKE '%" + country + "%' "
                                                                                                      "AND vac_type LIKE '%" + types + "%' "
                                                                                                                                       "ORDER BY stage DESC, co_name, partner_name;")

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
                    "ORDER BY stage DESC, co_name, partner_name;")
        data = np.array(cur.fetchall())
        cur.execute("rollback")
        stages_dis = "Stages"
        country_dis = "Country"
        types_dis = "Vaccine Types"
        return render_template("index.html", data=data, stages_dis=stages_dis, stages="Stages",
                               country_dis=country_dis, country="Country", types_dis=types_dis, types="Vaccine Types")


@app.route("/update_continent")
def update_continent():
    continent = str(request.args.get('continent'))
    print(request.args.get('continent'))
    if request.args.get('continent') is None or continent == "World":
        continent = ""

    cur.execute("rollback")
    cur.execute("SELECT stage, COUNT(stage) as count "
                " FROM info "
                " WHERE continent LIKE '%"+continent+"%' "
                "GROUP BY stage ORDER BY stage")
    continent_data = np.array(cur.fetchall(), dtype=object)
    cur.execute("rollback")
    data_arr = []
    # print(continent_data)
    for i in range(5):
        found = False
        for j in continent_data:
            if i == j[0]:
                data_arr.append(j[1])
                found = True
        if not found:
            data_arr.append(0)
    # print(data_arr)
    return render_template('update_continent.html', continent_data=data_arr)


@app.route("/get_bars_data")
def getBarsData():
    continent = str(request.args.get('continent'))
    print(request.args.get('continent'))
    if request.args.get('continent') is None or continent == "World":
        continent = ""
    cur.execute("rollback")
    cur.execute("SELECT json_agg(json_build_object('company', company, "
                "'stage', stage,"
                " 'country', country,"
                " 'flag', flag ))"
                "FROM info "
                " INNER JOIN companies ON info.vac_id = companies.vac_id "
                " WHERE continent LIKE '%"+continent+"%' "
                "GROUP BY stage, co_name, partner_name ORDER BY stage DESC, co_name, partner_name LIMIT 5;")
    bars_data = cur.fetchall()
    cur.execute("rollback")
    print(len(bars_data))
    bars_data_json = {'bars_data': []}
    if len(bars_data) < 5:
        for i in range(len(bars_data)):
            bars_data_json['bars_data'].append(bars_data[i][0][0])
    else:
        for i in range(5):
            bars_data_json['bars_data'].append(bars_data[i][0][0])
    # print(bars_data_json)
    return jsonify(bars_data_json)


@app.route('/load_data', methods=['GET'])
def load_data():
    vaccines_json = {'vaccines': []}
    vaccines = Vaccine.query.all()
    for vaccine in vaccines:
        vaccine_info = vaccine.__dict__
        del vaccine_info['_sa_instance_state']
        vaccines_json['vaccines'].append(vaccine_info)
    return jsonify(vaccines_json)


@app.route('/data/map.json', methods=['GET'])
def load_string():
    with open('data/worldcountries.json') as json_file:
        data = json.load(json_file)
    return jsonify(data)


@app.route('/data/world-country-names.tsv', methods=['GET'])
def load_country():
    data = {}
    with open('data/world-country-names.csv') as csvFile:
        csvReader = csv.DictReader(csvFile)
        for rows in csvReader:
            id = rows['id']
            data[id] = rows
    return jsonify(data)


# @app.route('/workstation', methods=['GET'])
# def workstation():
#   return flask.render_template('station.html', target=)

if __name__ == '__main__':
    app.secret_key = ''.join(random.choice(string.printable)
                             for _ in range(20))
    app.run(debug=True)

# cur.close()
# conn.close()
