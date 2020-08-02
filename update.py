# import random
# import string
# import os
import psycopg2
import tabula
import numpy as np
import pandas as pd
from configparser import ConfigParser
from PyPDF2 import PdfFileReader


try:
    # connect to db
    connection = psycopg2.connect(user="lola",
                                  password="lola980109",
                                  host="127.0.0.1",
                                  port="5432",
                                  database="covid19_db")

    cur = connection.cursor()
    cur.execute("rollback")

    # get pdf page number
    pdf = PdfFileReader(open('data.pdf', 'rb'))
    page_num = pdf.getNumPages()
    vac_id=49

    for i in range(4, page_num+1):
        # get the table
        df = tabula.read_pdf("data.pdf", pages=i, pandas_options={'header': None})
        table = df[0].to_numpy()
        print(len(table))

        
        for j in range(0,len(table)):
            # print(table[j, 0], table[j, 2], table[j, 4])
            # ignore header and empty rows
            if (str(table[j, 2]) != 'nan' and vac_id != 49):
                # update info table
                cur.execute("INSERT INTO info (vac_id, vac_type, company, stage, country) "
                            "VALUES (" + str(vac_id) + ",'" + str(table[j, 0]) + "','" + str(table[j, 2])
                            + "',0,'')")
                cur.execute("rollback")

                # update "companies" table
                arr = str(table[j, 2]).replace('\r', '').split('/', 1)
                if (len(arr) == 1):
                    cur.execute("INSERT INTO companies (vac_id, co_name, partner_name) "
                                "VALUES (" + str(vac_id) + ",'" +
                                arr[0] + "','')")

                else:
                    cur.execute("INSERT INTO companies (vac_id, co_name, partner_name) "
                                "VALUES (" + str(vac_id) + ",'" +
                                arr[0] + "','" + arr[1] + "')")
                cur.execute("rollback")
            vac_id = vac_id+1

            
            # if (str(table[j, 2]) != 'nan' ):
                
            # vac_id = vac_id+1

    # delete header
    # cur.execute("delete from companies where vac_id=49")
    # cur.execute("rollback")

except (Exception, psycopg2.Error) as error:
    print("Error while connecting to PostgreSQL", error)
finally:
    # closing database connection.
    if(connection):
        cur.close()
        connection.close()
        print("PostgreSQL connection is closed")
