from flask import Flask, render_template, request, redirect, url_for
# from models.vaccine_info import Db, Vaccine
import psycopg2
import numpy as np
import pandas as pd

# from modules.userform import UserForm, UserIDForm, UpdateUserForm
# import random

# Quote following line to run at local
# from flask_heroku import Heroku
app = Flask(__name__)
# Quote following line to run at local
# heroku = Heroku(app)
# Unquote following line to run at local
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/vaccinedb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = "ILoveNewYork"
Db.init_app(app)

conn = psycopg2.connect("dbname=vaccinedb user=postgres")
cur = conn.cursor()


# W/O Filtering
@app.route('/')
def index():
    cur.execute("SELECT vac_id, website, stage FROM info;")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Stages Filtering
# Preclinical (Preclinical --> 0)
def FilterVaccines_Stage0():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0;")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Stage I (Stage I --> 1)
def FilterVaccines_Stage1():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=1;")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Stage II (Stage II --> 2)
def FilterVaccines_Stage2():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=2;")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Stage III (Stage III --> 3)
def FilterVaccines_Stage3():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=3;")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Approval (Approval --> 4)
def FilterVaccines_Stage4():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=4;")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Country Filtering
# United States
def FilterVaccines_Country_UnitedStates():
    cur.execute("SELECT * FROM info WHERE country LIKE '%United States%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# United Kingdom
def FilterVaccines_Country_UnitedKingdom():
    cur.execute("SELECT * FROM info WHERE country LIKE '%United Kingdom%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)

# China
def FilterVaccines_Country_China():
    cur.execute("SELECT * FROM info WHERE country LIKE '%China%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Japan
def FilterVaccines_Country_Japan():
    cur.execute("SELECT * FROM info WHERE country LIKE '%Japan%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Germany
def FilterVaccines_Country_Germany():
    cur.execute("SELECT * FROM info WHERE country LIKE '%Germany%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# India
def FilterVaccines_Country_India():
    cur.execute("SELECT * FROM info WHERE country LIKE '%India%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# South Korea
def FilterVaccines_Country_SouthKorea():
    cur.execute("SELECT * FROM info WHERE country LIKE '%South Korea%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# France
def FilterVaccines_Country_France():
    cur.execute("SELECT * FROM info WHERE country LIKE '%France%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Australia
def FilterVaccines_Country_Australia():
    cur.execute("SELECT * FROM info WHERE country LIKE '%Australia%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Russia
def FilterVaccines_Country_Russia():
    cur.execute("SELECT * FROM info WHERE country LIKE '%Russia%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Canada
def FilterVaccines_Country_Canada():
    cur.execute("SELECT * FROM info WHERE country LIKE '%Canada%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Austria
def FilterVaccines_Country_Austria():
    cur.execute("SELECT * FROM info WHERE country LIKE '%Austria%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Vaccine Types Filtering

# Genetic
def FilterVaccines_Types_Genetic():
    cur.execute("SELECT * FROM info WHERE vac_type='Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Viral Vector
def FilterVaccines_Types_ViralVector():
    cur.execute("SELECT * FROM info WHERE vac_type='Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Protein-Based
def FilterVaccines_Types_ProteinBased():
    cur.execute("SELECT * FROM info WHERE vac_type='Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Whole-Virus
def FilterVaccines_Types_WholeVirus():
    cur.execute("SELECT * FROM info WHERE vac_type='Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# Others (Repurposed)
def FilterVaccines_Types_Repurposed():
    cur.execute("SELECT * FROM info WHERE vac_type='Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data)


# cur.close()
# conn.close()