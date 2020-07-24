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


# W/O Filtering
@app.route('/', methods=['GET', 'POST'])
def index():
    # cur.execute(
    #     "SELECT info.xvac_id, stage, website, logo, intro FROM info INNER JOIN companies ON info.vac_id = companies.vac_id;")
    # data = np.array(cur.fetchall())
    # cur.execute("SELECT  FROM companies;")
    # if request.method == 'GET':
    #     return render_template("index.html")
    if request.method == 'POST':
        stages = request.form.get("stages", "Stages")
        country = request.form.get("country", "Country")
        types = request.form.get("type", "Vaccine Types")
        status = request.form.get("status", "status")

        prev_stages = request.form.get("prev_stages", "Stages")
        prev_country = request.form.get("prev_country", "Country")
        prev_types = request.form.get("prev_type", "Vaccine Types")
        country_dis = country
        types_dis = types

        if status == "clear":
            cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM "
                        "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                        "ORDER BY stage DESC, co_name, partner_name;")

        if stages == "Stages":
            if prev_stages != "Stages":
                stages = prev_stages
            else:
                stages = "_"

        if country == "Country":
            if prev_country != "Country":
                country = prev_country
                country_dis = prev_country
            else:
                country = ""
                country_dis = "Country"

        if types == "Vaccine Types":
            if prev_types != "Vaccine Types":
                types = prev_types
                types_dis = prev_types
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

        return render_template("index.html", data=data, stages_dis=stages_dis, stages=stages, country=country,
                               country_dis=country_dis, types=types, types_dis=types_dis,
                               scrollToAnchor="TagIWantToLoadTo")
    else:
        cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, co_name, partner_name;")
        data = np.array(cur.fetchall())
        cur.execute("rollback")
        stages_dis = "Stages"
        country_dis="Country"
        types_dis = "Vaccine Types"
        return render_template("index.html", data=data, stages_dis=stages_dis, stages="Stages", country_dis=country_dis, country="Country", types_dis=types_dis, types="Vaccine Types")


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


if __name__ == '__main__':
    app.run(debug=True)


# cur.close()
# conn.close()
