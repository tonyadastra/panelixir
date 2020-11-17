def arrange_nytimes_info(info):
    # Styling for 'Phase'
    info = info.replace('Phase 1/2', 'Phase I/II').replace('Phase 2/3', 'Phase II/III') \
        .replace('Phase 1', 'Phase I').replace('Phase 2', 'Phase II').replace('Phase 3', 'Phase III')
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
