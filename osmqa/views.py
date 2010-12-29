#
# The code for this controller was inspired from the "Twitter Three-legged
# OAuth Example" at <https://github.com/simplegeo/python-oauth2>
#

import urlparse
from xml.etree import ElementTree

import oauth2 as oauth

from pyramid.response import Response
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound

#
# Constants
#

# our oauth key and secret (we're the consumer in the oauth protocol)
# <http://www.openstreetmap.org/user/erilem/oauth_clients/217>
CONSUMER_KEY = 'fxGma7joOqfMiG97vxGzg'
CONSUMER_SECRET = '7kZ81u3zjlGTLtjgX7j4rfSNRJHwHyX8UNBBIvXb55k'

# OSM oauth URLs
BASE_URL = 'http://www.openstreetmap.org/oauth'
REQUEST_TOKEN_URL = '%s/request_token' % BASE_URL
ACCESS_TOKEN_URL = '%s/access_token' % BASE_URL
AUTHORIZE_URL = '%s/authorize' % BASE_URL

# OSM user details URL
USER_DETAILS_URL = 'http://api.openstreetmap.org/api/0.6/user/details'

#
# Views
#

# an oauth consumer instance using our key and secret
consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

@view_config(route_name='index', renderer='index.mako') 
def index(request):
    return {"user": request.session.get("user")}

@view_config(route_name='login')
def login(request):
    # get the request token
    client = oauth.Client(consumer)
    resp, content = client.request(REQUEST_TOKEN_URL, "GET")
    if resp['status'] != '200':
        abort(502)
    request_token = dict(urlparse.parse_qsl(content))
    # store the request token in the session, we'll need in the callback
    session = request.session
    session['request_token'] = request_token
    session.save()
    oauth_callback = request.route_url('oauth_callback')
    redirect_url = "%s?oauth_token=%s&oauth_callback=%s" % \
            (AUTHORIZE_URL, request_token['oauth_token'], oauth_callback)
    return HTTPFound(location=redirect_url)

@view_config(route_name='oauth_callback')
def oauth_callback(request):
    # the request token we have in the user session should be the same
    # as the one passed to the callback
    session = request.session
    request_token = session.get('request_token')
    if request.params.get('oauth_token') != request_token['oauth_token']:
        abort(500)
    # get the access token
    token = oauth.Token(request_token['oauth_token'],
                        request_token['oauth_token_secret'])
    client = oauth.Client(consumer, token)
    resp, content = client.request(ACCESS_TOKEN_URL, "POST")
    access_token = dict(urlparse.parse_qsl(content))
    token = access_token['oauth_token']
    token_secret = access_token['oauth_token_secret']
    # get the user details, finally
    token = oauth.Token(token, token_secret)
    client = oauth.Client(consumer, token)
    resp, content = client.request(USER_DETAILS_URL, "GET")
    user_elt = ElementTree.XML(content).find('user')
    # save the user's "display name" in the session
    if 'display_name' in user_elt.attrib:
        session['user'] = user_elt.attrib['display_name']
        session.save()
    # and redirect to the main page
    return HTTPFound(location=request.route_url('index'))

@view_config(route_name='logout')
def logout(request):
    session = request.session
    session.clear()
    session.save()
    return HTTPFound(location=request.route_url('index'))
