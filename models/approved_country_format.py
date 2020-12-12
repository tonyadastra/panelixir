def format_country(country_array):
    for idx, country in enumerate(country_array):
        if "U.A.E." in country:
            country_array[idx] = country.replace("U.A.E.", "United Arab Emirates")
        if "U.S." in country:
            country_array[idx] = country.replace("U.S.", "United States")
        if "U.K." in country:
            country_array[idx] = country.replace("U.K.", "United Kingdom")
        if idx == len(country_array) - 1:
            if country_array[idx].endswith('.'):
                country_array[idx] = country[0: len(country) - 1]
        if ". " in country:
            country_array[idx] = country.replace(". ", "").strip()
            country_array = country_array[0: idx + 1]
            break
    return country_array
