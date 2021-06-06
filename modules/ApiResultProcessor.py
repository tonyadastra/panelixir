import json


class DocsTableProcessor(object):
    def __init__(self, api_result):
        self.summary = []
        self.document = {}
        self.all_text = ""
        self.prev_content = ""
        self.prevHasBullet = False
        self.prevNestedList = False
        self.prevListType = "ul"
        self.process_api_result(api_result)

    def process_api_result(self, api_result):
        doc_dict = api_result.json()
        self.document = doc_dict
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

    def process_list_id(self, listID, nestingLevel=0):
        # print(self.document.keys())
        try:
            lists_dict = self.document["lists"]
            specified_list = lists_dict[listID]
            listProperty = specified_list['listProperties']['nestingLevels'][nestingLevel]
            # print(json.dumps(specified_list['listProperties']['nestingLevels'][nestingLevel],indent=2))

            glyphType = listProperty.get("glyphType", None)
            glyphSymbol = listProperty.get("glyphSymbol", None)
            ulSymbols = ["●", "○", "■", "\u25cf"]
            olGlyphTypes = ["DECIMAL", "ROMAN", "ALPHA", "UPPER_ALPHA", "UPPER_ROMAN"]
            if glyphType == "GLYPH_TYPE_UNSPECIFIED" or glyphSymbol in ulSymbols:
                return "ul"
            elif glyphType in olGlyphTypes:
                return "ol"
            # for listProperty in specified_list['nestingLevels']:
        except KeyError:
            raise Exception("Key not found.")

        return "ul"

    def process_table(self, table_dict, table_count):
        for tableRowContent in table_dict["tableRows"]:
            for tableCellMain in tableRowContent["tableCells"]:
                for tableCellContent in tableCellMain['content']:
                    if "paragraph" not in tableCellContent:
                        if "table" in tableCellContent:
                            self.all_text += "<table class='table table-bordered'><tbody>"
                            table = tableCellContent['table']
                            tableRows = table['tableRows']
                            for tableRow in tableRows:
                                self.all_text += "<tr>"
                                for tableColumn in tableRow['tableCells']:
                                    for tableCellElement in tableColumn['content']:
                                        self.all_text += "<td>"
                                        self.process_cell_content(tableCellElement)
                                        self.all_text += "</td>"
                                self.all_text += "</tr>"
                            self.all_text += "</tbody></table>"
                        continue
                    if table_count == 1:
                        todayInfo = ""
                        for tableCellElement in tableCellContent["paragraph"]["elements"]:
                            # if "Bell Schedule".lower() in tableCellElement.lower():
                            try:
                                todayInfo += tableCellElement['textRun']['content']
                            except KeyError:
                                continue
                        self.summary.append({"todayInfo": todayInfo})
                    self.process_cell_content(tableCellContent)

        if self.all_text:
            self.summary.append({"text": self.all_text})
            self.all_text = ""

    def process_cell_content(self, table_cell_dict):
        # hasBullet = False
        paragraph = table_cell_dict["paragraph"]
        # paragraphStyle = table_cell_dict["paragraph"]
        if "bullet" in paragraph:
            listID = paragraph['bullet']['listId']
            nestingLevel = paragraph['bullet'].get("nestingLevel", 0)
            listType = self.process_list_id(listID, nestingLevel=nestingLevel)

            if nestingLevel > 0:
                # nestingLevel = paragraph['bullet']['nestingLevel']
                if not self.prevNestedList:
                    self.all_text += f"<{listType}>"
                else:
                    self.all_text += "</li>"
                self.all_text += "<li>"
                self.prevNestedList = True
                self.prevListType = listType

            elif "nestingLevel" not in paragraph['bullet'] or nestingLevel == 0:
                if self.prevNestedList:
                    self.all_text += f"</{listType}>"
                self.prevNestedList = False

            if not nestingLevel > 0:
                if not self.prevHasBullet:
                    self.all_text += f"<{listType}>"
                else:
                    self.all_text += "</li>"
                self.all_text += "<li>"
                self.prevHasBullet = True
                self.prevNestedList = False
                self.prevListType = listType
            # hasBullet = True
        else:
            if self.prevHasBullet:
                # print(self.prevListType)
                self.all_text += f"</{self.prevListType}>"
            self.prevHasBullet = False

        for tableCellElement in paragraph["elements"]:

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
                        heading_text_content = f"<i> {heading_text_content}</i>"

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
                    text_content = self.process_text_content(textRun)
                    # else:
                    # if self.all_text.strip():
                    self.all_text += text_content
                    self.prev_content = text_content
            else:
                if not self.all_text.endswith("\n\n"):
                    self.all_text += "\n"

    def process_text_content(self, textRun):
        text_content = textRun['content']

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
        return text_content

    def organize_summary(self):
        # Join same tags that are consecutive
        self.summary = [sText for sText in self.summary if next(iter(sText.values())).strip()]

        prev_key = ""
        addSpace = True
        for i, summaryText in enumerate(list(self.summary)):
            key = next(iter(summaryText))
            value = next(iter(summaryText.values())).strip()

            # if not value:
            #     continue

            if prev_key == key:
                try:
                    formatted_prev_value = self.summary[self.summary.index(summaryText) - 1][prev_key].strip()

                    self.summary[self.summary.index(summaryText) - 1][prev_key] = \
                        formatted_prev_value + f"{' ' if addSpace else ''}{value}"
                    addSpace = True
                    self.summary.remove(summaryText)
                except IndexError:
                    # print(self.summary[i - 1].values())
                    pass

            if len(value) < 2:
                addSpace = False

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
                        "College PEP Events", "Skyline College Priority Enrollment Program (PEP) -",
                        "State of the Student Summit: Of the Students"]
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

            exact_discard_keywords = ['Wednesday, May 26', 'th', 'nd', 'from 5-6pm PST', 'Wednesday, June 2',
                                      "RSVP:", "tinyurl.com/TeslaRSVP"]
            for eKeyword in exact_discard_keywords:
                if content.strip() == eKeyword.strip():
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
