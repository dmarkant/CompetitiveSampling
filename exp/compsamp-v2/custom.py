# this file imports custom routes into the experiment server

from flask import Blueprint, render_template, request, jsonify, Response, abort, current_app
from jinja2 import TemplateNotFound
from functools import wraps
from sqlalchemy import or_

from psiturk.psiturk_config import PsiturkConfig
from psiturk.experiment_errors import ExperimentError
from psiturk.user_utils import PsiTurkAuthorization, nocache

# # Database setup
from psiturk.db import db_session, init_db
from psiturk.models import Participant
from json import dumps, loads

import time

# load the configuration options
config = PsiturkConfig()
config.load_config()
myauth = PsiTurkAuthorization(config)  # if you want to add a password protect route use this

# explore the Blueprint
custom_code = Blueprint('custom_code', __name__, template_folder='templates', static_folder='static')


class EventList(object):

    def __init__(self):
        self.events = []
        self.index = 0

    def post(self, message):
        self.events.append(message)

    def stream(self):

        while True:
            if self.index < len(self.events):
                for ev in self.events[self.index:]:
                    self.index += 1
                    yield ev

"""
@custom_code.route('/postevent', methods=['POST'])
def post():
    # Get a posted event message and broadcast it to all other
    # connected users

    print request
    print request.form
    return 'OK'


@custom_code.route('/events', methods=['GET'])
def subscribe():
    # Return the event stream
    return Response(event_stream(), mimetype='text/event-stream')


@custom_code.route('/socket')
def test_socket():
    return render_template('socket.html')


@socketio.on('send', namespace=socket_ns)
def test_message(message):
    emit('my response', {'data': message['data']})


@socketio.on('broadcast', namespace=socket_ns)
def test_message(message):
    print('Received message for broadcast:', message['data'])

    message_type = message['data']['type']
    session_id = message['data']['session-id']

    if message_type == u'random':
        response = message['data']
        response['random'] = random()

    else:
        response = message['data']

    # limit response only to those clients with the same
    # session id
    respname = '%s %s' % (session_id, message_type)
    emit(respname, message['data'], broadcast=True)



@socketio.on('connect', namespace=socket_ns)
def test_connect():
    print('Client connected')
    emit('connection response', {'data': 'Connected'})


@socketio.on('disconnect', namespace=socket_ns)
def test_disconnect():
    print('Client disconnected')
"""



#----------------------------------------------
# example custom route
#----------------------------------------------
@custom_code.route('/my_custom_view')
def my_custom_view():
	try:
		return render_template('custom.html')
	except TemplateNotFound:
		abort(404)

#----------------------------------------------
# example using HTTP authentication
#----------------------------------------------
@custom_code.route('/my_password_protected_route')
@myauth.requires_auth
def my_password_protected_route():
	try:
		return render_template('custom.html')
	except TemplateNotFound:
		abort(404)

#----------------------------------------------
# example accessing data
#----------------------------------------------
@custom_code.route('/view_data')
@myauth.requires_auth
def list_my_data():
        users = Participant.query.all()
	try:
		return render_template('list.html', participants=users)
	except TemplateNotFound:
		abort(404)

if __name__ == '__main__':
    print 'CUSTOM MAIN'
    #host=host, port=port
