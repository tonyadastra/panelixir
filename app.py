from flask import Flask, render_template, request, redirect, url_for
from models.vaccine_info import Db, Vaccine
import psycopg2
import numpy as np
import sys
# import pandas as pd
# from modules.userform import UserForm, UserIDForm, UpdateUserForm
# import random

# Quote following line to run at local
# from flask_heroku import Heroku
app = Flask(__name__)
# Quote following line to run at local
# heroku = Heroku(app)
# Unquote following line to run at local
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/vaccinedb'
app.secret_key = "ILoveNewYork"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Db.init_app(app)
conn = psycopg2.connect("dbname=vaccinedb user=postgres")

# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///covid19_db'
# app.secret_key = "lola980109"
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# conn = psycopg2.connect("dbname=covid19_db user=lola")


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
        return render_template("index.html", data=data)



        # if stages == "Pre-clinical":
        #     # Stages Filtering
        #     # Preclinical (Preclinical --> 0)
        #     cur.execute("SELECT info.vac_id, stage, website, logo, intro FROM info "
        #                 "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE stage=0;")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, stages=stages)

        # if stages == "Phase I":
        #     # Stage I (Stage I --> 1)
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER "
        #         "JOIN companies ON info.vac_id = companies.vac_id WHERE stage=1;")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, stages=stages)
        # if stages == "Phase II":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER "
        #         "JOIN companies ON info.vac_id = companies.vac_id WHERE stage=2;")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, stages=stages)
        # if stages == "Phase III":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER "
        #         "JOIN companies ON info.vac_id = companies.vac_id WHERE stage=3;")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, stages=stages)
        # if stages == "Approval":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER "
        #         "JOIN companies ON info.vac_id = companies.vac_id WHERE stage=4;")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, stages=stages)

        # Country Filtering  
        # if country == "United States":
        # statement = "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN companies ON info.vac_id = companies.vac_id WHERE country LIKE '%United States%';"
        # cur.execute(statement)
        # print(statement, file=sys.stdout)
        # data = np.array(cur.fetchall())
        # cur.execute("rollback")
        # return render_template("index.html", data=data, country=country)
        # if country == "United Kingdom":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%United Kingdom%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "China":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%China%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "Japan":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%Japan%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "Germany":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%Germany%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "India":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%India%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "South Korea":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%South Korea%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "France":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%France%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "Australia":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%Australia%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "Russia":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%Russia%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "Canada":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%Canada%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)
        # if country == "Austria":
        #     cur.execute(
        #         "SELECT info.vac_id, stage, website, logo, intro FROM info INNER JOIN "
        #         "companies ON info.vac_id = companies.vac_id WHERE country LIKE '%Austria%';")
        #     data = np.array(cur.fetchall())
        #     cur.execute("rollback")
        #     return render_template("index.html", data=data, country=country)

        # Types Filtering
    #     if types == "Genetic":
    #         cur.execute(
    #             "SELECT info.vac_id, stage, website, logo, intro FROM info "
    #             "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE vac_type='Genetic';")
    #         data = np.array(cur.fetchall())
    #         cur.execute("rollback")
    #         return render_template("index.html", data=data, types=types)
    #     if types == "Viral Vector":
    #         cur.execute(
    #             "SELECT info.vac_id, stage, website, logo, intro FROM info "
    #             "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE vac_type='Viral Vector';")
    #         data = np.array(cur.fetchall())
    #         cur.execute("rollback")
    #         return render_template("index.html", data=data, types=types)
    #     if types == "Protein-Based":
    #         cur.execute(
    #             "SELECT info.vac_id, stage, website, logo, intro FROM info "
    #             "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE vac_type='Protein-Based';")
    #         data = np.array(cur.fetchall())
    #         cur.execute("rollback")
    #         return render_template("index.html", data=data, types=types)
    #     if types == "Whole-Virus":
    #         cur.execute(
    #             "SELECT info.vac_id, stage, website, logo, intro FROM info "
    #             "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE vac_type='Whole-Virus';")
    #         data = np.array(cur.fetchall())
    #         cur.execute("rollback")
    #         return render_template("index.html", data=data, types=types)
    #     if types == "Others":
    #         cur.execute(
    #             "SELECT info.vac_id, stage, website, logo, intro FROM info "
    #             "INNER JOIN companies ON info.vac_id = companies.vac_id WHERE vac_type='Repurposed';")
    #         data = np.array(cur.fetchall())
    #         cur.execute("rollback")
    #         return render_template("index.html", data=data, types=types)
    else:
        cur.execute("SELECT info.vac_id, stage, website, logo, intro FROM "
                    "info INNER JOIN companies ON info.vac_id = companies.vac_id "
                    "ORDER BY stage DESC, co_name, partner_name;")
        data = np.array(cur.fetchall())
        cur.execute("rollback")
        return render_template("index.html", data=data)

# cur.close()
# conn.close()

if __name__ == '__main__':
    app.run(debug=True)
