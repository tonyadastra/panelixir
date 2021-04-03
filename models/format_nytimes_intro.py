""" @author Tony Liu, Lola Liu
    @version v1.0.2 - December 9, 2020
    @project PanElixir - Global COVID-19 Vaccine Tracker
    @description This program will return NYTimes vaccine intro in appropriate format to determine whether an
    update is present in the latest scraped data
"""


def format_intro(nytimes_intro):
    join_indexes = []
    for idx, intro in enumerate(nytimes_intro):
        try:
            if intro[0].isdigit():
                join_indexes.append(idx - 1)
        except IndexError:
            pass
        join_keywords = ['U.S', 'St', 'U.K', 'U.A.E', 'F.D.A', 'Dr', 'Vladimir V', 'C.E.O', 'Anthony S']
        for keyword in join_keywords:
            if intro.endswith(keyword):
                join_indexes.append(idx)

    formatted_new_intro = []

    class ContinueLoop(Exception):
        pass

    # if len(join_indexes) != 0:
    for j in range(len(nytimes_intro)):
        # for idx in join_indexes:
        try:
            for k in range(1, j + 1):
                if j - k in join_indexes:
                    raise ContinueLoop()
                else:
                    break
        except ContinueLoop:
            continue

        if j in join_indexes:
            string = nytimes_intro[j] + '. ' + nytimes_intro[j + 1]
            for k in range(1, len(nytimes_intro) - j):
                if j + k in join_indexes:
                    string += '. ' + nytimes_intro[j + k + 1]
                else:
                    break
            # if j + 2 in join_indexes:
            #     string += '. ' + nytimes_intro[j + 3]
            if not string.endswith('.') and not string.endswith('. '):
                string += '. '
            if string.endswith('.'):
                string += ' '
            formatted_new_intro.append(string)
        else:
            if not nytimes_intro[j].endswith('.') and not nytimes_intro[j].endswith('. '):
                nytimes_intro[j] += '. '
            if nytimes_intro[j].endswith('.'):
                nytimes_intro[j] += ' '
            formatted_new_intro.append(nytimes_intro[j])

    intro_after_split_quote = []
    for intro in formatted_new_intro:
        if ".” " in intro:
            split_quote_intro = intro.split(".” ")
            for idx, new_intro in enumerate(split_quote_intro):
                if idx == 0:
                    new_intro += ".” "
                intro_after_split_quote.append(new_intro)
        else:
            intro_after_split_quote.append(intro)

    return intro_after_split_quote
