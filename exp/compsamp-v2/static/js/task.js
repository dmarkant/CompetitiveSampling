/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = PsiTurk(uniqueId, adServerLoc);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html",
    "session.html"
];
psiTurk.preloadPages(pages);


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/



/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() { 
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, 
            error: prompt_resubmit});
	});
    
	
};




/*******************
 * Socket
 ******************/
var session_id;
var socket_ns = '/session';

var Connection = function(session){

	var self = this;
	self.session = session;

	self.send = function(data) {
		self.socket.emit('send', {'data': data});
	};

	self.broadcast = function(data){
		console.log(data);
		self.socket.emit('broadcast', {'data': data});
	};
	
	self.open = function(){

		self.socket = io.connect('http://' + document.domain + ':' + location.port + socket_ns);

        self.socket.on('connection response', function(msg) {
			self.session.proceed('socket established');
        });

		self.socket.on('my response', function(msg) {
			self.session.receive(msg);
		});

	};

	self.add_response_handlers = function(session_id, respnames) {
        // tell connection about messages that should be accepted and
        // passed back to the session
        for (var i=0; i<respnames.length; i++) {
            var resp = session_id + ' ' + respnames[i];
    		console.log('creating response handler from socket: ', resp);        
            self.socket.on(resp, function(msg) {
                self.session.receive(msg);
            });
        };

	};

};


var PLAYERS_PER_SESSION = 4;





/*******************
 * Session
 ******************/
var message_types = ['player-connected',
                     'player-pairings',
                     'sample-decision',
                     'stop-decision',
                     'ready-to-play',
                     'random'];

var MultiplayerSession = function(callback) {
	var self = this;
	self.session_id = undefined;
	self.players = [uniqueId];
	self.msgs = [];

	self.game_msgs = [];
	self.callbacks = [];

	self.send = function(msg_type, msg_id, data) {
		self.connection.broadcast({'session-id': self.session_id, 'type': msg_type, 'id': msg_id, 'uniqueId': uniqueId, 'data': data});
	};

	self.receive = function(data) {
        //console.log('received data', data);

		// First, check against list of registered callbacks
		var remaining = [];
		for (var i=0; i<self.callbacks.length; i++) {
			var c = self.callbacks[i];

			if ((c.msg_type === data.type) && (c.msg_id === data.id) && ((c.player_id === undefined) || (c.player_id === data.uniqueId))) {
				c.callback(data);
			} else {
				remaining.push(c);	
			};
		};
		self.callbacks = remaining;
		

		if (data.type == 'player-connected') {

			if (self.players.indexOf(data.uniqueId) == -1) {

				// respond by broadcasting again
				self.connection.broadcast({'session-id': self.session_id, 'type': 'player-connected', 'uniqueId': uniqueId});
				self.players.push(data.uniqueId);
				
				$('#player-icons').append('<img src="static/images/player.png"/>');

				// if we've reached a quorum, try to establish pairings
				if (self.players.length == PLAYERS_PER_SESSION) {
					self.establish_pairings();
				};

			};

		};

		if (data.type == 'player-pairings') {
			// simply replace whatever local value is with new result
			console.log('received broadcast of player pairings');
			console.log(data);

			self.msgs.push(data.pairings);
			self.quota += 1;

			if (self.msgs.length == PLAYERS_PER_SESSION) {
				self.pairings = self.msgs[self.msgs.length-1];
				self.ready_for('instructions');
			};

		};

		if (data.type == 'sample-decision' && data.uniqueId!=uniqueId) {
			
			self.game_msgs.push({'msg_type': 'sample-decision', 'msg_id': data.id, 'uniqueId': data.uniqueId, 'data': data.data});

		};

		if (data.type == 'stop-decision' && data.uniqueId!=uniqueId) {
			
			self.game_msgs.push({'msg_type': 'stop-decision', 'msg_id': data.id, 'uniqueId': data.uniqueId, 'data': data.data});

		};
		

		if (data.type == 'ready-to-play' && data.uniqueId!=uniqueId) {
		
			self.game_msgs.push({'msg_type': 'ready-to-play', 'msg_id': data.id, 'uniqueId': data.uniqueId});

		};

		if (data.type == 'random') {
		
			self.game_msgs.push({'msg_type': 'random', 'msg_id': data.id, 'uniqueId': data.uniqueId});

		};

    };

	self.establish_pairings = function() {
	
		self.pairings = [];

		if (self.players.length == 2) {
			for (var i=0; i<NROUNDS; i++) {
				
				// need some balanced way to create pairings
				// var player_ind = [0, 1];
				self.pairings.push([[self.players[0], self.players[1]]]);

			};
		} else if (self.players.length == 4) {
			
			for (var r=0; r<(NROUNDS/3); r++) {
				var pairs = _.shuffle([[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]);
				for (var i=0; i<pairs.length; i++) {
					var p = pairs[i];
					self.pairings.push([[self.players[p[0][0]], self.players[p[0][1]]], [self.players[p[1][0]], self.players[p[1][1]]]]);
				};
			};

		};
	
		self.connection.broadcast({'session-id': self.session_id, 'type': 'player-pairings', 'pairings': self.pairings});

	};

	self.ready_for = function(phase) {
		
		if (phase == 'instructions') {
			$('#session-start-instruction').html('All players have joined. Press the button below to start the instructions.');
			$('#submit-session-num').val('Begin');
			$('#submit-session-num').click(function() {
				exp.begin();
			});
			$('#submit-session-num').css('visibility', 'visible');
			
		};	

	};


	self.register_callback = function(msg_type, msg_id, player_id, callback) {

		self.callbacks.push({'msg_type': msg_type, 'msg_id': msg_id, 'player_id': player_id, 'callback': callback});

	};


	self.check_or_wait_for = function(msg_type, msg_id, player_id, callback) {

		var result = _.select(self.game_msgs, function(msg){ 
			return (msg.msg_type == msg_type) && (msg.msg_id == msg_id) && ((msg.uniqueId == player_id) || (player_id === undefined))
		});
	
		if (result.length > 0) {
			callback(result[0]);
		} else {
			self.register_callback(msg_type, msg_id, player_id, callback);
		};

	};


	self.proceed = function(message) {
		console.log(message);
	};
	

	self.begin = function() {
	
		psiTurk.showPage('session.html');	
		$('#player-icons').append('<img src="static/images/player.png"/>');

		$('#submit-session-num').click(function() {

			$('#submit-session-num').css('visibility', 'hidden');
			$('#session-start-instruction').html('Waiting for rest of players to join.');

			var session_num = $('#session-num-entry').attr('value');
			// check that session_num is valid
			self.session_id = session_num;


			// create response handlers with the defined session id
            self.connection.add_response_handlers(self.session_id, message_types);
			/*self.connection.add_response_handler(self.session_id + ' ' + 'player-connected');
			self.connection.add_response_handler(self.session_id + ' ' + 'player-pairings');
			self.connection.add_response_handler(self.session_id + ' ' + 'sample-decision');
			self.connection.add_response_handler(self.session_id + ' ' + 'stop-decision');
			self.connection.add_response_handler(self.session_id + ' ' + 'ready-to-play');
			self.connection.add_response_handler(self.session_id + ' ' + 'random');
			*/
			self.connection.broadcast({'session-id': self.session_id, 'type': 'player-connected', 'uniqueId': uniqueId});
	
		});
		
		self.connection = new Connection(self);
		self.connection.open();

	};


};






/*******************
 * Run Task
 ******************/
$(window).load( function(){
	//exp = new CompetitiveSamplingExperiment();
	session = new MultiplayerSession();
	session.begin();
});
