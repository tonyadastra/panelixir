""" @author Tony Liu
    @version v1.1 - November 24, 2020
    @project PanElixir - Global COVID-19 Vaccine Tracker
    @description This program will adjust the format of the parameter passed in to fit the style of the
    PanElixir website
"""


def arrange_nytimes_info(info):
    # Styling for 'Phase' (Example: Phase 1 => Phase I)
    info = info.replace("\u2018", "'").replace("\u2019", "'").replace("\u2014", "-")
    info = info.replace('Phase 1/2', 'Phase I/II').replace("Phase 1 / 2", "Phase I/II").replace('Phase 2/3', 'Phase II/III').replace("Phase 2 / 3", "Phase II/III") \
        .replace('Phase 1', 'Phase I').replace('Phase 2', 'Phase II').replace('Phase 3', 'Phase III')
    info = info.replace('Covid-19', 'COVID-19')
    if "Jan." in info:
        info = info.replace('Jan.', 'January')
    if "Feb." in info:
        info = info.replace('Feb.', 'February')
    if "Mar." in info:
        info = info.replace('Mar.', 'March')
    if "Apr." in info:
        info = info.replace('Apr.', 'April')
    # No need to replace for May :)
    if "Jun." in info:
        info = info.replace('Jun.', 'June')
    if "Jul." in info:
        info = info.replace('Jul.', 'July')
    if "Aug." in info:
        info = info.replace('Aug.', 'August')
    if "Sept." in info:
        info = info.replace('Sept.', 'September')
    if "Oct." in info:
        info = info.replace('Oct.', 'October')
    if "Nov." in info:
        info = info.replace('Nov.', 'November')
    if "Dec." in info:
        info = info.replace('Dec.', 'December')
    return info
