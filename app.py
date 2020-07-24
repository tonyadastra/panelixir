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
    status = "status"
    # cur.execute(
    #     "SELECT info.xvac_id, stage, website, logo, intro FROM info INNER JOIN companies ON info.vac_id = companies.vac_id;")
    # data = np.array(cur.fetchall())
    # cur.execute("SELECT  FROM companies;")
    # if request.method == 'GET':
    #     return render_template("index.html")
    if request.method == 'POST':
        stages = request.form.get("stages", "Stages")
        country = request.form.get("country", "Country")
        types = request.form.get("type", "Vaccine Type")
        status = request.form.get("status", "status")

        if status == "clear":
            cur.execute("SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM "
                        "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                        "ORDER BY stage DESC, co_name, partner_name;")
        if stages != "Stages":
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM info INNER "
                " JOIN companies ON info.vac_id = companies.vac_id WHERE stage="+stages +
                " ORDER BY co_name, partner_name;")
            # if country != "Country":
            #     cur.execute(
            #         "select info.vac_id, stage, website, logo, intro from info inner join companies c on info.vac_id = c.vac_id where stage="+stages+" and country like '%"+country+"%'ORDER BY stage DESC, co_name, partner_name;")
            if stages == "0":
                stages = "Pre-Clinical"
            elif stages == "1":
                stages = "Phase I"
            elif stages == "2":
                stages = "Phase II"
            elif stages == "3":
                stages = "Phase III"
            elif stages == "4":
                stages = "Approval"

        elif country != "Country":
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM info "
                "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE country LIKE '%"+country+"%'"
                "ORDER BY stage DESC, co_name, partner_name;")
        elif types != "Vaccine Types":
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro, country, vac_type FROM info "
                "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE vac_type='"+types+"' "
                "ORDER BY stage DESC, co_name, partner_name;")
        data = np.array(cur.fetchall(), dtype=object)
        cur.execute("rollback")
        return render_template("index.html", data=data, stages=stages, country=country, types=types, scrollToAnchor="TagIWantToLoadTo")
    else:
        stages = "Stages"
        country = "Country"
        types = "Vaccine Types"
        cur.execute("SELECT info.vac_id, stage, website, logo, intro FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, co_name, partner_name;")
        data = np.array(cur.fetchall())
        cur.execute("rollback")
        return render_template("index.html", data=data, stages=stages, country=country, types=types)


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
