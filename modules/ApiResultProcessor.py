import json


class DocsTableProcessor(object):
    def __init__(self, api_result):
        self.summary = []
        self.all_text = ""
        self.prev_content = ""
        self.process_api_result(api_result)

    def process_api_result(self, api_result):
        doc_dict = api_result.json()
        if "body" in doc_dict:
            self.process_body(doc_dict["body"])

    def process_body(self, body_dict):
        doc_content = body_dict["content"]
        tableCount = 0
        date = ""
        for i, content_element_dict in enumerate(doc_content):
            if "paragraph" in content_element_dict:
                for paragraphElement in content_element_dict['paragraph']['elements']:
                    try:
                        if foundTopDate(paragraphElement['textRun']):
                            date += paragraphElement['textRun']['content']
                    except KeyError:
                        continue

            if "table" in content_element_dict:
                if tableCount == 0:
                    self.summary.append({"date": date.strip()})

                tableCount += 1
                # if firstTable:
                #     for topTableContent
                #     print(content_element_dict['table']['tableRows'][0]['tableCells'][0])
                #     firstTable = False

                self.process_table(content_element_dict["table"], tableCount)

    def process_table(self, table_dict, table_count):
        for tableRowContent in table_dict["tableRows"]:
            for tableCellMain in tableRowContent["tableCells"]:
                for tableCellContent in tableCellMain['content']:
                    if table_count == 1:
                        todayInfo = ""
                        for tableCellElement in tableCellContent["paragraph"]["elements"]:
                            # if "Bell Schedule".lower() in tableCellElement.lower():
                            try:
                                todayInfo += tableCellElement['textRun']['content']
                            except KeyError:
                                continue
                        self.summary.append({"todayInfo": todayInfo})

                        # print(json.dumps(tableCellContent, indent=2))
                    self.process_cell_content(tableCellContent)
        if self.all_text:
            self.summary.append({"text": self.all_text})
            self.all_text = ""

    def process_cell_content(self, table_cell_dict):
        hasBullet = False
        for tableCellElement in table_cell_dict["paragraph"]["elements"]:
            if "bullet" in table_cell_dict["paragraph"]:
                hasBullet = True
            if "textRun" not in tableCellElement:
                if "person" in tableCellElement:
                    email = tableCellElement['person']['personProperties']['email']
                    self.all_text += f"<a href='mailto:{email}'>{email}</a>"
                continue

            textRun = tableCellElement['textRun']
            if textRun['content'] != "\n":
                if foundTargetCategory(textRun):
                    if self.all_text:
                        self.summary.append({"text": self.all_text})
                        self.all_text = ""
                    self.summary.append({"category": textRun['content'].replace('\n', '').strip()})

                elif foundTargetHeading(textRun):
                    heading_text_content = textRun['content'].replace('\n', '')
                    if self.all_text:
                        self.summary.append({"text": self.all_text})
                        self.all_text = ""
                    if "italic" in textRun['textStyle'] and textRun['textStyle']['italic']:
                        # the first space is to for the subheading-remove-all-caps; the &nbsp; inserts a word break
                        heading_text_content = f"<i> {heading_text_content}&nbsp;</i>"

                    self.summary.append({"heading": heading_text_content.strip()})
                    if "link" in textRun['textStyle']:
                        url = textRun['textStyle']['link']['url']
                        openInNewTab = True
                        if "@" in url:
                            openInNewTab = False
                        HTML_openInNewTab = "target='_blank'"
                        self.all_text += (f"<a {HTML_openInNewTab if openInNewTab else ''} " +
                                          f"href='{url}'>(link)</a>")

                else:
                    text_content = textRun['content']
                    if hasBullet:
                        if self.prev_content.endswith("\n"):
                            text_content = "&emsp;•&emsp;" + text_content

                    if "link" in textRun['textStyle']:
                        url = textRun['textStyle']['link']['url']
                        newLine = False
                        if text_content.startswith("http") or text_content.startswith("www."):
                            if len(text_content) > 70:
                                text_content = text_content[:70] + "..."
                                # newLine = True
                        openInNewTab = True
                        if "@" in url:
                            openInNewTab = False
                        HTML_openInNewTab = "target='_blank'"
                        text_content = (f"<a {HTML_openInNewTab if openInNewTab else ''} " +
                                        f"href='{url}'>{text_content.strip()}</a>")
                        if newLine:
                            text_content += "<br>"

                    elif ("bold" in textRun['textStyle']
                          or "underline" in textRun['textStyle']) and text_content.strip():
                        bold = textRun['textStyle'].get("bold", None)
                        underline = textRun['textStyle'].get("underline", None)
                        if bold or underline:
                            text_content = f"<b>{text_content}</b>"

                    if "italic" in textRun['textStyle'] and textRun['textStyle']['italic']:
                        text_content = f"<i>{text_content}</i>"

                    if "backgroundColor" in textRun['textStyle']:
                        backgroundColor = textRun['textStyle']["backgroundColor"]['color']['rgbColor']
                        bgRed, bgGreen, bgBlue = 0, 0, 0
                        if "red" in backgroundColor:
                            bgRed = backgroundColor['red']
                        if "green" in backgroundColor:
                            bgGreen = backgroundColor['green']
                        if "blue" in backgroundColor:
                            bgBlue = backgroundColor['blue']

                        if bgRed == 1 and bgGreen == 1 and bgBlue == 0:
                            text_content = f"<mark>{text_content}</mark>"

                    # else:
                    # if self.all_text.strip():
                    self.all_text += text_content
                    self.prev_content = text_content
            else:
                if not self.all_text.endswith("\n\n"):
                    self.all_text += "\n"

    def organize_summary(self):
        # Join same tags that are consecutive
        self.summary = [sText for sText in self.summary if next(iter(sText.values())).strip()]

        prev_key = ""
        for i, summaryText in enumerate(list(self.summary)):
            key = next(iter(summaryText))
            value = next(iter(summaryText.values())).strip()

            # if not value:
            #     continue

            if prev_key == key:
                try:
                    formatted_prev_value = self.summary[self.summary.index(summaryText) - 1][prev_key].strip()

                    self.summary[self.summary.index(summaryText) - 1][prev_key] = formatted_prev_value + f" {value}"
                    self.summary.remove(summaryText)
                except IndexError:
                    # print(self.summary[i - 1].values())
                    pass

                # except KeyError:
                #     print(self.summary[i - 1])
            prev_key = key

    def return_processed_json(self):
        self.organize_summary()
        # print(json.dumps(self.summary, indent=2))
        return self.summary


def foundTopDate(text_run):
    text_style = text_run['textStyle']
    if ("fontSize" in text_style and text_style['fontSize']['magnitude'] == 18
            and text_style['fontSize']['unit'] == "PT"):
        return True


def foundTargetHeading(text_run):
    text_style = text_run['textStyle']
    content = text_run['content']
    targetExceptions = ["SMUHSD Scholarship Handbook 2020-21", "CSM Promise Scholars Application Workshops",
                        "Counseling Office & Career Center Newsletters for Juniors & Seniors",
                        "Virtual College Visits for SMUHSD Students", "College of San Mateo Umoja Info Sessions",
                        "College Board BigFuture Days - Virtual College Fairs",
                        "Burlingame Rotary & Lions Club Scholarships", "Burlingame Alumni Association Scholarship",
                        "BHS Faculty & Staff Scholarship",
                        "BHS Booster Scholarships - Athletics, Drama, Music, and Italian Exchange",
                        "San Mateo County Alumnae Panhellenic Scholarship",
                        "Citizens Environmental Council of Burlingame Scholarship",
                        "San Mateo Organization for Chinese Americans Scholarship",
                        "San Mateo Credit Union Scholarship",
                        "Sons of Italy & Italian Catholic Federation Scholarships", "Law Scholarship",
                        "Asian Pacific Fund Scholarships", "TheDream.US Scholarship",
                        "Cabrillo Civic Clubs of California", "Students Rising Above (JUNIORS)",
                        "Counseling Office & Career Center Newsletters for Juniors & Seniors",
                        "Common App Essay Presentation - Class of 2022",
                        "Upcoming Events for Admitted Students - CSU & UC",
                        "RACC Virtual College Fair", "CSM Connect to College - April 29th",
                        "CSM Promise Scholars Program - Application Workshops",
                        "SMUHSD Black Parent Group Scholarship", "Skyline College Family Night Webinar -",
                        "Tips on How to Access College & Career Prep Resources at BHS - ",
                        "College PEP Events", "Skyline College Priority Enrollment Program (PEP) -"]
    for exception in targetExceptions:
        if content.strip() == exception:
            return True

    if not content.strip():
        return False

    accepted_fontSizes = [11, 12, 13]
    if "bold" in text_style and "underline" in text_style:
        if (text_style['bold'] is True and text_style['underline'] is True and
                ("fontSize" not in text_style or
                 ("fontSize" in text_style and text_style['fontSize']['magnitude'] in accepted_fontSizes
                  and text_style['fontSize']['unit'] == "PT"))):
            if "foregroundColor" in text_style:
                foregroundColor = text_style['foregroundColor']['color']['rgbColor']
                fgRed, fgGreen, fgBlue = 0, 0, 0
                if "red" in foregroundColor:
                    fgRed = foregroundColor['red']
                if "green" in foregroundColor:
                    fgGreen = foregroundColor['green']
                if "blue" in foregroundColor:
                    fgBlue = foregroundColor['blue']

                if not (fgRed == fgGreen == fgBlue) \
                        and \
                        not (fgRed == 0.06666667 and fgGreen == 0.33333334 and fgBlue == 0.8):
                    return False
            discard_keywords = ["https", "www", "register here", "here"]
            discard = False
            for keyword in discard_keywords:
                if keyword.lower() in content.lower():
                    discard = True
            if not discard:
                return True
    return False


def foundTargetCategory(text_run):
    text_style = text_run['textStyle']
    content = text_run['content']
    if "bold" in text_style and "fontSize" in text_style:
        accepted_fontSize = [14, 15, 16]
        if text_style['bold'] is True and text_style['fontSize']['magnitude'] in accepted_fontSize \
                and text_style['fontSize']['unit'] == "PT":
            discard_keywords = []
            discard = False
            for keyword in discard_keywords:
                if keyword.lower() in content.lower():
                    discard = True
            if not discard:
                return True
