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
    connection = psycopg2.connect(user="tonyliu",
                                  host="127.0.0.1",
                                  port="5432",
                                  database="vaccinedb")

    cur = connection.cursor()
    cur.execute("rollback")

    # get pdf page number
    pdf = PdfFileReader(open('data.pdf', 'rb'))
    page_num = pdf.getNumPages()
    vac_id=49

    for i in range(1, 5):
        # get the table
        df = tabula.read_pdf("data.pdf", pages=i, pandas_options={'header': None})
        table = df[0].to_numpy()


        for j in range(0,len(table)):
            # print(table[j, 0], table[j, 2], table[j, 4])
            # ignore header and empty rows
            if (str(table[j, 4]) != 'nan'):
                # update info table
                # cur.execute("INSERT INTO info (vac_id, vac_type, company, stage, country) "
                #             "VALUES (" + str(vac_id) + ",'" + str(table[j, 0]) + "','" + str(table[j, 2])
                #             + "',0,'')")
                print(str(table[j, 4]))
                # cur.execute("UPDATE info "
                #             "SET vac_id=" + str(vac_id) +
                #             " where company='"+str(table[j, 2])+"' and vac_type='"+str(table[j, 0]) + "';")
                # cur.execute("rollback")

                # update "companies" table
                arr = str(table[j, 2]).replace('\r', '').split('/', 1)
                # cur.execute("UPDATE companies "
                #             "SET vac_id=" + str(vac_id) +
                #             " where co_name='"+arr[0]+ "';")
                # if (len(arr) == 1):
                #     cur.execute("INSERT INTO companies (vac_id, co_name, partner_name) "
                #                 "VALUES (" + str(vac_id) + ",'" +
                #                 arr[0] + "','')")

                # else:
                #     cur.execute("INSERT INTO companies (vac_id, co_name, partner_name) "
                #                 "VALUES (" + str(vac_id) + ",'" +
                #                 arr[0] + "','" + arr[1] + "')")
                cur.execute("rollback")
            # if (str(table[j, 2]) == 'nan'):
            #     print(vac_id)

                if (str(table[j, 2]) != 'nan'):
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
