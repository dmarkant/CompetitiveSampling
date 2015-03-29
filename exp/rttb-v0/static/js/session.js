var COL_BUTTON_PRESSED = "#78A0CA",
    COL_BUTTON_UNPRESS = "#FFD855";

var Connection = function(session){

    var self = this;
    self.session = session;
    self.token = null;
    self.channel = null;
    self.socket = null;

    self.init = function(response) {
        // create one-way channel to receive updates from server
        self.token = response.channel;
        self.channel = new goog.appengine.Channel(self.token);
        self.socket = self.channel.open();
        self.socket.onopen = onOpened;
        self.socket.onmessage = function(message) {
            msg = $.parseJSON(message.data);
            self.session.receive_message(msg);
        };
        self.socket.onerror = onError;
        self.socket.onclose = onClose;

        // if user already exists and belongs to a
        // group, the groupid is returned from the
        // connect request below
        self.session.assigned_group = response.groupid;

        // create the groups interface
        self.session.update_groups(response.groups);
    };

    // Send a message that will be broadcast to
    // other members of the same group.
    self.send = function(kind, data) {

        // add userid to outgoing message
        var message = {'kind': kind,
                       'source': userid,
                       'data': data}

        $.ajax({
            type: 'POST',
            url: 'relay',
            data: {'uid': userid,
                   'message': JSON.stringify(message)}
        });

    };

    // Create connection
    $.ajax('connect?uid=' + userid,
            {success: function(data) { self.init(data); }}
            );

};


function get_matchup(n_players, index) {

    if (n_players == 1) {
        return [[0]];

    } else if (n_players == 2) {
        return [[0, 1]];
    }
};



var GroupView = function(id, groupdata, mygroup, max_players, experiment) {
    var self = this;
    self.id = id;
    self.groupid = groupdata.groupid;
    self.seed    = groupdata.seed;
    self.players = groupdata.players;
    self.max_players = max_players;
    self.mygroup = mygroup;
    self.counter = 0;
    self.experiment = experiment;

    // Create the group interface given a container element
    self.create = function(container) {
        var content = '<div id=group-'+self.id+' class=group-coord>';
        content    += '<div class=group-prompt></div>';
        content    += '<div class=group-counter><span id=assigned-'+self.id+'>' + self.players.length+ '</span> players so far<br />';
        content    += 'Need <span id=needed-'+self.id+'>' + (self.max_players - self.players.length) + '</span> more</div>';
        content    += '<p><button type=button id=join-'+self.id+' class=group-button>JOIN</button>';
        content    += '<button type=button id=confirm-'+self.id+' class=group-button>READY</button>';
        content    += '<button type=button id=begin-'+self.id+' class=group-button>START!</button></p>';
        content    += '</div>';
        container.append(content);

        self.div = $('#group-'+self.id);
        self.assigned_span = $('#assigned-'+self.id);
        self.needed_span = $('#needed-'+self.id);

        // The join button is always visible, but is highlighed
        // based on whether person has joined this group already
        $('#join-'+self.id).css('visibility', 'visible');
        if (self.mygroup) {
            self.highlight_joined();
        } else if (self.players.length == self.max_players) {
            self.highlight_full();
        };

        return self;
    };

    self.get_opponents = function(index) {
        // for a given match, return the ids of competitors
        var this_match = get_matchup(self.players.length, index);

        // sort player ids to keep consistent across clients
        var players = self.players.sort();
        var self_index = players.indexOf(userid);

        // find which subgroup self belongs to and return others
        var opp_ind = _.select(this_match, function(arr){ return arr.indexOf(self_index) != -1 })[0];
        var opp = [];
        for (var i=0; i<opp_ind.length; i++) {
            if (opp_ind[i]!=self_index) opp.push(players[opp_ind[i]]);
        };
        return opp;
    };

    self.get_random_order = function(seed) {
        // assign a random ordering to players in this group
        var players = self.players.sort();

		// decide on a random play order
		Math.seedrandom(seed);
		var r = [];
		for (var i=0; i<players.length; i++) {
			r.push([players[i], Math.random()]);
		};
        r = r.sort(function(a,b) {return a[1]-b[1]});
        r = r.map(function(v,i) {return v[0]});
        return r;
    };

    self.add_player = function(playerid) {
        self.players.push(playerid);
    };

    self.remove_player = function(playerid, message, callback) {
        output(['session removing player '+playerid+' from group']);
        self.players = _.without(self.players, playerid);
        self.reset_counter(self.players.length);

        if (self.mygroup && message!=undefined) self.update_prompt(message);
        if (callback != undefined) callback();
    };

    self.update_prompt = function(message) {
        $('#group-'+self.id+' .group-prompt').html(message);
    };

    self.reset_counter = function() {
        self.counter = 0;
        self.assigned_span.html(0);
        self.needed_span.html(self.max_players);
    };

    self.update_counter = function(count) {
        self.counter = count;
        self.assigned_span.html(self.counter);
        self.needed_span.html(self.max_players - self.counter);
    };

    self.update_assigned = function() {
        self.assigned_span.html(self.players.length);
        self.needed_span.html(self.max_players - self.players.length);
    };

    self.highlight_joined = function() {
        $('#join-'+self.id).css({'visibility': 'visible',
                                 'background': COL_BUTTON_PRESSED,
                                 'opacity': 0.5});
        $('#join-'+self.id).html('JOINED');
    };

    self.highlight_full = function() {
        $('#join-'+self.id).css({'visibility': 'visible',
                                 'background': 'gray',
                                 'opacity': 0.2});
        $('#join-'+self.id).html('FILLED');

    };

    self.acknowledge_response = function(messages) {
        self.update_counter(self.counter + 1);
        if (messages[0].source == userid) {
	    self.update_prompt('<p>Thanks! Waiting for others...</p>');
        };
    };

    self.listen = function() {

        if (self.mygroup == true && self.players.length==self.max_players) {
            self.listen_for_confirm('ready_to_play');
        } else {
            self.listen_for_join();
        };
    };

    self.listen_for_join = function() {
        $('#join-'+self.id).on('click', function(e) {

            $('#join-'+self.id).unbind('click');
            $.ajax({
                type: 'POST',
                url: 'join',
                datatype: 'text/html',
                data: {'uid': userid,
                       'groupid': self.groupid},
            });

        });

        simclick($('#join-'+self.id));
    };

    self.listen_for_confirm = function(msg_kind) {
        $('.group-button').css('display', 'inline');
        $('.group-counter').css('display', 'block');
        $('#begin-'+self.id).css({'visibility': 'hidden',
                                  'opacity': 1.});
        $('#confirm-'+self.id).css({'visibility': 'visible',
                                    'opacity': 1.,
                                    'background': COL_BUTTON_UNPRESS});

        $('#confirm-'+self.id).on('click', function(e) {
            $('#confirm-'+self.id).unbind();
            $('#confirm-'+self.id).css({'background': COL_BUTTON_PRESSED,
                                        'opacity': 0.5});
            connection.send(msg_kind);
        });

        simclick($('#confirm-'+self.id));
    };

    self.unlisten_for_confirm = function() {
        $('.group-button').css('display', 'none');
        $('#confirm-'+self.id).on('click', function(e) {} );
        $('#confirm-'+self.id).css('display', 'none');
    };

    self.listen_for_begin = function() {
        self.update_prompt('<p>All players are ready! Click below to begin.</p>');
        $('.group-counter').css('display', 'none');
        $('#begin-'+self.id).css('visibility', 'visible');
        $('#begin-'+self.id).on('click', function(e) {
            $('#begin-'+self.id).unbind('click');
            self.update_prompt('<p>Experiment in progress</p>');
            $('.group-button').css('display', 'none');
            document.title = 'Experiment in progress';

            //
            // START THE EXPERIMENT
            //
            self.experiment.group = self;
            self.experiment.proceed();

        });
        simclick($('#begin-'+self.id));
    };

};


// A list of messages that are required from other players in the same
// group before a callback will be triggered.
var ConditionalCallback = function(required_messages, callback) {
    var self = this;

    // a list of [uid, message_type] pairs that define the required
    // messages
    self.req = required_messages;
    self.callback = callback;
    self.completed = false;

    self.check = function(message) {

        //output(['log checking cc('+self.req[0].kind+')']);
        //output(['complete:', self.completed]);

        if (!self.completed) {
            var unmet = self.req.length;
            for (var i=0; i<self.req.length; i++) {

                var req = self.req[i];
                if (req.met == false) {
                    if (message.kind == req.kind && message.source == req.source) {
                        // meets this condition!
                        self.req[i].met = true;
                        self.req[i].data = message.data;
                        unmet = unmet - 1;
                        //output(['found message meeting condition:', message.source, message.data]);
                    };
                } else {
                    unmet = unmet - 1;
                };
            };

            if (unmet == 0) {
                //output(['log cc('+self.req[0].kind+') checks out, exec callback']);
                self.completed = true;
                self.callback(self.req);
            };
        };

        return self.completed;
    };
};


var MultiplayerSession = function(players_per_session, experiment) {
    var self = this;
    self.PLAYERS_PER_SESSION = players_per_session;
    self.groups = {};
    self.assigned_group = null;
    self.assigned_group_members = [];
    self.condcall = [];
    self.message_log = [];
    self.experiment = experiment;

    self.update_groups = function(groups) {

        for (var i=0; i<groups.length; i++) {

            var gid = groups[i].groupid;
            var mygroup = gid == self.assigned_group;

            // only display a group if it is mygroup or
            // (mygroup is unassigned and it has space available)
            if (mygroup || (groups[i].available > 0 && self.assigned_group==null)) {
                self.groups[gid] = new GroupView(i, groups[i], mygroup, self.PLAYERS_PER_SESSION, self.experiment);
                self.groups[gid].create($('#session-groups')).listen();
            };

        };

        if (self.assigned_group!=null) {
            if (self.groups[self.assigned_group].players.length == self.PLAYERS_PER_SESSION) {
                self.confirm_ready_to_play();
            };
        } else {
            t = '<p>In this experiment you will play a multiplayer game involving 1 or more other ' +
                'people. The first step is to join an open group using the interface below. ' +
                '</p>';

            t += '<p>After you join a group below, you may have to wait for other player(s) ' +
                'to arrive and complete your group. Once your group is full, all players ' +
                'must confirm that they are ready to play, and the experiment will begin.</p>';

            t += '<p><strong>Please note:</strong> Since completion of this task depends on all ' +
                'players completing the task at the same time, it is important that you pay ' +
                'attention throughout. After the experiment starts, if you are ' +
                'inactive for a long period of time, the experiment will ' +
                'automatically end and you will forgo payment. This is to ' +
                'ensure that other players in your group will not be left ' +
                'waiting, so please stay engaged until the task is complete.</strong>';

            t += '<p>Join one of the groups below (if all are filled, try reloading the page).</p>';

            $('#session-instruction').html(t);
        };

    };


    self.confirm_ready_to_play = function() {

        // play a sound to indicate ready to play
        readysound();
        document.title = 'READY TO START EXPERIMENT!';

        // expose button
        var msg = '<p>All players have joined!<br />Click below to confirm that you\'re ready to play.</p>';
        self.groups[self.assigned_group].update_prompt(msg);
        self.groups[self.assigned_group].reset_counter();

        // enough players have joined group to play. ask player to
        // confirm they are ready to begin. If messages are received
        // from all players then the experiment will start
        var msgs = [];
        var ids = self.groups[self.assigned_group].players;
        for (var i=0; i<ids.length; i++) {
            msgs.push({'source': ids[i],
                       'kind': 'ready_to_play',
                       'met': false,
                       'data': null});
        };
        self.condcall.push(new ConditionalCallback(msgs,
                                                   self.groups[self.assigned_group].listen_for_begin));

        self.groups[self.assigned_group].listen_for_confirm('ready_to_play');

    };

    self.confirm_ready_to = function(msg_kind, prompttext, players, ind_callback) {

        // expose button
        self.groups[self.assigned_group].update_prompt(prompttext);
        self.groups[self.assigned_group].reset_counter();

        self.check_or_wait_for(msg_kind,
                               players,
                               self.groups[self.assigned_group].listen_for_begin,
                               ind_callback);

        self.groups[self.assigned_group].listen_for_confirm(msg_kind);

    };


    self.check_or_wait_for = function(msg_kind, players, callback, ind_callback) {
        // check whether a given set of messages have
        // already been received; if so perform callback.
        // Otherwise, register a callback to check every
        // time a new message is received.
        // output(['log check_or_wait_for '+msg_kind, players]);
        if (players.length == 0) {
            callback([]);
        } else {
            var msgs = [];
            for (var i=0; i<players.length; i++) {

                var msg = {'source': players[i],
                           'kind': msg_kind,
                           'met': false,
                           'data': null};
                msgs.push(msg);

                // add individual callback
                if (ind_callback != undefined) {
                    //output(['log adding individual callback']);
                    self.check_or_wait_for(msg_kind, [players[i]], ind_callback);
                };
            };
            var cc = new ConditionalCallback(msgs, callback);

            // check against messages that have already been received
            /*
            var completed = false;
            for (var i=0; i<self.message_log.length; i++) {
                completed = cc.check(self.message_log[i]);
                output([completed]);
            };

            // if hasn't already been met, add to existing list of
            // conditional callbacks
            if (!completed) {
                output(['log cc('+msg_kind+') not complete, adding to list']);
                self.condcall.push(cc);
            };*/

            //output(['checking upon creation of cc('+msg_kind+')']);
            self.condcall.push(cc);
            for (var i=0; i<self.message_log.length; i++) {
                cc.check(self.message_log[i]);
            };

        };
    };

    self.receive_message = function(msg) {

        // store everything that is received just in case
        self.message_log.push(msg);

        if (msg.kind == 'joined_group') {

            var gid = msg.data.groupid;

            if (gid in self.groups) {
                var grp = self.groups[gid];
                grp.add_player(msg.source);
                grp.update_assigned();

                // if message was from self, assign to group
                if (msg.source == userid) {
                    self.assigned_group = gid;
                    grp.mygroup = true;
                    grp.highlight_joined();

                    // once a group is joined, add an alert if the
                    // person tries to leave
                    catch_leave();

                    $('#session-instruction').html('');
                    $.each(self.groups, function(i, group) {
                        if (group.groupid != self.assigned_group) {
                            $('#group-'+group.id).css('display', 'none');
                        };
                    });

                };

                if (grp.mygroup) {
                    // if enough players, move on to confirmation
                    if (grp.players.length == self.PLAYERS_PER_SESSION) {
                        self.confirm_ready_to_play();
                    } else {
                        if (msg.source == userid) grp.update_prompt('Thanks! Waiting for others to join...');
                    };
                } else {
                    if (grp.players.length == self.PLAYERS_PER_SESSION) {
                        grp.highlight_full();
                    };
                };

            };
        };

        if (msg.kind == 'ready_to_play') {

            var grp = self.groups[self.assigned_group];
            grp.update_counter(grp.counter + 1);

            if (msg.source == userid) {
                grp.update_prompt('<p>Thanks! Waiting for others to confirm...</p>');
            };

        };

        if (msg.kind == 'left_group') {

            output(['session leaver: '+msg.source]);

            if (msg.data.groupid in self.groups) {

                if (self.assigned_group == msg.data.groupid) {
                    // leaver was in my group
                    output(['session opponent left group: '+msg.source]);

                    if (STATES[STATE] < STATES.indexOf('EXP_STARTED')) {
                        self.groups[msg.data.groupid].remove_player(msg.source,
                                                                    'Someone left! Waiting for others to join...');
                    } else {

                        // if I was the leaver because of inactivity, don't do
                        // anything else
                        if (msg.source == userid) {
                            self.groups[msg.data.groupid].remove_player(msg.source,
                                                                        'Session aborted');
                        } else {
                            // if had already started the main experiment, abort early
                            self.groups[msg.data.groupid].remove_player(msg.source,
                                                                        'Someone left early! :(',
                                                                        self.abort);
                        };
                    };

                } else {
                    // leaver wasn't in my group, so just update
                    self.groups[msg.data.groupid].remove_player(msg.source);
                };

            };
        };

        // check against list of registered callbacks
        $(self.condcall).each(function(i, cc) {
            if (!cc.completed) {
                output(['log found incomplete cc('+cc.req[0].kind+')']);
                cc.check(msg);
            };
        });

    };

    self.abort = function() {
        output(['session abort']);

        setTimeout(function() {
            self.experiment.abort();
        }, 500);
    };

    // open one way channel to push messages from server
    connection = new Connection(self);

};


function onOpened() {
    output(['session channel open']);
};

function onError() {
    output(['session channel error']);
    session.abort();
};

function onClose() {
    output(['session channel closed']);
};

