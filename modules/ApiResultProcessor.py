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
        for i, content_element_dict in enumerate(doc_content):
            if "table" in content_element_dict:
                self.process_table(content_element_dict["table"])

    def process_table(self, table_dict):
        for tableRowContent in table_dict["tableRows"]:
            for tableCellMain in tableRowContent["tableCells"]:
                for tableCellContent in tableCellMain['content']:
                    self.process_cell_content(tableCellContent)
        if self.all_text:
            self.summary.append({"text": self.all_text})
            self.all_text = ""

    def process_cell_content(self, table_cell_dict):
        hasBullet = False
        for tableCellElement in table_cell_dict["paragraph"]["elements"]:
            if "bullet" in table_cell_dict["paragraph"]:
                hasBullet = True
            textRun = tableCellElement['textRun']
            if textRun['content'] != "\n":
                if foundTargetHeading(textRun):
                    if self.all_text:
                        self.summary.append({"text": self.all_text})
                        self.all_text = ""
                    self.summary.append({"heading": textRun['content'].replace('\n', '').strip()})

                elif foundTargetSubheading(textRun):
                    if self.all_text:
                        self.summary.append({"text": self.all_text})
                        self.all_text = ""

                    self.summary.append({"subheading": textRun['content'].replace('\n', '').strip()})

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
                    elif "bold" in textRun['textStyle'] or "underline" in textRun['textStyle']:
                        text_content = f"<b>{text_content}</b>"

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
        self.summary = [sText for sText in self.summary if next(iter(sText.values())).strip()]

        prev_key = ""
        for i, summaryText in enumerate(list(self.summary)):
            key = next(iter(summaryText))
            value = next(iter(summaryText.values())).strip()
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


def foundTargetSubheading(text_run):
    text_style = text_run['textStyle']
    content = text_run['content']
    targetExceptions = ["CSM Promise Scholars Application Workshops",
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
                        "Cabrillo Civic Clubs of California", "Students Rising Above (JUNIORS)"]
    for exception in targetExceptions:
        if content.strip() == exception:
            return True

    if "link" in text_style or not content.strip():
        return False

    if "bold" in text_style and "underline" in text_style:
        if text_style['bold'] is True and text_style['underline'] is True:
            discard_keywords = ["https", "www", "register here"]
            discard = False
            for keyword in discard_keywords:
                if keyword.lower() in content.lower():
                    discard = True
            if not discard:
                return True


def foundTargetHeading(text_run):
    text_style = text_run['textStyle']
    content = text_run['content']
    if "bold" in text_style and "fontSize" in text_style:
        if text_style['bold'] is True and text_style['fontSize']['magnitude'] == 14 \
                and text_style['fontSize']['unit'] == "PT":
            discard_keywords = []
            discard = False
            for keyword in discard_keywords:
                if keyword.lower() in content.lower():
                    discard = True
            if not discard:
                return True

