var session_id;

var Connection = function(){

	var self = this;
	
	self.send = function(data){
		console.log('sending!:', data);
		self.socket.emit('my event', {'data': data});
	};

	self.broadcast = function(data){
		console.log('sending!:', data);
		self.socket.emit('my broadcast event', {'data': data});
	};


    self.receive = function(data) {
        console.log('received broadcast');
        console.log(data);
    };

	self.open = function(){
		console.log('opening socket');

		self.socket = io.connect('http://' + document.domain + ':' + location.port + '/sockettest');

        self.socket.on('connection response', function(msg) {
            console.log(msg);
        });

		self.socket.on('my response', function(msg) {
			self.receive(msg);
		});

	};

};
var connection = new Connection();





$(window).load( function(){

    $('#submit-session-num').click(function() {

        var session_num = $('#session-num-entry').attr('value');

        // check that session_num is valid

        connection.broadcast({'uniqueId': uniqueId, 'session-num': session_num});
    });
        
    connection.open();
});

