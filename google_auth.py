import functools
import os
import flask
from dotenv import load_dotenv
from authlib.client import OAuth2Session
import google.oauth2.credentials
import googleapiclient.discovery
from models.models import Db, User


load_dotenv('.env')

ACCESS_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent'

AUTHORIZATION_SCOPE = 'openid email profile'

AUTH_REDIRECT_URI = os.environ.get("FN_AUTH_REDIRECT_URI")
BASE_URI = os.environ.get("FN_BASE_URI")
CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

AUTH_TOKEN_KEY = 'auth_token'
AUTH_STATE_KEY = 'auth_state'

app = flask.Blueprint('google_auth', __name__)


def is_logged_in():
    return True if AUTH_TOKEN_KEY in flask.session else False


def build_credentials():
    if not is_logged_in():
        raise Exception('User must be logged in')

    oauth2_tokens = flask.session[AUTH_TOKEN_KEY]

    return google.oauth2.credentials.Credentials(
        oauth2_tokens['access_token'],
        refresh_token=oauth2_tokens['refresh_token'],
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        token_uri=ACCESS_TOKEN_URI
    )


def get_user_info():
    credentials = build_credentials()

    oauth2_client = googleapiclient.discovery.build(
        'oauth2', 'v2',
        credentials=credentials)

    return oauth2_client.userinfo().get().execute()


def no_cache(view):
    @functools.wraps(view)
    def no_cache_impl(*args, **kwargs):
        response = flask.make_response(view(*args, **kwargs))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return functools.update_wrapper(no_cache_impl, view)


@app.route('/google/login')
# @no_cache
def login():
    redirect_uri = flask.request.args.get('uri', default=None)
    if redirect_uri is not None:
        flask.session['redirect_uri'] = redirect_uri

    session = OAuth2Session(CLIENT_ID, CLIENT_SECRET,
                            scope=AUTHORIZATION_SCOPE,
                            redirect_uri=AUTH_REDIRECT_URI)

    uri, state = session.create_authorization_url(AUTHORIZATION_URL)

    flask.session[AUTH_STATE_KEY] = state
    flask.session.permanent = True

    return flask.redirect(uri, code=302)


@app.route('/google/auth')
# @no_cache
def google_auth_redirect():
    global BASE_URI

    req_state = flask.request.args.get('state', default=None, type=None)
    # if not req_state or AUTH_STATE_KEY not in flask.session:
    #     flask.abort(400, "invalid request.")
    try:
        # if req_state != flask.session[AUTH_STATE_KEY]:
        #     response = flask.make_response('Invalid state parameter', 401)
        #     return response

        session = OAuth2Session(CLIENT_ID, CLIENT_SECRET,
                                scope=AUTHORIZATION_SCOPE,
                                state=req_state,
                                redirect_uri=AUTH_REDIRECT_URI)

        oauth2_tokens = session.fetch_access_token(
            ACCESS_TOKEN_URI,
            authorization_response=flask.request.url)

        flask.session[AUTH_TOKEN_KEY] = oauth2_tokens

        user_info = get_user_info()
        flask.session['user_info'] = user_info
        user = User.query.filter_by(email=user_info['email']).first()
        if user is None:
            return flask.redirect(flask.url_for("forum.newUser"))
        else:
            flask.session['username'] = user.username

        if "redirect_uri" in flask.session:
            BASE_URI = flask.session['redirect_uri']

    except Exception as e:
        print(e)

    return flask.redirect(BASE_URI, code=302)


@app.route('/google/logout')
# @no_cache
def logout():
    flask.session.pop(AUTH_TOKEN_KEY, None)
    flask.session.pop(AUTH_STATE_KEY, None)

    flask.session.clear()

    return flask.redirect('/forum', code=302)
