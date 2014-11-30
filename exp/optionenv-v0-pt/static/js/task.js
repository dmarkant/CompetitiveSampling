var EXP_ID = 'optionenv-v0';

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);
var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to

//mycondition = Number(condition) + 2;
mycondition = Number(condition) + 2; 

if (mode === 'debug') {
    adServerLoc = window.location.hostname + ':' + window.location.port + '/complete';
};


/*******************
 * Run Task
 ******************/
$(window).load( function(){

    window.location='http://cog-grpexp.appspot.com/exp?sim=0&expid='+EXP_ID+'&uniqueId='+uniqueId+'&condition='+mycondition+'&adServerLoc='+adServerLoc;

});
