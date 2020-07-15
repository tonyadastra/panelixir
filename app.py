# from models import Result
# from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
# import os


# app = Flask(__name__)
# app.config.from_object(os.environ['APP_SETTINGS'])
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db = SQLAlchemy(app)


# @app.route('/')
# def hello():
#     return "Hello World!"


# @app.route('/<name>')
# def hello_name(name):
#     return "Hello {}!".format(name)

# if __name__ == '__main__':
#     app.run()


# from flask import Flask, render_template, request, url_for, redirect
# app = Flask(__name__)

# @app.route('/', methods=['GET', 'POST'])
# def index():
#     if request.method == "POST":
#         car_brand = request.form.get("stages", None)
#         # print(car_brand)
#         if car_brand!=None:
#             return render_template("index.html", car_brand = car_brand)
#     return render_template("index.html")

# if __name__ == '__main__':
#     app.run(debug=True)






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
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///covid19_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = "lola980109"
# Db.init_app(app)

conn = psycopg2.connect("dbname=covid19_db user=lola")
cur = conn.cursor()

# W/O Filtering

# cur.execute("SELECT * FROM info;")
# cur.execute("rollback")

@app.route('/')
def FilterVaccines():
    cur.execute("SELECT vac_id, website, stage FROM info;")
    data = np.array(cur.fetchall())
    # cur.execute("rollback")
    # id = data[:, 0]
    # website = data[:, 1]
    # stage = data[:, 2]
    # return render_template("index.html", id=id, website=website, stage=stage)
    return render_template("index.html", data=data)
