from flask import Flask, render_template, request, jsonify
from models.vaccine_info import Db, Vaccine
import psycopg2
import numpy as np
# import sys
# import pandas as pd
# from modules.userform import UserForm, UserIDForm, UpdateUserForm
# import random

# Quote following line to run at local
# from flask_heroku import Heroku
app = Flask(__name__)
# Quote following line to run at local
# heroku = Heroku(app)
# Unquote following line to run at local
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/vaccinedb'
# app.secret_key = "ILoveNewYork"
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Db.init_app(app)
# conn = psycopg2.connect("dbname=vaccinedb user=postgres")

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///covid19_db'
app.secret_key = "lola980109"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
conn = psycopg2.connect("dbname=covid19_db user=lola")


cur = conn.cursor()


# W/O Filtering
@app.route('/', methods=['GET', 'POST'])
def index():
    # cur.execute(
    #     "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN companies ON info.vac_id = companies.vac_id;")
    # data = np.array(cur.fetchall())
    # cur.execute("SELECT  FROM companies;")
    # if request.method == 'GET':
    #     return render_template("index.html")
    if request.method == 'POST':
        stages = request.form.get("stages", None)
        country = request.form.get("country", None)
        types = request.form.get("type", None)

        if stages != None:
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro FROM info INNER "
                "JOIN companies ON info.vac_id = companies.vac_id WHERE stage="+stages+
                " ORDER BY co_name, partner_name;" )
        elif country != None:
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro FROM info "
                "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE country LIKE '%"+country+"%'"
                "ORDER BY stage DESC, co_name, partner_name;")
        elif types != None:
            cur.execute(
                "SELECT info.vac_id, stage, website, logo, intro FROM info "
                "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE vac_type='"+types+"' "
                "ORDER BY stage DESC, co_name, partner_name;")
        data = np.array(cur.fetchall(), dtype=object)
        cur.execute("rollback")
        return render_template("index.html", data=data, stages=stages, country=country, types=types, scrollToAnchor="TagIWantToLoadTo")
    else:
        cur.execute("SELECT info.vac_id, stage, website, logo, intro FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, co_name, partner_name;")
        data = np.array(cur.fetchall())
        cur.execute("rollback")
        return render_template("index.html", data=data)


@app.route('/load_data', methods=['GET'])
def load_data():
    vaccines_json = {'vaccines': []}
    vaccines = Vaccine.query.all()
    for vaccine in vaccines:
        vaccine_info = vaccine.__dict__
        del vaccine_info['_sa_instance_state']
        vaccines_json['vaccines'].append(vaccine_info)
    return jsonify(vaccines_json)


# @app.route('/data')
# def send_data():
#     con = psycopg2.connect("host='localhost' dbname='mydb' user='postgres' password='Password'")  
#     cur = con.cursor()
#     cur.execute("""select * from  data_lc""")
#     data = [col for col in cur]
#     cur.close()
#     return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)


# cur.close()
# conn.close()