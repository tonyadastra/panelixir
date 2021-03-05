'''
This program lists lists the Google Compute Engine Instances in one zone
'''
# Author: John Hanley
# https://www.jhanley.com

import time
import json
import jwt
import requests
import httplib2
import flask

app = flask.Blueprint('daily_bulletin', __name__)

# Project ID for this request.
project = 'calendar-1613977057601'

# The name of the zone for this request.
zone = 'us-west1-a'

# Service Account Credentials, Json format
json_filename = 'models/calendar-1613977057601-6d8f60ed2291.json'

# Permissions to request for Access Token
scopes = "https://www.googleapis.com/auth/documents.readonly"

# Set how long this token will be valid in seconds
expires_in = 3600  # Expires in 1 hour


def load_json_credentials(filename):
    ''' Load the Google Service Account Credentials from Json file '''

    with open(filename, 'r') as f:
        data = f.read()

    return json.loads(data)


def load_private_key(json_cred):
    ''' Return the private key from the json credentials '''

    return json_cred['private_key']


def create_signed_jwt(pkey, pkey_id, email, scope):
    ''' Create a Signed JWT from a service account Json credentials file
    This Signed JWT will later be exchanged for an Access Token '''

    # Google Endpoint for creating OAuth 2.0 Access Tokens from Signed-JWT
    auth_url = "https://www.googleapis.com/oauth2/v4/token"

    issued = int(time.time())
    expires = issued + expires_in  # expires_in is in seconds

    # Note: this token expires and cannot be refreshed. The token must be recreated

    # JWT Headers
    additional_headers = {
        'kid': pkey_id,
        "alg": "RS256",
        "typ": "JWT"  # Google uses SHA256withRSA
    }

    # JWT Payload
    payload = {
        "iss": email,  # Issuer claim
        "sub": email,  # Issuer claim
        "aud": auth_url,  # Audience claim
        "iat": issued,  # Issued At claim
        "exp": expires,  # Expire time
        "scope": scope  # Permissions
    }

    # Encode the headers and payload and sign creating a Signed JWT (JWS)
    sig = jwt.encode(payload, pkey, algorithm="RS256", headers=additional_headers)

    return sig


def exchangeJwtForAccessToken(signed_jwt):
    '''
    This function takes a Signed JWT and exchanges it for a Google OAuth Access Token
    '''

    auth_url = "https://www.googleapis.com/oauth2/v4/token"

    params = {
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": signed_jwt
    }

    r = requests.post(auth_url, data=params)

    if r.ok:
        return (r.json()['access_token'], '')

    return None, r.text


def gce_list_instances(accessToken):
    '''
    This functions lists the Google Compute Engine Instances in one zone
    '''

    # Endpoint that we will call
    url = "https://www.googleapis.com/compute/v1/projects/" + project + "/zones/" + zone + "/instances"

    # One of the headers is "Authorization: Bearer $TOKEN"
    headers = {
        "Host": "www.googleapis.com",
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
    }

    h = httplib2.Http()

    resp, content = h.request(uri=url, method="GET", headers=headers)

    status = int(resp.status)

    if status < 200 or status >= 300:
        print('Error: HTTP Request failed')
        return

    j = json.loads(content.decode('utf-8').replace('\n', ''))

    print('Compute instances in zone', zone)
    print('------------------------------------------------------------')
    for item in j['items']:
        print(item['name'])


def foundTargetSubheading(textRun):
    text_style = textRun['textStyle']
    content = textRun['content']
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


def foundTargetHeading(textRun):
    text_style = textRun['textStyle']
    content = textRun['content']
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


@app.route('/get-bhs-daily-bulletin-data')
def get_daily_bulletin_data():
    cred = load_json_credentials(json_filename)

    private_key = load_private_key(cred)

    s_jwt = create_signed_jwt(
        private_key,
        cred['private_key_id'],
        cred['client_email'],
        scopes)

    token, err = exchangeJwtForAccessToken(s_jwt)

    if token is None:
        print('Error:', err)
        exit(1)
    # print(token)

    # print(token)
    daily_bulletin_api = requests.get(
        'https://docs.googleapis.com/v1/documents/1tyq-Gj_VwNbucWIelMOBYVkYT3_QixGGxDc9qC_K2uI?access_token=' + token
    )

    summary = []
    all_text = ""
    prev_content = ""
    for key, docContent in daily_bulletin_api.json().items():
        if key == "body":
            content = docContent['content']
            for i, body_content in enumerate(content):
                if "table" in body_content:
                    for sKey, tableContent in content[i]['table'].items():
                        if sKey == "tableRows":
                            for tableRowContent in tableContent:
                                for tableCellMain in tableRowContent['tableCells']:
                                    for tableCellContent in tableCellMain['content']:
                                        hasBullet = False
                                        for tableCellElement in tableCellContent['paragraph']['elements']:
                                            if "bullet" in tableCellContent['paragraph']:
                                                hasBullet = True

                                            textRun = tableCellElement['textRun']
                                            if textRun['content'] != "\n":
                                                if foundTargetHeading(textRun):
                                                    if all_text:
                                                        summary.append({"text": all_text})
                                                        all_text = ""
                                                    summary.append({"heading": textRun['content']
                                                                   .replace('\n', '').strip()})

                                                elif foundTargetSubheading(textRun):
                                                    if all_text:
                                                        summary.append({"text": all_text})
                                                        all_text = ""

                                                    summary.append({"subheading": textRun['content']
                                                                   .replace('\n', '').strip()})

                                                else:
                                                    text_content = textRun['content']
                                                    if hasBullet:
                                                        if prev_content.endswith("\n"):
                                                            text_content = "&emsp;•&emsp;" + text_content

                                                    if "link" in textRun['textStyle']:
                                                        url = textRun['textStyle']['link']['url']
                                                        if len(text_content) > 70 and (text_content.startswith("http") or text_content.startswith("www.")):
                                                            text_content = text_content[:70] + "..."
                                                        all_text += "<a target='_blank' href='" + url + "'>" + text_content + "</a>"

                                                    else:
                                                        all_text += text_content
                                                    prev_content = text_content

    if all_text:
        summary.append({"text": all_text.strip()})

    ordered_summary = []
    heading = {}
    subheading = {}
    subheading_array = []
    text = {}
    for summaryText in summary:
        if "heading" in summaryText:
            if len(subheading_array) != 0 and len(heading) != 0:
                heading['body'] = subheading_array
                ordered_summary.append(heading)
                subheading_array = []
            heading = {"structure": "heading", "innerText": summaryText['heading']}
        if "subheading" in summaryText:
            if len(text) != 0 and len(subheading) != 0:
                subheading['body'] = text
                text = ""

            subheading = {"structure": "subheading", "innerText": summaryText['subheading']}
            subheading_array.append(subheading)
        if "text" in summaryText:
            text = {"structure": "text", "innerText": summaryText['text']}
            # ordered_summary
            # print(heading)
    subheading_array[-1]['body'] = text
    heading['body'] = subheading_array
    ordered_summary.append(heading)
    return flask.jsonify(ordered_summary)


@app.after_request
def apply_caching(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

    # gce_list_instances(token)
