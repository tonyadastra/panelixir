""" @author Tony Liu
    @version v1.0 - November 12, 2020
    @project PanElixir - Global COVID-19 Vaccine Tracker
    @description This program will find the corresponding logo path for each vaccine company to be processed in the
    JAVASCRIPT document and displayed on the webpage
"""
import os


def match_logo(data, company_pos):
    for i, intro in enumerate(data):
        intro_list = list(intro)
        if "/" in intro_list[company_pos]:
            company_array = intro_list[company_pos].split('/')
        elif "&" in intro_list[company_pos]:
            company_array = intro_list[company_pos].split('&')
        else:
            company_array = intro_list[company_pos].replace(', ', ',').replace(',Ltd', ' Ltd').replace(',Inc', ' Inc').split(',')
        vaccine_id = intro_list[0]
        logo_array = []
        for idx, company in enumerate(company_array):
            # Logo format:
            logo = '../static/img/' + str(vaccine_id) + '-' + str(idx + 1) + '.png'
            if os.path.isfile(logo.replace('..', '.')):
                logo_array.append(logo)
        intro_list.insert(3, logo_array)
        data[i] = intro_list
