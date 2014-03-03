
function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
	return 'AssertException: ' + this.message;
};

function assert(exp, message) {
	if (!exp) {
		throw new AssertException(message);
	}
}

// Mean of booleans (true==1; false==0)
function boolpercent(arr) {
	var count = 0;
	for (var i=0; i<arr.length; i++) {
		if (arr[i]) { count++; } 
	}
	return 100* count / arr.length;
}

function ConstantArray(len, val) {
    var rv = new Array(len);
    while (--len >= 0) {
        rv[len] = val;
    }
    return rv;
}

function sum(arr) {
    return arr.reduce(function(a, b) {
        return a + b;
    });
};


function cumsum(arr) {
    var cs = [];
    for (var i=0; i<arr.length; i++) {
        if (i==0) cs[i] = arr[i];
        else cs[i] = cs[i-1] + arr[i];
    };
    return cs;
};


// Flatten taken from
// http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/
Array.prototype.flatten = function flatten(){
   var flat = [];
   for (var i = 0, l = this.length; i < l; i++){
       var type = Object.prototype.toString.call(this[i]).split(' ').pop().split(']').shift().toLowerCase();
       if (type) { flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten.call(this[i]) : this[i]); }
   }
   return flat;
};


function normalize(source) {
	var tot = sum(source);
	arr = [];
	for (var i=0; i<source.length; i++) {
		arr.push(source[i] / tot);
	};
    return arr;
};


