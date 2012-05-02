fs = require('fs');
teams = JSON.parse(fs.readFileSync('teams.json').toString());
//console.log(teams);

// Make sure the bbgm/core folder is in NODE_PATH, or this will fail
game_sim = require('game_sim');
//console.log(game_sim);
gs = new game_sim.GameSim(teams[0], teams[1]);
//console.log(gs);
console.log(JSON.stringify(gs.run()));
