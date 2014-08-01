
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
        
        self.session.assigned_group = response.groupid;
        self.session.update_groups(response.groups);

    };

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

    $.ajax('connect?uid=' + userid, 
            {success: function(data) { self.init(data); }}
            );

};


function simclick(obj, rt) {

    if (rt === undefined) rt = 1000;

    if (SIMULATE==1) {
        //console.log('sim click:', obj);
        setTimeout(function() {
            obj.click();
        }, Math.random()*1000 + rt);
    };
};


function get_matchup(n_players, index) {
    
    if (n_players == 2) {
        return [[0, 1]];

    } else if (n_players == 4) {

        return [[0, 1, 2, 3]];
        /*
        var matches = [[[0, 1, 2, 3]],
                       [[0, 1], [2, 3]],
                       [[0, 1, 2, 3]],
                       [[0, 2], [1, 3]]
                       [[0, 1, 2, 3]],
                       [[0, 3], [1, 2]]];

        return matches[index];
        */
    } else {
        return [[0, 1, 2, 3, 4, 5, 6, 7]];
        /*
        var matches = [[[0, 1, 2, 3, 4, 5, 6, 7]],
                       [[0, 1, 2, 3], [4, 5, 6, 7]],
                       [[0, 1], [2, 3], [4, 5], [6, 7]],
                       [[0, 1, 2, 3, 4, 5, 6, 7]],
                       [[0, 1, 4, 5], [2, 3, 6, 7]],
                       [[0, 7], [1, 6], [2, 5], [3, 4]]];

        return matches[index];
        */
    };
};



var GroupView = function(id, groupdata, mygroup) {
    var self = this;
    self.id = id;
    self.groupid = groupdata.groupid;
    self.players = groupdata.players;
    self.assigned = groupdata.assigned;
    self.mygroup = mygroup;
    self.counter = 0;

    self.create = function(container) {
        var content = '<div id=group-'+self.id+' class=group-coord>';
        content += '<div class=group-prompt></div>';
        content += '<div class=group-counter><span id=assigned-'+self.id+'>' + self.assigned + '</span> players so far<br />';
        content += 'Need <span id=needed-'+self.id+'>' + (PLAYERS_PER_SESSION - self.assigned) + '</span> more</div>';
        content += '<p><button type=button id=join-'+self.id+' class=group-button>JOIN</button>';
        content += '<button type=button id=confirm-'+self.id+' class=group-button>READY</button>';
        content += '<button type=button id=begin-'+self.id+' class=group-button>START!</button></p>';
        content += '</div>';
        container.append(content);

        self.div = $('#group-'+self.id);
        self.assigned_span = $('#assigned-'+self.id);
        self.needed_span = $('#needed-'+self.id);

        $('#join-'+self.id).css('visibility', 'visible');        
        
        if (self.mygroup) self.highlight_joined();

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

    self.update_prompt = function(message) {
        $('#group-'+self.id+' .group-prompt').html(message);
    };

    self.reset_counter = function() {
        self.counter = 0;
        self.assigned_span.html(0);
        self.needed_span.html(PLAYERS_PER_SESSION);
    };

    self.update_counter = function(count) {
        self.counter = count;
        self.assigned_span.html(self.counter);
        self.needed_span.html(PLAYERS_PER_SESSION - self.counter);
    };

    self.update_assigned = function(assigned) {
        self.assigned = assigned;
        self.assigned_span.html(self.assigned);
        self.needed_span.html(PLAYERS_PER_SESSION - self.assigned);
    };

    self.listen = function() {

        if (self.mygroup == true && self.assigned==PLAYERS_PER_SESSION) {
            //self.listen_for_confirm('ready_to_play');
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

    self.listen_for_begin = function() {
        self.update_prompt('<p>All players are ready! Click below to begin.</p>');
        $('.group-counter').css('display', 'none');
        $('#begin-'+self.id).css('visibility', 'visible');
        $('#begin-'+self.id).on('click', function(e) {
            $('#begin-'+self.id).unbind('click');
            self.update_prompt('<p>Experiment in progress</p>');
            $('.group-button').css('display', 'none');
            exp.proceed(self);
        });
        simclick($('#begin-'+self.id));
    };


    self.highlight_joined = function() {
        $('#join-'+self.id).css({'visibility': 'visible',
                                 'background': COL_BUTTON_PRESSED,
                                 'opacity': 0.5});                
    };

    self.acknowledge_response = function(messages) {
        self.update_counter(self.counter + 1);
        if (messages[0].source == userid) {
	    self.update_prompt('<p>Thanks! Waiting for others...</p>');
        };
    };
    

};


var ConditionalCallback = function(required_messages, callback) {
    var self = this;

    // a list of [uid, message_type] pairs that define the required
    // messages
    self.req = required_messages;
    self.callback = callback;
    self.completed = false;

    self.check = function(message) {
        var unmet = self.req.length;
        for (var i=0; i<self.req.length; i++) {
            
            var req = self.req[i];
            if (req.met == false) {
                if (message.kind == req.kind && message.source == req.source) {
                    // meets this condition!
                    self.req[i].met = true;
                    self.req[i].data = message.data;
                    unmet = unmet - 1;
                };
            } else {
                unmet = unmet - 1;   
            };
        };

        if (unmet == 0) {
            self.completed = true;
            self.callback(self.req);
            //console.log('met cc:', self.req);
        }; 

        return self.completed;

    };

};


var MultiplayerSession = function() {
    var self = this;
    self.groups = {};
    self.assigned_group = null;
    self.assigned_group_members = [];
    self.condcall = [];
    self.message_log = [];

    self.update_groups = function(groups) {

        for (var i=0; i<groups.length; i++) {

            var gid = groups[i].groupid;
            var mygroup = gid == self.assigned_group;

            // only display a group if it is mygroup or
            // (mygroup is unassigned and it has space available)
            if (mygroup || (groups[i].available > 0 && self.assigned_group==null)) {
                self.groups[gid] = new GroupView(i, groups[i], mygroup);
                self.groups[gid].create($('#session-groups')).listen();
            };
        };

        if (self.assigned_group!=null) {
            if (self.groups[self.assigned_group].assigned == PLAYERS_PER_SESSION) {
                self.confirm_ready_to_play();
            };
        };

    };

    self.confirm_ready_to_play = function() {
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
                    self.check_or_wait_for(msg_kind, [players[i]], ind_callback);
                };
            };
            var cc = new ConditionalCallback(msgs, callback);

            // check against messages that have already been received
            for (var i=0; i<self.message_log.length; i++) {
                cc.check(self.message_log[i]);
            };

            // if hasn't already been met, add to existing list of 
            // conditional callbacks
            if (!cc.completed) self.condcall.push(cc); 
        };
    };

    self.receive_message = function(msg) {

        // store everything that is received just in case
        self.message_log.push(msg);

        if (msg.kind == 'joined_group') {

            var gid = msg.data.groupid;
            var grp = self.groups[gid];
            grp.add_player(msg.source);
            grp.update_assigned(grp.assigned + 1);

            // if message was from self, assign to group
            if (msg.source == userid) {
                self.assigned_group = gid;
                self.groups[gid].mygroup = true;
                self.groups[gid].highlight_joined();
            };

            // if enough players, move on to confirmation
            if (grp.assigned == PLAYERS_PER_SESSION) {
                console.log('all joined!');
                self.confirm_ready_to_play();                
            } else {
                if (msg.source == userid) grp.update_prompt('Thanks! Waiting for others to join...');
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
            // if someone leaves, need to adjust gracefully 
            console.log(msg.source + ' left group');

        };

        // check against list of registered callbacks
        $(self.condcall).each(function(i, cc) {
            if (!cc.completed) cc.check(msg);
        });
        
    };

    // open one way channel to push messages from server
    connection = new Connection(self);

};


function onOpened() {
    console.log('opened!');
};

function onError() {
    console.log('error :(');
};

function onClose() {
    console.log('closed..');
};


/*******************
 * Run Task
 ******************/
$(window).load( function(){
    pager = new Pager($('#main'));
    pager.preloadPages(PAGES);
    exp = new CompetitiveSamplingExperiment();

    if (SIMULATE==1) {
        $('#simulation').css('display', 'block');
    };

    setTimeout(function() {
        session = new MultiplayerSession();
    }, Math.random()*5000);
});
