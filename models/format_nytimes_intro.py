""" @author Tony Liu, Lola Liu
    @version v1.0 - November 15, 2020
    @project PanElixir - Global COVID-19 Vaccine Tracker
    @description This program will return NYTimes vaccine intro in appropriate format to determine whether an
    update is present in the latest scraped data
"""


def format_intro(nytimes_intro):
    for i in range(len(nytimes_intro)):
        nytimes_intro[i] = nytimes_intro[i].strip()

    join_indexes = []
    for idx, intro in enumerate(nytimes_intro):
        if intro[0].isdigit():
            join_indexes.append(idx - 1)
        if intro.endswith('U.S') or intro.endswith('St'):
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

    return formatted_new_intro
