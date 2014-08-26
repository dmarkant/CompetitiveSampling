/*
 * options.js
 *
 * Used to coordinate which option sets are presented for a given grouping
 * of competitors
 *
 */

function load_option_sets(path) {

    log('loading option sets from: '+path);
    var results = [];
	$.ajax({url: path,
			success: function(data) {
				$.each(data.split('\n'), function() {
					var optset = this.split(',');
					if (optset[0]!="") {
						results.push({'id': Number(optset[1]),
									  'env': Number(optset[2]),
									  'A_low': Number(optset[3]),
									  'A_high': Number(optset[4]),
									  'A_p': Number(optset[5]),
									  'A_ev': Number(optset[6]),
									  'B_low': Number(optset[7]),
									  'B_high': Number(optset[8]),
									  'B_p': Number(optset[9]),
									  'B_ev': Number(optset[10])});
					};
				});
			},
            error: function() {
                log('failed to load option sets!');
            },
			async: false
	});
    return results;
};



function sample_uniform_with_seed(n, set, seed) {

    // choose a random starting point between (0, set.length-n),
    // using the provided value as a seed
    var ran = new Random(seed);
    var i = Math.floor(ran.uniform(0, set.length - n));
    return set.slice(i, i + n);

};


