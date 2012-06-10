(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['dashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <li>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><h3>League ";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h3><span class=\"clearfix\">";
  foundHelper = helpers.team;
  stack1 = foundHelper || depth0.team;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "team", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span><span class=\"clearfix\">";
  foundHelper = helpers.pm_phase;
  stack1 = foundHelper || depth0.pm_phase;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pm_phase", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span></a>\n      <form action=\"/delete_league\" method=\"POST\"><input type=\"hidden\" name=\"lid\" value=\"";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><button class=\"btn btn-mini\">Delete</button></form>\n    </li>\n  ";
  return buffer;}

  buffer += "<h1>Active Leagues</h1>\n\n<ul class=\"dashboard_league\">\n  ";
  foundHelper = helpers.leagues;
  stack1 = foundHelper || depth0.leagues;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n  <li class=\"dashboard_league_new\"><a href=\"/new_league\"><h2>Create new league</h2></a></li>\n</ul>\n";
  return buffer;});
templates['league_dashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<h1>League ";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h1>\n";
  return buffer;});
templates['new_league'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.tid;
  stack1 = foundHelper || depth0.tid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  stack1 = foundHelper || depth0.region;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</option>\n    ";
  return buffer;}

  buffer += "<h1>Create New League</h1>\n<form action=\"/new_league\" method=\"POST\">\n  <label>Which team do you want to manage?\n  <select name=\"tid\">\n    ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select></label>\n  <button type=\"submit\" class=\"btn\">Create New League</button>  \n</form>\n";
  return buffer;});
templates['league_layout'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<div id=\"contentwrapper\">\n  <div id=\"league_content\">\n  </div>\n</div>\n\n<div id=\"league_menu\" data-lid=\"";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n  <div class=\"well sidebar-nav\">\n    <ul class=\"nav nav-list\" id=\"league_sidebar\">\n      <li id=\"nav_league_dashboard\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">Dashboard</a></li>\n      <li class=\"nav-header\">League</li>\n      <li id=\"nav_standings\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/standings\">Standings</a></li>\n      <li id=\"nav_playoffs\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/playoffs\">Playoffs</a></li>\n      <li id=\"nav_finances\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/finances\">Finances</a></li>\n      <li id=\"nav_transaction_log\"><a href=\"#\">Transaction Log</a></li>\n      <li id=\"nav_history\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/history\">History</a></li>\n      <li class=\"nav-header\">Team</li>\n      <li id=\"nav_roster\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster\">Roster</a></li>\n      <li id=\"nav_schedule\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/schedule\">Schedule</a></li>\n      <li id=\"nav_history\"><a href=\"#\">History</a></li>\n      <li class=\"nav-header\">Players</li>\n      <li id=\"nav_free_agents\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/free_agents\">Free Agents</a></li>\n      <li id=\"nav_trade\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade_\">Trade</a></li>\n      <li id=\"nav_draft\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/draft_\">Draft</a></li>\n      <li class=\"nav-header\">Stats</li>\n      <li id=\"nav_game_log\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log\">Game Log</a></li>\n      <li id=\"nav_leaders\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/leaders\">League Leaders</a></li>\n      <li id=\"nav_player_ratings\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player_ratings\">Player Ratings</a></li>\n      <li id=\"nav_player_stats\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player_stats\">Player Stats</a></li>\n      <li id=\"nav_team_stats\"><a href=\"#\">Team Stats</a></li>\n    </ul>\n  </div>\n</div>\n";
  return buffer;});
})();