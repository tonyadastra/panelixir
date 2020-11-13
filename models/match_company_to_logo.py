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
        # print(intro_list[3])
        logo_array = []
        for idx, company in enumerate(company_array):
            logo = '../static/img/' + str(vaccine_id) + '-' + str(idx + 1) + '.png'
            logo_array.append(logo)
        intro_list.insert(3, logo_array)
        data[i] = intro_list
