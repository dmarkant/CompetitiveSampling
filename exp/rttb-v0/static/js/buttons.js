/*
 * BUTTON HANDLING
 *
 */
function simclick(obj, rt) {

    if (rt === undefined) rt = 1000;

    if (SIMULATE==1) {
        setTimeout(function() {
            obj.click();
        }, Math.random()*1000 + rt);
    };
};


function clear_buttons() {
	$('#buttons').html('');
};


function add_next_button(callback, label, accept_keypress) {

	var label = label || 'Continue';
	var accept_keypress = accept_keypress || true;

	$('#buttons').append('<button id=btn-next class="btn btn-default btn-lg">'+label+' (press \'C\')</button>');

	if (accept_keypress) {

		$(window).bind('keydown', function(e) {
			if (e.keyCode == '67') {
				$(window).unbind('keydown');
				callback();
			};
		});
	};

	// also set up button click handler, but need to wrap callback in function
	// that gets rid of keypress handler
	if (SIMULATE==1) {
		$('#btn-next').on('click', function() {
			$(window).unbind('keydown');
			callback();
		});
	};

};

function add_stop_and_continue_buttons(continue_callback, stop_callback, accept_keypress) {

	var accept_keypress = accept_keypress || true;

	$('#buttons').append('<button id=btn-continue class="btn btn-default btn-info btn-lg">Continue Learning (press \'C\')</button>');
	$('#buttons').append('<button id=btn-stop class="btn btn-default btn-primary btn-lg">Stop and Choose (press \'S\')</button>');

	// if allowing keypresses, set up handlers
	if (accept_keypress) {

		$(window).bind('keydown', function(e) {

			// 'C' for continue
			if (e.keyCode == '67') {
                output(['log continue button']);
				$(window).unbind('keydown');
				continue_callback();

			};

			// 'S' for stop
			if (e.keyCode == '83') {
                output(['log stop button']);
				$(window).unbind('keydown');
				stop_callback();
			};
		});

		// also set up button click handler, but need to wrap callback in function
		// that gets rid of keypress handler
		if (SIMULATE==1) {
			$('#btn-continue').on('click', function() {
				$(window).unbind('keydown');
				continue_callback();
			});
			$('#btn-stop').on('click', function() {
				$(window).unbind('keydown');
				stop_callback();
			});
		};


	} else {
		$('#btn-continue').on('click', continue_callback);
		$('#btn-stop').on('click', stop_callback);
	};

};

