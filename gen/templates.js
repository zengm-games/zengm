(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['boxScore'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, self=this, escapeExpression=this.escapeExpression, functionType="function", blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <h3><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/"
    + escapeExpression(((stack1 = depth0.abbrev),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = ((stack1 = depth1.game),stack1 == null || stack1 === false ? stack1 : stack1.season)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = depth0.region),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></h2>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n  <thead>\n    <tr><th>Name</th><th>Pos</th><th>Min</th><th>FG</th><th>3Pt</th><th>FT</th><th>Off</th><th>Reb</th><th>Ast</th><th>TO</th><th>Stl</th><th>Blk</th><th>PF</th><th>Pts</th></tr>\n  </thead>\n  <tbody>\n  ";
  stack2 = ((stack1 = ((stack1 = depth0.players),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </tbody>\n  <tfoot>\n    <tr><td>Total</td><td></td><td>"
    + escapeExpression(((stack1 = depth0.min),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.fg),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = depth0.fga),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.tp),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = depth0.tpa),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.ft),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = depth0.fta),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.orb),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.trb),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.ast),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.tov),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.stl),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.blk),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.pf),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.pts),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td></tr>\n  </tfoot>\n  </table>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr";
  stack1 = helpers['if'].call(depth0, depth0.separator, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td>"
    + escapeExpression(helpers.playerNameLabels.call(depth0, depth0.pid, depth0.name, depth0.injury, depth0.skills, {hash:{},data:data}))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.pos),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(helpers.round.call(depth0, depth0.min, 1, {hash:{},data:data}))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.fg),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = depth0.fga),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.tp),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = depth0.tpa),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.ft),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = depth0.fta),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.orb),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.trb),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.ast),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.tov),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.stl),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.blk),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.pf),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = depth0.pts),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td></tr>\n  ";
  return buffer;
  }
function program3(depth0,data) {
  
  
  return " class=\"separator\"";
  }

  buffer += "<h2><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.won)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.season)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.won)),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.won)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.won)),stack1 == null || stack1 === false ? stack1 : stack1.pts)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ", <a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.season)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.pts)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + escapeExpression(((stack1 = depth0.overtime),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h2>\n";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.teams)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n";
  return buffer;
  });
templates['draftSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"draft-summary-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1><span data-bind=\"text: season\"></span> Draft Summary <span data-bind=\"newWindow: []\"></span></h1>\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"draft-results\">\n  <thead>\n    <tr><th colspan=\"3\"></th><th colspan=\"5\" style=\"text-align: center\">At Draft</th><th colspan=\"5\" style=\"text-align: center\">Current</th><th colspan=\"5\" style=\"text-align: center\">Career Stats</th></tr>\n    <tr><th>Pick</th><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Skills</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Skills</th><th title=\"Games Played\">GP</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">PPG</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n  </thead>\n  </table>\n</p>\n";
  });
templates['teamStatDists'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"team-stat-dists-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Team Stat Distributions <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['team_stats', season]}\">Main Stats</a> | <a data-bind=\"attrLeagueUrl: {href: ['team_shot_locations', season]}\">Shot Locations</a></p>\n\n<p>These <a href=\"http://en.wikipedia.org/wiki/Box_plot\">box plots</a> show the league-wide distributions of team stats for the selected season. Black plots are for this league and blue plots are from the 2010-2011 NBA season, for comparison. The five vertical lines in each plot represent the minimum of the scale, the minimum, the first <a href=\"http://en.wikipedia.org/wiki/Quartile\">quartile</a>, the median, the third quartile, the maximum, and the maximum of the scale.</p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" id=\"team-stat-dists\">\n  <tbody></tbody>\n</table>\n</p>\n";
  });
templates['leagueLayout'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"contentwrapper\">\n  <div id=\"league_content\" data-id-loading=\"\" data-id-loaded=\"\">\n  </div>\n</div>\n\n<div id=\"league_menu\" data-lid=\""
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n  <div class=\"well sidebar-nav\">\n    <ul class=\"nav nav-list\" id=\"league_sidebar\">\n      <li id=\"nav_league_dashboard\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">Dashboard</a></li>\n      <li id=\"nav_inbox\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/inbox\">Inbox</a></li>\n      <li class=\"nav-header\">League</li>\n      <li id=\"nav_standings\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/standings\">Standings</a></li>\n      <li id=\"nav_playoffs\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/playoffs\">Playoffs</a></li>\n      <li id=\"nav_league_finances\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/league_finances\">Finances</a></li>\n      <li id=\"nav_history\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/history\">History</a></li>\n      <li class=\"nav-header\">Team</li>\n      <li id=\"nav_roster\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster\">Roster</a></li>\n      <li id=\"nav_schedule\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/schedule\">Schedule</a></li>\n      <li id=\"nav_team_finances\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/team_finances\">Finances</a></li>\n      <li id=\"nav_team_history\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/team_history\">History</a></li>\n      <li class=\"nav-header\">Players</li>\n      <li id=\"nav_free_agents\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/free_agents\">Free Agents</a></li>\n      <li id=\"nav_trade\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/trade\">Trade</a></li>\n      <li id=\"nav_draft\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/draft\">Draft</a></li>\n      <li class=\"nav-header\">Stats</li>\n      <li id=\"nav_game_log\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/game_log\">Game Log</a></li>\n      <li id=\"nav_leaders\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/leaders\">League Leaders</a></li>\n      <li id=\"nav_player_ratings\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player_ratings\">Player Ratings</a></li>\n      <li id=\"nav_player_stats\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player_stats\">Player Stats</a></li>\n      <li id=\"nav_team_stats\"><a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/team_stats\">Team Stats</a></li>\n    </ul>\n  </div>\n</div>\n";
  return buffer;
  });
templates['freeAgents'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Free Agents <span data-bind=\"newWindow: []\"></span></h1>\n\n<p>You currently have <strong data-bind=\"currency: [capSpace, 'M']\"></strong> in cap space. <i class=\"icon-question-sign\" id=\"help-salary-cap\" data-placement=\"bottom\"></i></p>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"free-agents\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>\n";
  });
templates['leaders'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"leaders-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>League Leaders <span data-bind=\"newWindow: []\"></span></h1>\n\n<p>Only eligible players are shown (<i>e.g.</i> a player shooting 2 for 2 on the season is not eligible for the league lead in FG%).</p>\n\n<p></p>\n<div class=\"row-fluid\" data-bind=\"foreach: categories\">\n  <!-- ko if: newRow -->\n  <p class=\"clearfix\"></p>\n  <!-- /ko -->\n  <div class=\"span4\" data-bind=\"attr: {style: newRow() ? 'margin-left: 0' : ''}\">\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed leaders\">\n    <thead>\n      <tr><th data-bind=\"text: name\"></th><th data-bind=\"text: stat, attr: {title: title}\"></th></tr>\n    </thead>\n    <tbody data-bind=\"foreach: data\">\n      <tr data-bind=\"css: {'alert-info': userTeam}\"><td><span data-bind=\"text: i\"></span>. <span data-bind=\"playerNameLabels: [pid, name, injury, ratings.skills]\"></span>, <a data-bind=\"text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, $root.season]}\"></a></td><td data-bind=\"round: [stat, 1]\"></tr>\n    </tbody>\n    </table>\n  </div>\n</div>";
  });
templates['browserError'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Error</h1>\n\n<p>Your browser is not modern enough to run Basketball GM.</p>\n\n<p>Currently, <a href=\"http://www.firefox.com/\">Mozilla Firefox</a> and <a href=\"http://www.google.com/chrome/\">Google Chrome</a> work best with Basketball GM.</p>";
  });
templates['playerStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"player-stats-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Player Stats <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['player_shot_locations', season]}\">Shot Locations</a> | <a data-bind=\"attrLeagueUrl: {href: ['player_stat_dists', season]}\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player-stats\">\n<thead>\n  <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n</thead>\n</table>\n</p>";
  });
templates['trade'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Trade <span data-bind=\"newWindow: []\"></span></h1>\n\n<div class=\"row-fluid\">\n  <div class=\"span7\">\n    <form id=\"rosters\">\n      <p><select id=\"trade-select-team\" name=\"team\" class=\"team form-inline\" data-bind=\"foreach: teams\">\n        <option data-bind=\"attr: {value: abbrev, selected: selected}, text: region + ' ' + name\"></option>\n      </select>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster-other\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n      </thead>\n      </table>\n      </p>\n\n      <h2 data-bind=\"text: userTeamName\"></h2>\n      <p>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster-user\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n      </thead>\n      </table>\n      </p>\n    </form>\n  </div>\n  <div class=\"span5\" id=\"trade-summary\">\n    <h3>Trade Summary</h3>\n    <div class=\"row-fluid\" data-bind=\"foreach: summary.teams\">\n      <div class=\"span6\">\n        <h4 data-bind=\"text: name\"></h4>\n        <h5>Trade Away:</h5>\n        <ul>\n          <!-- ko foreach: trade -->\n            <li><a data-bind=\"attrLeagueUrl: {href: ['player', pid]}, text: name\"></a> (<span data-bind=\"currency: [contract.amount, 'M']\"></span>)</li>\n          <!-- /ko -->\n          <li><span data-bind=\"currency: [total, 'M']\"></span> Total</li>\n        </ul>\n        <h5>Receive:</h5>\n        <ul>\n          <!-- ko foreach: $root.summary.teams()[other].trade -->\n            <li><a data-bind=\"attrLeagueUrl: {href: ['player', pid]}, text: name\"></a> (<span data-bind=\"currency: [contract.amount, 'M']\"></span>)</li>\n          <!-- /ko -->\n          <li><span data-bind=\"currency: function(){ return [$root.summary.teams()[other].total, 'M']}()\"></span></li>\n        </ul>\n        <h5>Payroll after trade: <span data-bind=\"currency: [payrollAfterTrade, 'M']\"></span></h5>\n        <h5>Salary cap: <span data-bind=\"currency: [$parent.salaryCap, 'M']\"></span></h5>\n      </div>\n    </div>\n\n    <br>\n    <p class=\"alert alert-error\" data-bind=\"visible: summary.warning\"><strong>Warning!</strong> <span data-bind=\"text: summary.warning\"></span></p>\n    <p class=\"alert alert-info\" data-bind=\"visible: message, text: message\"></p>\n\n    <center>\n      <form method=\"POST\" id=\"propose-trade\" data-bind=\"attrLeagueUrl: {action: ['trade']}\">\n        <input type=\"hidden\" name=\"propose\" value=\"1\">\n        <button type=\"submit\" class=\"btn btn-large btn-primary\" data-bind=\"enable: summary.enablePropose\">Propose Trade</button>\n      </form>\n\n      <form method=\"POST\" id=\"clear-trade\" data-bind=\"attrLeagueUrl: {action: ['trade']}\">\n        <input type=\"hidden\" name=\"clear\" value=\"1\">\n        <button type=\"submit\" class=\"btn\">Clear Trade</button>\n      </form>\n    </center>\n  </div>\n</div>";
  });
templates['leagueDashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1><span data-bind=\"text: region\"></span> <span data-bind=\"text: name\"></span> Dashboard <span data-bind=\"newWindow: []\"></span></h1>\n\n<div class=\"row-fluid\">\n  <div class=\"span4\">\n    <h3>Current Record</h3>\n    <p>\n      <span data-bind=\"text: won\"></span>-<span data-bind=\"text: lost\"></span><!-- ko if: !playoffsStarted() && streakLong() -->, <span data-bind=\"text: streakLong\"></span><!-- /ko --><br>\n      <a data-bind=\"attrLeagueUrl: {href: ['standings']}\">» Standings</a>\n    </p>\n\n    <h3>Playoffs</h3>\n    <p>\n      <!-- ko if: showPlayoffSeries -->\n        <b><span data-bind=\"text: seriesTitle\"></span></b><br>\n        <span data-bind=\"matchup: [0, 0]\"></span><br>\n      <!-- /ko -->\n      <!-- ko if: !showPlayoffSeries() -->\n        <span data-bind=\"text: rank\"></span>th place in conference<br>\n        (Top 8 teams make the playoffs)<br>\n      <!-- /ko -->\n      <!-- ko if: playoffsStarted -->\n        <a data-bind=\"attrLeagueUrl: {href: ['playoffs']}\">» Playoffs</a>\n      <!-- /ko -->\n      <!-- ko if: !playoffsStarted() -->\n        <a data-bind=\"attrLeagueUrl: {href: ['playoffs']}\">» Playoffs Projections</a>\n      <!-- /ko -->\n    </p>\n\n    <h3>Recent Games</h3>\n    <p>\n      <span data-bind=\"visible: nextGameAbbrev\">\n        Next Game: <span data-bind=\"visible: !nextGameHome()\">@</span><a data-bind=\"attrLeagueUrl: {href: ['roster', nextGameAbbrev]}, text: nextGameAbbrev\"></a><br>\n      </span>\n      <span data-bind=\"visible: recentGames().length === 0\">No completed games yet this season.<br></span>\n      <!-- ko foreach: recentGames -->\n        <span data-bind=\"visible: !home()\">@</span><a data-bind=\"attrLeagueUrl: {href: ['roster', oppAbbrev]}, text: oppAbbrev\"></a>, <span data-bind=\"text: won() ? 'won' : 'lost'\"></span> <a data-bind=\"attrLeagueUrl: {href: ['game_log', $parent.abbrev, $parent.season, gid]}\"><span data-bind=\"text: pts\"></span>-<span data-bind=\"text: oppPts\"></span><span data-bind=\"text: overtime\"></span></a><br>\n      <!-- /ko -->\n      <a data-bind=\"attrLeagueUrl: {href: ['game_log']}\">» Game Log</a><br>\n      <a data-bind=\"attrLeagueUrl: {href: ['standings']}\">» Schedule</a>\n    </p>\n\n    <h3>Recent History</h3>\n    <p>\n      <span data-bind=\"visible: recentHistory().length === 0\">None yet.<br></span>\n      <!-- ko foreach: recentHistory -->\n        <a data-bind=\"attrLeagueUrl: {href: ['roster', $parent.abbrev, season]}, text: season\"></a>: <a data-bind=\"attrLeagueUrl: {href: ['standings', season]}\"><span data-bind=\"text: won\"></span>-<span data-bind=\"text: lost\"></span></a><!-- ko if: extraText -->, <a data-bind=\"attrLeagueUrl: {href: ['playoffs', season]}, text: extraText\"></a><!-- /ko --><br>\n      <!-- /ko -->\n      <a data-bind=\"attrLeagueUrl: {href: ['team_history']}\">» Team History</a><br>\n      <a data-bind=\"attrLeagueUrl: {href: ['history']}\">» League History</a>\n    </p>\n\n  </div>\n  <div class=\"span4\">\n    <h3>Team Stats</h3>\n    <p>\n      Points: <span data-bind=\"round: [pts, 1]\"></span> (<span data-bind=\"text: ptsRank\"></span>th)<br>\n      Allowed: <span data-bind=\"round: [oppPts, 1]\"></span> (<span data-bind=\"text: oppPtsRank\"></span>th)<br>\n      Rebounds: <span data-bind=\"round: [trb, 1]\"></span> (<span data-bind=\"text: trbRank\"></span>th)<br>\n      Assists: <span data-bind=\"round: [ast, 1]\"></span> (<span data-bind=\"text: astRank\"></span>th)<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['team_stats']}\">» Team Stats</a>\n    </p>\n\n    <h3>Team Leaders</h3>\n    <p>\n      <a data-bind=\"attrLeagueUrl: {href: ['player', teamLeaders.pts.pid]}, text: teamLeaders.pts.name\"></a>: <span data-bind=\"round: [teamLeaders.pts.stat, 1]\"></span> pts<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['player', teamLeaders.trb.pid]}, text: teamLeaders.trb.name\"></a>: <span data-bind=\"round: [teamLeaders.trb.stat, 1]\"></span> reb<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['player', teamLeaders.ast.pid]}, text: teamLeaders.ast.name\"></a>: <span data-bind=\"round: [teamLeaders.ast.stat, 1]\"></span> ast<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['roster']}\">» Full Roster</a>\n    </p>\n\n    <h3>League Leaders</h3>\n    <p>\n      <a data-bind=\"attrLeagueUrl: {href: ['player', leagueLeaders.pts.pid]}, text: leagueLeaders.pts.name\"></a>, <a data-bind=\"attrLeagueUrl: {href: ['roster', leagueLeaders.pts.abbrev]}, text: leagueLeaders.pts.abbrev\"></a>: <span data-bind=\"round: [leagueLeaders.pts.stat, 1]\"></span> pts<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['player', leagueLeaders.trb.pid]}, text: leagueLeaders.trb.name\"></a>, <a data-bind=\"attrLeagueUrl: {href: ['roster', leagueLeaders.trb.abbrev]}, text: leagueLeaders.trb.abbrev\"></a>: <span data-bind=\"round: [leagueLeaders.trb.stat, 1]\"></span> reb<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['player', leagueLeaders.ast.pid]}, text: leagueLeaders.ast.name\"></a>, <a data-bind=\"attrLeagueUrl: {href: ['roster', leagueLeaders.ast.abbrev]}, text: leagueLeaders.ast.abbrev\"></a>: <span data-bind=\"round: [leagueLeaders.ast.stat, 1]\"></span> ast<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['leaders']}\">» League Leaders</a><br>\n      <a data-bind=\"attrLeagueUrl: {href: ['player_stats']}\">» Player Stats</a>\n    </p>\n  </div>\n  <div class=\"span4\">\n    <h3>Finances</h3>\n    <p>\n      Avg Attendance: <span data-bind=\"numberWithCommas: att\"></span><br>\n      Revenue (YTD): <span data-bind=\"currency: [revenue, 'M']\"></span><br>\n      Profit (YTD): <span data-bind=\"currency: [profit, 'M']\"></span><br>\n      Cash: <span data-bind=\"currency: [cash, 'M']\"></span><br>\n      Payroll: <span data-bind=\"currency: [payroll, 'M']\"></span><br>\n      Salary Cap: <span data-bind=\"currency: [salaryCap, 'M']\"></span><br>\n      <a data-bind=\"attrLeagueUrl: {href: ['finances']}\">» League Finances</a>\n    </p>\n\n    <h3>Top Free Agents</h3>\n    <p>\n      <span data-bind=\"visible: freeAgents().length === 0\">None.<br></span>\n      <!-- ko foreach: freeAgents -->\n        <a data-bind=\"attrLeagueUrl: {href: ['player', pid]}, text: name\"></a>: <span data-bind=\"text: age\"></span> yo, <span data-bind=\"text: ovr\"></span> ovr, <span data-bind=\"text: pot\"></span> pot</span><br>\n      <!-- /ko -->\n      (You have <span data-bind=\"text: numRosterSpots\"></span> open roster spots)<br>\n      <a data-bind=\"attrLeagueUrl: {href: ['free_agents']}\">» Free Agents</a>\n    </p>\n\n    <h3>Expiring Contracts</h3>\n    <p>\n      <span data-bind=\"visible: expiring().length === 0\">None.<br></span>\n      <!-- ko foreach: expiring -->\n        <a data-bind=\"attrLeagueUrl: {href: ['player', pid]}, text: name\"></a>: <span data-bind=\"text: age\"></span> yo, <span data-bind=\"currency: [contractAmount, 'M']\"></span><br>\n        <span style=\"margin-left: 2em\"><span data-bind=\"round: [pts, 1]\"></span> pts, <span data-bind=\"text: ovr\"></span> ovr, <span data-bind=\"text: pot\"></span> pot</span><br>\n      <!-- /ko -->\n      <a data-bind=\"attrLeagueUrl: {href: ['roster']}\">» Full Roster</a>\n    </p>\n  </div>\n</div>";
  });
templates['standings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"standings-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Standings <span data-bind=\"newWindow: []\"></span></h1>\n\n<!-- ko foreach: confs -->\n  <h2 data-bind=\"text: name\"></h2>\n  <div class=\"row-fluid\">\n    <div class=\"span9\">\n      <!-- ko foreach: divs -->\n          <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n          <thead>\n            <tr><th width=\"100%\" data-bind=\"text: name\"></th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Home</th><th>Road</th><th>Div</th><th>Conf</th><th>Streak</th><th>L10</th></tr>\n          </thead>\n          <tbody>\n          <!-- ko foreach: teams -->\n            <tr><td><a data-bind=\"attrLeagueUrl: {href: ['roster', abbrev, $parents[2].season]}, text: region() + ' ' + name()\"></a></td><td data-bind=\"text: won\"></td><td data-bind=\"text: lost\"></td><td data-bind=\"roundWinp: winp\"></td><td data-bind=\"text: gb\"></td><td data-bind=\"text: wonHome() + '-' + lostHome()\"></td><td data-bind=\"text: wonAway() + '-' + lostAway()\"></td><td data-bind=\"text: wonDiv() + '-' + lostDiv()\"></td><td data-bind=\"text: wonConf() + '-' + lostConf()\"></td><td data-bind=\"text: streak\"></td><td data-bind=\"text: lastTen\"></td></tr>\n          <!-- /ko -->\n          </tbody>\n          </table>\n      <!-- /ko -->\n    </div>\n\n    <div class=\"span3\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n      <thead>\n        <tr><th width=\"100%\">Team</th><th align=\"right\">GB</th></tr>\n      </thead>\n      <tbody>\n      <!-- ko foreach: teams -->\n        <tr data-bind=\"attr: {class: $index() === 7 ? 'separator' : ''}\"><td><span data-bind=\"text: rank\"></span>. <a data-bind=\"attrLeagueUrl: {href: ['roster', abbrev, $parents[1].season]}, text: region\"></a></td><td align=\"right\" data-bind=\"text: gb\"></td></tr>\n      <!-- /ko -->\n      </tbody>\n      </table>\n    </div>\n  </div>\n<!-- /ko -->";
  });
templates['playoffs'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"playoffs-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Playoffs <span data-bind=\"newWindow: []\"></span></h1>\n\n<p data-bind=\"visible: !finalMatchups()\">This is what the playoff matchups would be if the season ended right now.</p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table-condensed\" width=\"100%\">\n<tbody>\n  <tr>\n    <td width=\"14.28%\" data-bind=\"matchup: [0, 0]\"></td>\n    <td rowspan=\"2\" width=\"14.28%\" data-bind=\"matchup: [1, 0]\"></td>\n    <td rowspan=\"4\" width=\"14.28%\" data-bind=\"matchup: [2, 0]\"></td>\n    <td rowspan=\"4\" width=\"14.28%\" data-bind=\"matchup: [3, 0]\"></td>\n    <td rowspan=\"4\" width=\"14.28%\" data-bind=\"matchup: [2, 1]\"></td>\n    <td rowspan=\"2\" width=\"14.28%\" data-bind=\"matchup: [1, 2]\"></td>\n    <td width=\"14.28%\" data-bind=\"matchup: [0, 4]\"></td>\n  </tr>\n  <tr>\n    <td data-bind=\"matchup: [0, 1]\"></td>\n    <td data-bind=\"matchup: [0, 5]\"></td>\n  </tr>\n  <tr>\n    <td data-bind=\"matchup: [0, 2]\"></td>\n    <td rowspan=\"2\" data-bind=\"matchup: [1, 1]\"></td>\n    <td rowspan=\"2\" data-bind=\"matchup: [1, 3]\"></td>\n    <td data-bind=\"matchup: [0, 6]\"></td>\n  </tr>\n  <tr>\n    <td data-bind=\"matchup: [0, 3]\"></td>\n    <td data-bind=\"matchup: [0, 7]\"></td>\n  </tr>\n</tbody>\n</table>\n</p>\n";
  });
templates['playerRatingDists'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"player-rating-dists-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Player Rating Distributions <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['player_ratings', season]}\">Main Ratings</a></p>\n\n<p>These <a href=\"http://en.wikipedia.org/wiki/Box_plot\">box plots</a> show the league-wide distributions of player ratings for all active players in the selected season. The five vertical lines in each plot represent the minimum of the scale (0), the minimum, the first <a href=\"http://en.wikipedia.org/wiki/Quartile\">quartile</a>, the median, the third quartile, the maximum, and the maximum of the scale (100).</p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" id=\"player-rating-dists\">\n  <tbody></tbody>\n</table>\n</p>\n";
  });
templates['teamStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"team-stats-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Team Stats <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['team_shot_locations', season]}\">Shot Locations</a> | <a data-bind=\"attrLeagueUrl: {href: ['team_stat_dists', season]}\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"team-stats\">\n<thead>\n  <tr><th colspan=\"4\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"7\"></th></tr>\n  <tr><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Won\">W</th><th title=\"Lost\">L</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Opponent's Points\">OPts</th></tr>\n</thead>\n</table>\n</p>";
  });
templates['dropdown'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <option value=\""
    + escapeExpression(((stack1 = depth0.key),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"";
  stack2 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">"
    + escapeExpression(((stack1 = depth0.val),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "  <select id=\""
    + escapeExpression(((stack1 = depth0.fieldId),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\""
    + escapeExpression(((stack1 = depth0.field),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n    ";
  stack2 = ((stack1 = ((stack1 = depth0.options),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </select>";
  return buffer;
  });
templates['manualOverview'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Basketball GM Manual</h1>\n\n<p>Basketball GM is a completely free sports management simulation game. You are the general manager of a basketball team, tasked with building your roster to compete for a championship while managing your finances. As of now, your goal can be whatever you want: winning the most championships, making the most profit, developing players from rookies to stars, etc. You can make an unlimited number of different leagues from <a href=\"/\">the dashboard</a>, each one with a different set of random players.</p>\n\n<h2>User Interface</h2>\n\n<p>From within a league, the most important user interface element is the Play Menu, which you can access with the big blue Play button at the top of the screen. Any context-dependent action, like playing a game or moving from one phase to another, is done from the Play Menu. Everything else about the user interface should (hopefully) be self-explanitory.</p>\n\n<h2>Gameplay Overview</h2>\n\n<p>Each season of the game is divided into several phases:</p>\n\n<ul>\n  <li><b>Preaseason.</b> Players develop/age (<i>i.e.</i> their ratings change). Young players tend to get better, old players tend to get worse.</li>\n  <li><b>Regular season.</b> Regular season games are played, at the pace you choose through the Play menu.</li>\n  <li><b>Playoffs.</b> Teams that made the playoffs (top 8 in each conference) progress through the bracket playing best-of-7 series until a champion emerges.</li>\n  <li><b>Pre-draft.</b> After the playoffs end, you have one more chance to make changes to your roster before the draft, such as releasing a player to make room on your roster for a new player.</li>\n  <li><b>Draft.</b> Similar to the NBA draft (although there is no lottery), teams are ordered from worst to best for two rounds.</li>\n  <li><b>Post-draft.</b> After the draft, you have one more chance to make changes to your roster before free agency.</li>\n  <li><b>Free agency.</b> Contracts expire. For players on your team, you will have the chance to negotiate a new contract with each player whose contract expires. Otherwise, players with expiring contracts become free agents. The same thing happens for the other teams, so the free agents list is most richly populated at this time.</li>\n</ul>\n\n<h2>League Rules</h2>\n\n<p>League rules are generally modeled on the NBA, but simplified.</p>\n\n<h3>Salary cap</h3>\n\n<p>The salary cap is $60 million. This is a soft cap, in the sense that even if you are over the salary cap, you can still:</p>\n\n<ul>\n  <li>Draft players and add their salaries</li>\n  <li>Resign your current players (like the <a href=\"http://en.wikipedia.org/wiki/NBA_salary_cap#Larry_Bird_exception\">Larry Bird exception</a>)</li>\n  <li>Sign free agents to minimum contracts ($500k)</li>\n</ul>\n\n<h3>Contracts</h3>\n\n<p>The maximum contract amount is $20 million per year and the maximum contract length is 5 years.</p>\n\n<p>The minimum contract amount is $500 thousand per year and the minimum contract length is 1 year (or, until the end of the season, if the season is already in progress).</p>\n\n<p>When a contract expires, you have the opportunity to negotiate a new contract with the player. If you don't come to an agreement, the player becomes a free agent. This is important because, based on the salary cap rules, you can go over the cap to resign your own players but you can't go over the cap to sign a free agent.</p>\n\n<h3>Roster</h3>\n\n<p>The maximum roster size is 15. You can never exceed this, except during the draft. But right after that, you'll have to release or buy out enough players to get under the limit.</p>\n\n<p>The minimum roster size is 5. You must be above this limit to play games.</p>\n\n<h2>Player Ratings</h2>\n\n<p>Player ratings for a variety of categories (shooting, rebounding, passing, dribbling, etc.) are on a scale from 0-100. The whole scale is used, so a typical value for a rating is 50. Roughly, the overall (average) player ratings mean:</p>\n\n<ul>\n  <li><b>90s:</b> All-time great</li>\n  <li><b>80s:</b> MVP candidate</li>\n  <li><b>70s:</b> All League candidate</li>\n  <li><b>60s:</b> Good starter</li>\n  <li><b>50s:</b> Role player</li>\n  <li><b>40s and lower:</b> Bench</li>\n</ul>\n\n<p>However, the overall ratings aren't a guarantee of performance. The particular mix of ratings plays into success (<i>e.g.</i> a short player having a 100 shot blocking rating doesn't do much), as do a player's teammates (<i>e.g.</i> a good rebounder doesn't help your team as much if you already have a few other good rebounders).</p>\n\n<h2>How does it work?</h2>\n\n<p>There are no accounts, no passwords, no nothing. All the game data is stored locally on your computer using <a href=\"https://www.google.com/search?q=indexeddb\">IndexedDB</a>. This has advantages and disadvantages. The main advantage is that it is really cheap to run this game, since simulations can occur in your web browser rather than a central server; this is what allows the game to be free and unlimited. The two main disadvantages are (1) doing simulations in your web browser incurs some performance restrictions (but it's not that bad), and (2) since the games are stored on your computer and not on a server, you can't access the same leagues on different computers (eventually this will be possible though).</p>\n\n<h2>Performance</h2>\n\n<p>Game simulation can be taxing on your computer, particularly as additional seasons are simulated and the database grows. There are a couple of tricks you can use to speed this up:</p>\n\n<ol>\n  <li>Don't open multiple windows/tabs viewing while you are simulating games. If you do, then all of the windows will try to update their content every day, which takes valuable computing resources away from actually simulating the games.</li>\n  <li>Don't have a complicated page (such as the league dashboard) open when you simulate games. As the simulation progresses, the content of whatever you're viewing updates each day. If you're viewing something complex, this can be a little slow. For the fastest performance, view something old like the standings from a previous season which does not have to update ever.</li>\n</ol>\n\n<h2>Make Basketball GM better!</h2>\n\n<p>Basketball GM is open source. That means you can copy/edit/improve/redistribute the game. <a href=\"https://github.com/jdscheff/basketball-gm\">The code is on GitHub</a>, avaliable under the <a href=\"http://www.gnu.org/licenses/agpl-3.0.html\">GNU Affero General Public License</a>. If you want to help make Basketball GM better, there are tons of ways you can help. You can start hacking on anything you want or <a href=\"mailto:jdscheff@gmail.com\">send me an email</a> if you want to discuss things first.</p>\n\n<h2>Still not sure about something?</h2>\n\n<p>If you have a question or think you found a bug or you want to request a feature, either <a href=\"mailto:commissioner@basketball-gm.com\">send an email</a> (commissioner@basketball-gm.com) or <a href=\"https://github.com/jdscheff/basketball-gm/issues\">submit an issue on GitHub</a>.</p>";
  });
templates['history'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"history-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Season Summary <span data-bind=\"newWindow: []\"></span></h1>\n\n<p></p>\n<div class=\"row-fluid\">\n  <div class=\"span4\">\n    <h4>League Champions</h4>\n    <p><strong><a data-bind=\"attrLeagueUrl: {href: ['roster', champ.abbrev, season]}\"><span data-bind=\"text: champ.region\"></span> <span data-bind=\"text: champ.name\"></span></a></strong><br>\n    <a data-bind=\"attrLeagueUrl: {href: ['playoffs', season]}\">Playoffs Bracket</a></p>\n    <h4>Best Record</h4>\n    <p>East: <a  data-bind=\"attrLeagueUrl: {href: ['roster', awards.bre.abbrev, season]}\"><span data-bind=\"text: awards.bre.region\"></span> <span data-bind=\"text: awards.bre.name\"></span></a> (<span data-bind=\"text: awards.bre.won\"></span>-<span data-bind=\"text: awards.bre.lost\"></span>)<br>\n    West: <a data-bind=\"attrLeagueUrl: {href: ['roster', awards.brw.abbrev, season]}\"><span data-bind=\"text: awards.brw.region\"></span> <span data-bind=\"text: awards.brw.name\"></span></a> (<span data-bind=\"text: awards.brw.won\"></span>-<span data-bind=\"text: awards.brw.lost\"></span>)<br></p>\n    <h4>Most Valueable Player</h4>\n    <p><strong><a data-bind=\"attrLeagueUrl: {href: ['player', awards.mvp.pid]}, text: awards.mvp.name\"></a></strong> (<a data-bind=\"attrLeagueUrl: {href: ['roster', awards.mvp.abbrev, season]}, text: awards.mvp.abbrev\"></a>)<br>\n    <span data-bind=\"round: [awards.mvp.pts, 1]\"></span> pts, <span data-bind=\"round: [awards.mvp.trb, 1]\"></span> reb, <span data-bind=\"round: [awards.mvp.ast, 1]\"></span> ast</p>\n    <h4>Defensive Player of the Year</h4>\n    <p><strong><a data-bind=\"attrLeagueUrl: {href: ['player', awards.dpoy.pid]}, text: awards.dpoy.name\"></a></strong> (<a data-bind=\"attrLeagueUrl: {href: ['roster', awards.dpoy.abbrev, season]}, text: awards.dpoy.abbrev\"></a>)<br>\n    <span data-bind=\"round: [awards.dpoy.trb, 1]\"></span> reb, <span data-bind=\"round: [awards.dpoy.blk, 1]\"></span> blk, <span data-bind=\"round: [awards.dpoy.stl, 1]\"></span> stl</p>\n    <h4>Sixth Man of the Year</h4>\n    <p><strong><a data-bind=\"attrLeagueUrl: {href: ['player', awards.smoy.pid]}, text: awards.smoy.name\"></a></strong> (<a data-bind=\"attrLeagueUrl: {href: ['roster', awards.smoy.abbrev, season]}, text: awards.smoy.abbrev\"></a>)<br>\n    <span data-bind=\"round: [awards.smoy.pts, 1]\"></span> pts, <span data-bind=\"round: [awards.smoy.trb, 1]\"></span> reb, <span data-bind=\"round: [awards.smoy.ast, 1]\"></span> ast</p>\n    <h4>Rookie of the Year</h4>\n    <p><strong><a data-bind=\"attrLeagueUrl: {href: ['player', awards.roy.pid]}, text: awards.roy.name\"></a></strong> (<a data-bind=\"attrLeagueUrl: {href: ['roster', awards.roy.abbrev, season]}, text: awards.roy.abbrev\"></a>)<br>\n    <span data-bind=\"round: [awards.roy.pts, 1]\"></span> pts, <span data-bind=\"round: [awards.roy.trb, 1]\"></span> reb, <span data-bind=\"round: [awards.roy.ast, 1]\"></span> ast</p>\n  </div>\n  <div class=\"span4\">\n    <h4>All-League Teams</h4>\n    <!-- ko foreach: awards.allLeague -->\n      <b data-bind=\"text: title\"></b><br>\n      <!-- ko foreach: players -->\n        <a data-bind=\"attrLeagueUrl: {href: ['player', pid]}, text: name\"></a> (<a data-bind=\"attrLeagueUrl: {href: ['roster', abbrev, $root.season]}, text: abbrev\"></a>)<br>\n      <!-- /ko -->\n    <!-- /ko -->\n  </div>\n  <div class=\"span4\">\n    <h4>All-Defensive Teams</h4>\n    <!-- ko foreach: awards.allDefensive -->\n      <b data-bind=\"text: title\"></b><br>\n      <!-- ko foreach: players -->\n        <a data-bind=\"attrLeagueUrl: {href: ['player', pid]}, text: name\"></a> (<a data-bind=\"attrLeagueUrl: {href: ['roster', abbrev, $root.season]}, text: abbrev\"></a>)<br>\n      <!-- /ko -->\n    <!-- /ko -->\n  </div>\n</div>\n<div class=\"row-fluid\">\n  <div class=\"span12\">\n    <h4>Retired Players</h4>\n    <!-- ko foreach: retiredPlayers -->\n      <a data-bind=\"attrLeagueUrl: {href: ['player', pid]}, text: name\"></a> (overall rating: <span data-bind=\"text: ratings.ovr\"></span>; age: <span data-bind=\"text: age\"></span>)<br>\n    <!-- /ko -->\n  </div>\n</div>";
  });
templates['playButton'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <li><a href=\""
    + escapeExpression(((stack1 = depth0.url),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" id=\""
    + escapeExpression(((stack1 = depth0.id),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = depth0.label),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></li>\n      ";
  return buffer;
  }

  buffer += "<ul class=\"nav btn btn-primary\">\n  <li class=\"dropdown\">\n    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" id=\"play-button-link\">Play <b class=\"caret\"></b></a>\n    <ul class=\"dropdown-menu\">\n      ";
  stack2 = ((stack1 = ((stack1 = depth0.options),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n    </ul>\n  </li>\n</ul>\n";
  return buffer;
  });
templates['inbox'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Inbox <span data-bind=\"newWindow: []\"></span></h1>\n\n<p class=\"text-error\" data-bind=\"visible: anyUnread\">You have a new message from the owner. Read it before continuing.</p>\n<p>\n<table class=\"table table-striped table-bordered table-condensed\" id=\"messages\">\n  <tbody data-bind=\"foreach: messages\">\n      <tr data-bind=\"css: {unread: !read()}\"><td class=\"year\"><a data-bind=\"text: year, attrLeagueUrl: {href: ['message', mid]}\"></td><td class=\"from\"><a data-bind=\"text: from, attrLeagueUrl: {href: ['message', mid]}\"></a></td><td class=\"text\"><a data-bind=\"text: text, attrLeagueUrl: {href: ['message', mid]}\"></a></td></tr>\n  </tbody>\n</table>\n</p>";
  });
templates['schedule'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Upcoming Schedule <span data-bind=\"newWindow: []\"></span></h1>\n\n<ol data-bind=\"foreach: games\">\n  <li><a data-bind=\"attrLeagueUrl: {href: ['roster', teams[0].abbrev]}\"><span data-bind=\"text: teams[0].region\"></span> <span data-bind=\"text: teams[0].name\"></span></a>\n  <span data-bind=\"text: vsat\"></span>\n  <a data-bind=\"attrLeagueUrl: {href: ['roster', teams[1].abbrev]}\"><span data-bind=\"text: teams[1].region\"></span> <span data-bind=\"text: teams[1].name\"></span></a>\n</ol>\n";
  });
templates['error'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h1>Error</h1>\n\n"
    + escapeExpression(((stack1 = depth0.error),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n";
  return buffer;
  });
templates['newLeague'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <option value=\""
    + escapeExpression(((stack1 = depth0.tid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = depth0.region),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n      ";
  return buffer;
  }

  buffer += "<h1>Create New League</h1>\n<p>\n<form action=\"/new_league\" method=\"POST\">\n  <fieldset>\n    <label>League name</label>\n    <input type=\"text\" name=\"name\" value=\""
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"><br><br>\n    <label>Which team do you want to manage?</label>\n    <select name=\"tid\">\n      ";
  stack2 = ((stack1 = ((stack1 = depth0.teams),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n    </select>\n   <span class=\"help-block\" id=\"pop-text\"></span><br>\n    <!--<label><select name=\"players\">\n      <option value=\"random\" selected=\"selected\">Random Players</option>\n      <option value=\"nba2012\">2012 NBA Players</option>\n    </select></label><br>-->\n    <button type=\"submit\" class=\"btn\" id=\"create-new-league\">Create New League</button>\n  </fieldset>\n</form>\n</p>";
  return buffer;
  });
templates['dashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <li>\n      <a href=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\"btn league\" title=\""
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ". "
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"><strong>"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ". "
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br></strong><span class=\"clearfix\">"
    + escapeExpression(((stack1 = depth0.region),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = depth0.teamName),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br></span><span class=\"clearfix\">"
    + escapeExpression(((stack1 = depth0.phaseText),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span></a>\n      <form action=\"/delete_league\" method=\"POST\" class=\"delete\"><input type=\"hidden\" name=\"lid\" value=\""
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"><button class=\"btn btn-mini\">Delete</button></form>\n    </li>\n  ";
  return buffer;
  }

  buffer += "<ul class=\"dashboard_league\">\n  ";
  stack2 = ((stack1 = ((stack1 = depth0.leagues),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n  <li class=\"dashboard_league_new\"><a href=\"/new_league\" class=\"btn btn-primary league\"><h2 style=\"\">Create new league</h2></a></li>\n</ul>";
  return buffer;
  });
templates['playerShotLocations'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"player-shot-locations-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Player Shot Locations <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['player_stats', season]}\">Main Stats</a> | <a data-bind=\"attrLeagueUrl: {href: ['player_stat_dists', season]}\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player-shot-locations\">\n<thead>\n  <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"At Rim\">At Rim</th><th colspan=\"3\" style=\"text-align: center\" title=\"Low Post\">Low Post</th><th colspan=\"3\" style=\"text-align: center\" title=\"Mid-Range\">Mid-Range</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th></tr>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th></tr>\n</thead>\n</table>\n</p>";
  });
templates['negotiation'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Contract Negotiation <span data-bind=\"newWindow: []\"></span></h1>\n\n<p data-bind=\"visible: negotiation.resigning\">You are allowed to go over the salary cap to make this deal because you are resigning <a data-bind=\"attrLeagueUrl: {href: ['player', player.pid]}, text: player.name\"></a> to a contract extension. <strong>If you do not come to an agreement here, <a data-bind=\"attrLeagueUrl: {href: ['player', player.pid]}, text: player.name\"></a> will become a free agent.</strong> He will then be able to sign with any team, and you won't be able to go over the salary cap to sign him.</p>\n<p data-bind=\"visible: !negotiation.resigning()\">You are not allowed to go over the salary cap to make this deal because <a data-bind=\"attrLeagueUrl: {href: ['player', player.pid]}, text: player.name\"></a> is a free agent.</p>\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2 data-bind=\"test: team.region + ' ' + team.name\"></h2>\n    <p>Current Payroll: <span data-bind=\"currency: [payroll, 'M']\"></span></p>\n    <p>Salary Cap: <span data-bind=\"currency: [salaryCap, 'M']\"></span></p>\n    <h2>Your Proposal</h2>\n    <form data-bind=\"attrLeagueUrl: {action: ['negotiation', player.pid]}\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"text\" name=\"teamYears\" id=\"teamYears\" class=\"span1\" data-bind=\"attr: {value: negotiation.team.years}\"> years\n      <p><div class=\"input-prepend input-append\">\n        <span class=\"add-on\">$</span><input type=\"text\" name=\"teamAmount\" id=\"teamAmount\" class=\"span5\" data-bind=\"attr: {value: negotiation.team.amount}\"><span class=\"add-on\">M</span> per year\n      </div></p>\n      <button type=\"submit\" class=\"btn btn-large btn-primary\">Submit Proposal</button>  \n    </form>\n\n    <form data-bind=\"attrLeagueUrl: {action: ['negotiation', player.pid]}\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"cancel\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-danger\">Can't reach a deal? End negotiation</button>\n    </form>\n\n  </div>\n  <div class=\"span6\">\n    <h2><a data-bind=\"attrLeagueUrl: {href: ['player', player.pid]}, text: player.name\"></a> <span data-bind=\"newWindow: ['player', player.pid]\"></span></h2>\n    <p>Mood: <span data-bind=\"html: player.mood\"></span></p>\n    <p>Overall: <span data-bind=\"text: player.ratings.ovr\"></span>; Potential: <span data-bind=\"text: player.ratings.pot\"></span></p>\n    <h2>Player Proposal</h2>\n    <p><span data-bind=\"text: negotiation.player.years\"></span> years (through <span data-bind=\"text: negotiation.player.expiration\"></span>)</p>\n    <p>$<span data-bind=\"round: [negotiation.player.amount, 3]\"></span>M per year</p>\n    <form data-bind=\"attrLeagueUrl: {action: ['negotiation', player.pid]}\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"accept\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-large btn-primary\" id=\"accept\">Accept Player Proposal</button>\n    </form>\n  </div>\n</div>\n";
  });
templates['negotiationList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Players With Expiring Contracts <span data-bind=\"newWindow: []\"></span></h1>\n\n<p>You are allowed to go over the salary cap to resign your players before they become free agents. If you do not resign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.</p>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"negotiation-list\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>";
  });
templates['deleteLeague'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h1>Delete League "
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "?</h1>\n\n<p>Are you <em>absolutely</em> sure you want to delete League "
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "? You will <em>permanently</em> lose any record of all "
    + escapeExpression(((stack1 = depth0.numSeasons),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " seasons, "
    + escapeExpression(helpers.numberWithCommas.call(depth0, depth0.numPlayers, {hash:{},data:data}))
    + " players, and "
    + escapeExpression(helpers.numberWithCommas.call(depth0, depth0.numGames, {hash:{},data:data}))
    + " games from this league (well... unless you have backup somewhere).</p>\n\n<form action=\"/delete_league\" method=\"post\" style=\"float: left; margin-right: 1em\">\n  <input type=\"hidden\" name=\"lid\" value=\""
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n  <input type=\"hidden\" name=\"confirm\" value=\"1\">\n  <button class=\"btn btn-danger\">Yes, I am sure! Delete League "
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ".</button>\n</form>\n<form action=\"/\" method=\"get\">\n  <button class=\"btn\">Cancel</button>\n</form>";
  return buffer;
  });
templates['playerRatings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"player-ratings-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Player Ratings <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['player_rating_dists', season]}\">Rating Distributions</a></p>\n\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player-ratings\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th></tr>\n</thead>\n</table>\n</p>";
  });
templates['playerStatDists'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"player-stat-dists-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Player Stat Distributions <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['player_stats', season]}\">Main Stats</a> | <a data-bind=\"attrLeagueUrl: {href: ['player_shot_locations', season]}\">Shot Locations</a></p>\n\n<p>These <a href=\"http://en.wikipedia.org/wiki/Box_plot\">box plots</a> show the league-wide distributions of player stats for all active players in the selected season. Black plots are for this league and blue plots are from the 2009-2010 NBA season, for comparison. NBA data was generously provided by <a href=\"http://www.databasebasketball.com/stats_download.htm\">databaseBasketball.com</a>. The five vertical lines in each plot represent the minimum of the scale, the minimum, the first <a href=\"http://en.wikipedia.org/wiki/Quartile\">quartile</a>, the median, the third quartile, the maximum, and the maximum of the scale.</p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" id=\"player-stat-dists\">\n  <tbody></tbody>\n</table>\n</p>\n";
  });
templates['leagueFinances'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"league-finances-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>League Finances <span data-bind=\"newWindow: []\"></span></h1>\n\n<p>\n  Salary cap: <strong data-bind=\"currency: [salaryCap, 'M']\"></strong> (teams over this amount cannot sign free agents for more than the minimum contract)<br>\n  Minimum payroll limit: <strong data-bind=\"currency: [minPayroll, 'M']\"></strong> (teams with payrolls below this limit will be assessed a fine equal to the difference at the end of the season)<br>\n  Luxury tax limit: <strong data-bind=\"currency: [luxuryPayroll, 'M']\"></strong> (teams with payrolls above this limit will be assessed a fine equal to <span data-bind=\"text: luxuryTax\"></span> times the difference at the end of the season)\n</p>\n\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"league-finances\">\n  <thead>\n    <tr><th>Team</th><th>Avg Attendance</th><th>Revenue (YTD)</th><th>Profit (YTD)</th><th>Cash</th><th>Payroll</th></tr>\n  </thead>\n  </table>\n</p>";
  });
templates['gameLog'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"game-log-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Game Log <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['roster', abbrev, season]}\">Roster</a> | <a data-bind=\"attrLeagueUrl: {href: ['finances', abbrev]}\">Finances</a></p>\n\n<p>\n<div class=\"row-fluid\">\n  <div class=\"span9\" id=\"box-score\" data-bind=\"html: boxScore.html\">\n    <p></p>\n  </div>\n\n  <div class=\"span3\" id=\"game-log-list\">\n    <table id=\"game_log_list\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n    <thead>\n      <tr><th>Opp</th><th>W/L</th><th>Score</th></tr>\n    </thead>\n    <tbody data-bind=\"foreach: gamesList.games\">\n      <tr data-bind=\"attr: {class: selected ? 'alert-info' : ''}\">\n        <td><a data-bind=\"attrLeagueUrl: {href: ['game_log', $root.abbrev, $root.season, gid]}, text: (home ? '' : '@') + oppAbbrev\"></a></td>\n        <td><a data-bind=\"attrLeagueUrl: {href: ['game_log', $root.abbrev, $root.season, gid]}, text: won ? 'W' : 'L'\"></a></td>\n        <td><a data-bind=\"attrLeagueUrl: {href: ['game_log', $root.abbrev, $root.season, gid]}, text: pts + '-' + oppPts + overtime\"></a></td>\n      </tr>\n    </tbody>\n    <tr data-bind=\"visible: gamesList.loading()\"><td colspan=\"3\" style=\"padding: 4px 5px;\">Loading...</td></tr>\n    </table>\n  </div>\n</div>\n</p>\n";
  });
templates['teamFinances'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"team-finances-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1><span data-bind=\"text: team.region\"></span> <span data-bind=\"text: team.name\"></span> Finances <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['roster', abbrev]}\">Roster</a> | <a data-bind=\"attrLeagueUrl: {href: ['game_log', abbrev]}\">Game Log</a></p>\n\n<p class=\"clearfix\">The current payroll (<strong data-bind=\"currency: [payroll, 'M']\"></strong>) is <span data-bind=\"text: aboveBelow.minPayroll\"></span> the minimum payroll limit (<strong data-bind=\"currency: [minPayroll, 'M']\"></strong>), <span data-bind=\"text: aboveBelow.salaryCap\"></span> the salary cap (<strong data-bind=\"currency: [salaryCap, 'M']\"></strong>), and <span data-bind=\"text: aboveBelow.luxuryPayroll\"></span> the luxury tax limit (<strong data-bind=\"currency: [luxuryPayroll, 'M']\"></strong>). <i class=\"icon-question-sign\" id=\"help-payroll-limits\" data-placement=\"bottom\"></i></p>\n\n<div class=\"row-fluid\">\n  <div class=\"span2\">\n    <h4>Wins</h4>\n    <div id=\"bar-graph-won\" class=\"bar-graph-small\"></div><br><br>\n    <span class=\"clickover\"><h4>Hype <i class=\"icon-question-sign\" id=\"help-hype\" data-placement=\"right\"></i></h4></span>\n    <div id=\"bar-graph-hype\" class=\"bar-graph-small\"></div><br><br>\n    <h4>Region Population</h4>\n    <div id=\"bar-graph-pop\" class=\"bar-graph-small\"></div><br><br>\n    <h4>Average Attendance</h4>\n    <div id=\"bar-graph-att\" class=\"bar-graph-small\"></div>\n  </div>\n  <div class=\"span4\">\n    <div class=\"row-fluid\">\n      <h4>Revenue</h4>\n      <div id=\"bar-graph-revenue\" class=\"bar-graph-large\"></div><br><br>\n      <h4>Expenses</h4>\n      <div id=\"bar-graph-expenses\" class=\"bar-graph-large\"></div><br><br>\n      <h4>Cash</h4>\n      <div id=\"bar-graph-cash\" class=\"bar-graph-medium\"></div>\n    </div>\n  </div>\n  <div class=\"span6\">\n    <form method=\"POST\" id=\"finances-settings\" data-bind=\"attrLeagueUrl: {action: ['team_finances']}\">\n      <h4>Revenue Settings <i class=\"icon-question-sign\" id=\"help-revenue-settings\" data-placement=\"bottom\"></i></h4>\n      <p class=\"text-error\"></p>\n      <div class=\"row\">\n        <div class=\"pull-left finances-settings-label\">Ticket Price</div>\n        <div class=\"input-prepend pull-left finances-settings-field\">\n          <span class=\"add-on\">$</span><input type=\"text\" name=\"budget[ticketPrice]\" class=\"ticket-price\" disabled=\"disabled\" data-bind=\"attr: {value: team.budget.ticketPrice.amount}\">\n        </div>\n        <div class=\"pull-left finances-settings-text\">(#<span data-bind=\"text: team.budget.ticketPrice.rank\"></span> leaguewide)</div>\n      </div>\n      <p></p>\n      <h4>Expense Settings <i class=\"icon-question-sign\" id=\"help-expense-settings\" data-placement=\"bottom\"></i></h4>\n      <p class=\"text-error\"></p>\n      <div class=\"row\">\n        <div class=\"pull-left finances-settings-label\">Scouting</div>\n        <div class=\"input-prepend input-append pull-left finances-settings-field\">\n          <span class=\"add-on\">$</span><input type=\"text\" name=\"budget[scouting]\" class=\"ticket-price\" disabled=\"disabled\" data-bind=\"attr: {value: team.budget.scouting.amount}\"><span class=\"add-on\">M</span>\n        </div>\n        <div class=\"pull-left finances-settings-text-small\">Current spending rate: #<span data-bind=\"text: team.budget.scouting.rank\"></span><br>Spent this season: #<span data-bind=\"text: team.expenses.scouting.rank\"></span></div>\n      </div>\n      <div class=\"row\">\n        <div class=\"pull-left finances-settings-label\">Coaching</div>\n        <div class=\"input-prepend input-append pull-left finances-settings-field\">\n          <span class=\"add-on\">$</span><input type=\"text\" name=\"budget[coaching]\" class=\"ticket-price\" disabled=\"disabled\" data-bind=\"attr: {value: team.budget.coaching.amount}\"><span class=\"add-on\">M</span>\n        </div>\n        <div class=\"pull-left finances-settings-text-small\">Current spending rate: #<span data-bind=\"text: team.budget.coaching.rank\"></span><br>Spent this season: #<span data-bind=\"text: team.expenses.coaching.rank\"></span></div>\n      </div>\n      <div class=\"row\">\n        <div class=\"pull-left finances-settings-label\">Health</div>\n        <div class=\"input-prepend input-append pull-left finances-settings-field\">\n          <span class=\"add-on\">$</span><input type=\"text\" name=\"budget[health]\" class=\"ticket-price\" disabled=\"disabled\" data-bind=\"attr: {value: team.budget.health.amount}\"><span class=\"add-on\">M</span>\n        </div>\n        <div class=\"pull-left finances-settings-text-small\">Current spending rate: #<span data-bind=\"text: team.budget.health.rank\"></span><br>Spent this season: #<span data-bind=\"text: team.expenses.health.rank\"></span></div>\n      </div>\n      <div class=\"row\">\n        <div class=\"pull-left finances-settings-label\">Facilities</div>\n        <div class=\"input-prepend input-append pull-left finances-settings-field\">\n          <span class=\"add-on\">$</span><input type=\"text\" name=\"budget[facilities]\" class=\"ticket-price\" disabled=\"disabled\" data-bind=\"attr: {value: team.budget.facilities.amount}\"><span class=\"add-on\">M</span>\n        </div>\n        <div class=\"pull-left finances-settings-text-small\">Current spending rate: #<span data-bind=\"text: team.budget.facilities.rank\"></span><br>Spent this season: #<span data-bind=\"text: team.expenses.facilities.rank\"></span></div>\n      </div>\n      <br>\n      <p align=\"center\"><button class=\"btn btn-large btn-primary\" style=\"line-height: 1.5em\"></button></p>\n    </form>\n  </div>\n</div>\n<p class=\"clearfix\"></p>\n\n<h2>Player Salaries</h2>\n\n<p>You can release or buy out players from <a data-bind=\"attrLeagueUrl: {href: ['roster']}\">your roster</a>. Released players who are still owed money are <i>shown in italics</i>.</p>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player-salaries\">\n<thead>\n  <tr>\n    <th>Name</th>\n    <!-- ko foreach: salariesSeasons -->\n      <th data-bind=\"text: $data\"></th>\n    <!-- /ko -->\n  </tr>\n</thead>\n<tbody>\n</tbody>\n<tfoot>\n  <tr>\n    <th>Totals</th>\n    <!-- ko foreach: contractTotals -->\n      <th data-bind=\"currency: [$data, 'M']\"></th>\n    <!-- /ko -->\n  </tr>\n</tfoot>\n</table>";
  });
templates['roster'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<form id=\"roster-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1><span data-bind=\"text: team.region\"></span> <span data-bind=\"text: team.name\"></span> Roster <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['finances', abbrev]}\">Finances</a> | <a data-bind=\"attrLeagueUrl: {href: ['game_log', abbrev, season]}\">Game Log</a></p>\n\n<p data-bind=\"visible: isCurrentSeason\">\n  <span data-bind=\"text: numRosterSpots\"></span> open roster spots<br>\n  Payroll: <span data-bind=\"currency: [payroll, 'M']\"></span><br>\n  Salary cap: <span data-bind=\"currency: [salaryCap, 'M']\"></span><br>\n  Cash: <span data-bind=\"currency: [team.cash, 'M']\"></span> (used for buying out players)\n</p>\n\n<p data-bind=\"visible: editable\">Drag and drop row handles to move players between the starting lineup (<span class=\"roster_gs\">&#9632;</span>) and the bench (<span class=\"roster_bench\">&#9632;</span>).</p>\n<p data-bind=\"visible: editable\"><button class=\"btn\" id=\"roster-auto-sort\">Auto sort roster</button></p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster\">\n<thead>\n  <tr><th data-bind=\"visible: editable\"></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th data-bind=\"visible: isCurrentSeason\">Contract</th><th title=\"Games Played\">GP</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th><th data-bind=\"visible: editable\">Release</th><th data-bind=\"visible: editable\">Buy out</th><th data-bind=\"visible: showTradeFor\">Trade For</th></tr>\n</thead>\n<tbody data-bind=\"foreach: players\">\n  <tr data-bind=\"attr: {class: $index() === 4 ? 'separator' : '', 'data-pid': pid}\">\n    <td class=\"roster_handle\" data-bind=\"visible: $parent.editable\"></td>\n    <td data-bind=\"playerNameLabels: [pid, name, injury, ratings.skills]\"></td>\n    <td data-bind=\"text: pos\"></td>\n    <td data-bind=\"text: age\"></td>\n    <td data-bind=\"text: ratings.ovr\"></td>\n    <td data-bind=\"text: ratings.pot\"></td>\n    <td data-bind=\"visible: $parent.isCurrentSeason\">\n      <span data-bind=\"currency: [contract.amount, 'M']\"></span> thru <span data-bind=\"text: contract.exp\"></span>\n    </td>\n    <td data-bind=\"text: stats.gp\"></td>\n    <td data-bind=\"round: [stats.min, 1]\"></td>\n    <td data-bind=\"round: [stats.pts, 1]\"></td>\n    <td data-bind=\"round: [stats.trb, 1]\"></td>\n    <td data-bind=\"round: [stats.ast, 1]\"></td>\n    <td data-bind=\"round: [stats.per, 1]\"></td>\n    <td data-bind=\"visible: $parent.editable\">\n      <button class=\"btn btn-mini\" data-action=\"release\" data-bind=\"enable: canRelease\">Release</button>\n    </td>\n    <td data-bind=\"visible: $parent.editable\">\n      <button class=\"btn btn-mini\" data-action=\"buyOut\" data-bind=\"enable: canBuyOut\">Buy out</button>\n    </td>\n    <td data-bind=\"visible: $parent.showTradeFor\">\n      <form action=\"/l/"
    + escapeExpression(((stack1 = depth0.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/trade\" method=\"POST\" style=\"margin: 0\">\n        <input type=\"hidden\" name=\"pid\" data-bind=\"attr: {value: pid}\">\n        <button type=\"submit\" class=\"btn btn-mini\">Trade For</button>\n      </form>\n    </td>\n  </tr>\n</tbody>\n</table>\n</p>\n";
  return buffer;
  });
templates['message'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<p><b>From: <span data-bind=\"text: message.from\"></span>, <span data-bind=\"text: message.year\"></span></b> <span data-bind=\"newWindow: []\"></span></p>\n\n<span data-bind=\"html: message.text\"></span>\n\n<p><a data-bind=\"attrLeagueUrl: {href: ['inbox']}\">Return To Inbox</a></p>";
  });
templates['teamHistory'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Team History <span data-bind=\"newWindow: []\"></span></h1>\n\n<p>\n  <!-- ko foreach: history -->\n    <a data-bind=\"attrLeagueUrl: {href: ['roster', $root.abbrev, season]}, text: season\"></a>: <a data-bind=\"attrLeagueUrl: {href: ['standings', season]}\"><span data-bind=\"text: won\"></span>-<span data-bind=\"text: lost\"></span></a><span data-bind=\"visible: extraText\">, <a data-bind=\"attrLeagueUrl: {href: ['playoffs', season]}, text: extraText\"></a></span><br>\n  <!-- /ko -->\n</p>";
  });
templates['draft'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Draft <span data-bind=\"newWindow: []\"></span></h1>\n\n<p>When your turn in the draft comes up, select from the list of available players on the left.</p>\n\n<p data-bind=\"visible: !started()\"><button class=\"btn btn-large btn-primary\" id=\"start-draft\">Start draft</button></p>\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2>Undrafted Players</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"undrafted\">\n    <thead>\n      <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Draft</th></tr>\n    </thead>\n    <tbody data-bind=\"foreach: undrafted\">\n      <tr data-bind=\"attr: {id: 'undrafted-' + pid()}\">\n        <td data-bind=\"playerNameLabels: [pid, name, injury, ratings.skills]\"></td>\n        <td data-bind=\"text: pos\"></td>\n        <td data-bind=\"text: age\"></td>\n        <td data-bind=\"text: ratings.ovr\"></td>\n        <td data-bind=\"text: ratings.pot\"></td>\n        <td><button class=\"btn btn-mini btn-primary\" data-bind=\"attr: {'data-player-id': pid}, enable: $root.started\">Draft</button></td>\n      </tr>\n    </tbody>\n    </table>\n  </div>\n  <div class=\"span6\">\n    <h2>Draft Results</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"drafted\">\n    <thead>\n      <tr><th>Pick</th><th>Team</th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th></tr>\n    </thead>\n    <tbody data-bind=\"foreach: drafted\">\n      <tr>\n        <td><span data-bind=\"text: draft.round\"></span>-<span data-bind=\"text: draft.pick\"></span></td>\n        <td><a data-bind=\"attrLeagueUrl: {href: ['roster', draft.abbrev]}, text: draft.abbrev\"></a></td>\n        <!-- ko if: pid() >= 0 -->\n          <td data-bind=\"playerNameLabels: [pid, name, injury, ratings.skills]\"></td>\n          <td data-bind=\"text: pos\"></td>\n          <td data-bind=\"text: age\"></td>\n          <td data-bind=\"text: ratings.ovr\"></td>\n          <td data-bind=\"text: ratings.pot\"></td>\n        <!-- /ko -->\n        <!-- ko if: pid() < 0 -->\n          <td></td>\n          <td></td>\n          <td></td>\n          <td></td>\n          <td></td>\n        <!-- /ko -->\n      </tr>\n    </tbody>\n    </table>\n  </div>\n</div>\n";
  });
templates['player'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h1><span data-bind=\"text: player.name\"></span> <span data-bind=\"newWindow: []\"></span></h1>\n    <div id=\"picture\" class=\"player_picture\"></div>\n    <div style=\"float: left;\">\n      <strong><span data-bind=\"text: player.teamRegion\"></span> <span data-bind=\"text: player.teamName\"></span></strong><br>\n      Height: <span data-bind=\"text: player.hgtFt\"></span>'<span data-bind=\"text: player.hgtIn\"></span>\"<br>\n      Weight: <span data-bind=\"text: player.weight\"></span> lbs<br>\n      Age: <span data-bind=\"text: player.age\"></span><br>\n      Born: <span data-bind=\"text: player.born.year\"></span> - <span data-bind=\"text: player.born.loc\"></span><br>\n      <!-- ko if: player.draft.round -->\n        Draft: <span data-bind=\"text: player.draft.year\"></span> - Round <span data-bind=\"text: player.draft.round\"></span> (Pick <span data-bind=\"text: player.draft.pick\"></span>) by <span data-bind=\"text: player.draft.abbrev\"></span><br>\n      <!-- /ko -->\n      <!-- ko if: !player.draft.round() -->\n        Undrafted: <span data-bind=\"text: player.draft.year\"></span><br>\n      <!-- /ko -->\n      <!-- ko if: showContract -->\n        <span data-bind=\"visible: freeAgent\">Asking for</span><span data-bind=\"visible: !freeAgent()\">Contract</span>: <span data-bind=\"currency: [player.contract.amount, 'M']\"></span>/yr thru <span data-bind=\"text: player.contract.exp\"></span><br>\n      <!-- /ko -->\n      <!-- ko if: !retired() -->\n        <span class=\"label label-important label-injury\" style=\"margin-left: 0\" data-bind=\"visible: injured, text: player.injury.gamesRemaining, attr: {title: player.injury.type + ' (out ' + player.injury.gamesRemaining + ' more games)'}\"></span><span class=\"skills_block\" data-bind=\"visible: injured, skillsBlock: currentRatings.skills\"></span>\n        <span class=\"skills_alone\" data-bind=\"visible: !injured(), skillsBlock: currentRatings.skills\"></span>\n        <br>\n      <!-- /ko -->\n    </div>\n  </div>\n  <div class=\"span6\" data-bind=\"visible: !retired()\">\n    <h2 class=\"pull-left\">Overall: <span data-bind=\"text: currentRatings.ovr\"></span></h2>\n    <h2 class=\"pull-right\">Potential: <span data-bind=\"text: currentRatings.pot\"></span></h2><br><br><br>\n    <div class=\"row-fluid\">\n      <div class=\"span4\">\n        <strong>Physical</strong><br/ >\n        Height: <span data-bind=\"text: currentRatings.hgt\"></span><br>\n        Strength: <span data-bind=\"text: currentRatings.stre\"></span><br>\n        Speed: <span data-bind=\"text: currentRatings.spd\"></span><br>\n        Jumping: <span data-bind=\"text: currentRatings.jmp\"></span><br>\n        Endurance: <span data-bind=\"text: currentRatings.endu\"></span>\n      </div>\n      <div class=\"span4\">\n        <strong>Shooting</strong><br/ >\n        Inside: <span data-bind=\"text: currentRatings.ins\"></span><br>\n        Layups: <span data-bind=\"text: currentRatings.dnk\"></span><br>\n        Free throws: <span data-bind=\"text: currentRatings.ft\"></span><br>\n        Two pointers: <span data-bind=\"text: currentRatings.fg\"></span><br>\n        Three pointers: <span data-bind=\"text: currentRatings.tp\"></span>\n      </div>\n      <div class=\"span4\">\n        <strong>Skill</strong><br/ >\n        Blocks: <span data-bind=\"text: currentRatings.blk\"></span><br>\n        Steals: <span data-bind=\"text: currentRatings.stl\"></span><br>\n        Dribbling: <span data-bind=\"text: currentRatings.drb\"></span><br>\n        Passing: <span data-bind=\"text: currentRatings.pss\"></span><br>\n        Rebounding: <span data-bind=\"text: currentRatings.reb\"></span>\n      </div>\n    </div>\n  </div>\n</div>\n\n<p></p>\n\n<form method=\"POST\" data-bind=\"visible: showTradeFor, attrLeagueUrl: {action: ['trade']}\"><input type=\"hidden\" name=\"pid\" data-bind=\"attr: {value: player.pid}\"><button type=\"submit\" class=\"btn btn-small\">Trade For</button></form>\n<form method=\"POST\" data-bind=\"visible: freeAgent, attrLeagueUrl: {action: ['negotiation', player.pid]}\"><input type=\"hidden\" name=\"new\" value=\"1\"><button type=\"submit\" class=\"btn btn-small\">Sign free agent</button></form>\n\n<h2>Regular Season</h2>\n<h3>Stats</h3>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n  <thead>\n    <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n  </thead>\n  <tbody data-bind=\"foreach: player.stats\">\n    <tr><td><a href=\"#\" data-bind=\"text: season\"></a></td><td><a data-bind=\"text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}\"></a></td><td data-bind=\"text: age\"></td><td data-bind=\"text: gp\"></td><td data-bind=\"text: gs\"></td><td data-bind=\"round: [min, 1]\"></td><td data-bind=\"round: [fg, 1]\"></td><td data-bind=\"round: [fga, 1]\"></td><td data-bind=\"round: [fgp, 1]\"></td><td data-bind=\"round: [tp, 1]\"></td><td data-bind=\"round: [tpa, 1]\"></td><td data-bind=\"round: [tpp, 1]\"></td><td data-bind=\"round: [ft, 1]\"></td><td data-bind=\"round: [fta, 1]\"></td><td data-bind=\"round: [ftp, 1]\"></td><td data-bind=\"round: [orb, 1]\"></td><td data-bind=\"round: [drb, 1]\"></td><td data-bind=\"round: [trb, 1]\"></td><td data-bind=\"round: [ast, 1]\"></td><td data-bind=\"round: [tov, 1]\"></td><td data-bind=\"round: [stl, 1]\"></td><td data-bind=\"round: [blk, 1]\"></td><td data-bind=\"round: [pf, 1]\"></td><td data-bind=\"round: [pts, 1]\"></td><td data-bind=\"round: [per, 1]\"></td></tr>\n  </tbody>\n  <tfoot data-bind=\"with: player.careerStats\">\n      <tr><th>Career</th><th></th><th></th><th data-bind=\"text: gp\"></th><th data-bind=\"text: gs\"></th><th data-bind=\"round: [min, 1]\"></th><th data-bind=\"round: [fg, 1]\"></th><th data-bind=\"round: [fga, 1]\"></th><th data-bind=\"round: [fgp, 1]\"></th><th data-bind=\"round: [tp, 1]\"></th><th data-bind=\"round: [tpa, 1]\"></th><th data-bind=\"round: [tpp, 1]\"></th><th data-bind=\"round: [ft, 1]\"></th><th data-bind=\"round: [fta, 1]\"></th><th data-bind=\"round: [ftp, 1]\"></th><th data-bind=\"round: [orb, 1]\"></th><th data-bind=\"round: [drb, 1]\"></th><th data-bind=\"round: [trb, 1]\"></th><th data-bind=\"round: [ast, 1]\"></th><th data-bind=\"round: [tov, 1]\"></th><th data-bind=\"round: [stl, 1]\"></th><th data-bind=\"round: [blk, 1]\"></th><th data-bind=\"round: [pf, 1]\"></th><th data-bind=\"round: [pts, 1]\"></th><th data-bind=\"round: [per, 1]\"></th></tr>\n  </tfoot>\n</table>\n\n<h3>Shot Locations</h3>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n  <thead>\n    <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"At Rim\">At Rim</th><th colspan=\"3\" style=\"text-align: center\" title=\"Low Post\">Low Post</th><th colspan=\"3\" style=\"text-align: center\" title=\"Mid-Range\">Mid-Range</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th></tr>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th></tr>\n  </thead>\n  <tbody data-bind=\"foreach: player.stats\">\n    <tr><td><a href=\"#\" data-bind=\"text: season\"></a></td><td><a data-bind=\"text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}\"></a></td><td data-bind=\"text: age\"></td><td data-bind=\"text: gp\"></td><td data-bind=\"text: gs\"></td><td data-bind=\"round: [min, 1]\"></td><td data-bind=\"round: [fgAtRim, 1]\"></td><td data-bind=\"round: [fgaAtRim, 1]\"></td><td data-bind=\"round: [fgpAtRim, 1]\"></td><td data-bind=\"round: [fgLowPost, 1]\"></td><td data-bind=\"round: [fgaLowPost, 1]\"></td><td data-bind=\"round: [fgpLowPost, 1]\"></td><td data-bind=\"round: [fgMidRange, 1]\"></td><td data-bind=\"round: [fgaMidRange, 1]\"></td><td data-bind=\"round: [fgpMidRange, 1]\"></td><td data-bind=\"round: [tp, 1]\"></td><td data-bind=\"round: [tpa, 1]\"></td><td data-bind=\"round: [tpp, 1]\"></td></tr>\n  </tbody>\n  <tfoot data-bind=\"with: player.careerStats\">\n    <tr><th>Career</th><th></th><th></th><th data-bind=\"text: gp\"></th><th data-bind=\"text: gs\"></th><th data-bind=\"round: [min, 1]\"></th><th data-bind=\"round: [fgAtRim, 1]\"></th><th data-bind=\"round: [fgaAtRim, 1]\"></th><th data-bind=\"round: [fgpAtRim, 1]\"></th><th data-bind=\"round: [fgLowPost, 1]\"></th><th data-bind=\"round: [fgaLowPost, 1]\"></th><th data-bind=\"round: [fgpLowPost, 1]\"></th><th data-bind=\"round: [fgMidRange, 1]\"></th><th data-bind=\"round: [fgaMidRange, 1]\"></th><th data-bind=\"round: [fgpMidRange, 1]\"></th><th data-bind=\"round: [tp, 1]\"></th><th data-bind=\"round: [tpa, 1]\"></th><th data-bind=\"round: [tpp, 1]\"></th></tr>\n  </tfoot>\n</table>\n\n<h2>Playoffs</h2>\n<h3>Stats</h3>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n  <thead>\n    <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n  </thead>\n  <tbody data-bind=\"foreach: player.statsPlayoffs\">\n    <tr><td><a href=\"#\" data-bind=\"text: season\"></a></td><td><a data-bind=\"text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}\"></a></td><td data-bind=\"text: age\"></td><td data-bind=\"text: gp\"></td><td data-bind=\"text: gs\"></td><td data-bind=\"round: [min, 1]\"></td><td data-bind=\"round: [fg, 1]\"></td><td data-bind=\"round: [fga, 1]\"></td><td data-bind=\"round: [fgp, 1]\"></td><td data-bind=\"round: [tp, 1]\"></td><td data-bind=\"round: [tpa, 1]\"></td><td data-bind=\"round: [tpp, 1]\"></td><td data-bind=\"round: [ft, 1]\"></td><td data-bind=\"round: [fta, 1]\"></td><td data-bind=\"round: [ftp, 1]\"></td><td data-bind=\"round: [orb, 1]\"></td><td data-bind=\"round: [drb, 1]\"></td><td data-bind=\"round: [trb, 1]\"></td><td data-bind=\"round: [ast, 1]\"></td><td data-bind=\"round: [tov, 1]\"></td><td data-bind=\"round: [stl, 1]\"></td><td data-bind=\"round: [blk, 1]\"></td><td data-bind=\"round: [pf, 1]\"></td><td data-bind=\"round: [pts, 1]\"></td><td data-bind=\"round: [per, 1]\"></td></tr>\n  </tbody>\n  <tfoot data-bind=\"with: player.careerStatsPlayoffs\">\n    <tr><th>Career</th><th></th><th></th><th data-bind=\"text: gp\"></th><th data-bind=\"text: gs\"></th><th data-bind=\"round: [min, 1]\"></th><th data-bind=\"round: [fg, 1]\"></th><th data-bind=\"round: [fga, 1]\"></th><th data-bind=\"round: [fgp, 1]\"></th><th data-bind=\"round: [tp, 1]\"></th><th data-bind=\"round: [tpa, 1]\"></th><th data-bind=\"round: [tpp, 1]\"></th><th data-bind=\"round: [ft, 1]\"></th><th data-bind=\"round: [fta, 1]\"></th><th data-bind=\"round: [ftp, 1]\"></th><th data-bind=\"round: [orb, 1]\"></th><th data-bind=\"round: [drb, 1]\"></th><th data-bind=\"round: [trb, 1]\"></th><th data-bind=\"round: [ast, 1]\"></th><th data-bind=\"round: [tov, 1]\"></th><th data-bind=\"round: [stl, 1]\"></th><th data-bind=\"round: [blk, 1]\"></th><th data-bind=\"round: [pf, 1]\"></th><th data-bind=\"round: [pts, 1]\"></th><th data-bind=\"round: [per, 1]\"></th></tr>\n  </tfoot>\n</table>\n\n<h3>Shot Locations</h3>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n  <thead>\n    <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"At Rim\">At Rim</th><th colspan=\"3\" style=\"text-align: center\" title=\"Low Post\">Low Post</th><th colspan=\"3\" style=\"text-align: center\" title=\"Mid-Range\">Mid-Range</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th></tr>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th></tr>\n  </thead>\n  <tbody data-bind=\"foreach: player.statsPlayoffs\">\n    <tr><td><a href=\"#\" data-bind=\"text: season\"></a></td><td><a data-bind=\"text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}\"></a></td><td data-bind=\"text: age\"></td><td data-bind=\"text: gp\"></td><td data-bind=\"text: gs\"></td><td data-bind=\"round: [min, 1]\"></td><td data-bind=\"round: [fgAtRim, 1]\"></td><td data-bind=\"round: [fgaAtRim, 1]\"></td><td data-bind=\"round: [fgpAtRim, 1]\"></td><td data-bind=\"round: [fgLowPost, 1]\"></td><td data-bind=\"round: [fgaLowPost, 1]\"></td><td data-bind=\"round: [fgpLowPost, 1]\"></td><td data-bind=\"round: [fgMidRange, 1]\"></td><td data-bind=\"round: [fgaMidRange, 1]\"></td><td data-bind=\"round: [fgpMidRange, 1]\"></td><td data-bind=\"round: [tp, 1]\"></td><td data-bind=\"round: [tpa, 1]\"></td><td data-bind=\"round: [tpp, 1]\"></td></tr>\n  </tbody>\n  <tfoot data-bind=\"with: player.careerStatsPlayoffs\">\n    <tr><th>Career</th><th></th><th></th><th data-bind=\"text: gp\"></th><th data-bind=\"text: gs\"></th><th data-bind=\"round: [min, 1]\"></th><th data-bind=\"round: [fgAtRim, 1]\"></th><th data-bind=\"round: [fgaAtRim, 1]\"></th><th data-bind=\"round: [fgpAtRim, 1]\"></th><th data-bind=\"round: [fgLowPost, 1]\"></th><th data-bind=\"round: [fgaLowPost, 1]\"></th><th data-bind=\"round: [fgpLowPost, 1]\"></th><th data-bind=\"round: [fgMidRange, 1]\"></th><th data-bind=\"round: [fgaMidRange, 1]\"></th><th data-bind=\"round: [fgpMidRange, 1]\"></th><th data-bind=\"round: [tp, 1]\"></th><th data-bind=\"round: [tpa, 1]\"></th><th data-bind=\"round: [tpp, 1]\"></th></tr>\n  </tfoot>\n</table>\n\n<h2>Ratings</h2>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_ratings\">\n  <thead>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th><th>Skills</th></tr>\n  </thead>\n  <tbody data-bind=\"foreach: player.ratings\">\n    <tr><td data-bind=\"text: season\"></td><td><!-- ko if: abbrev() --><a data-bind=\"text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}\"></a><!-- /ko --></td><td data-bind=\"text: age\"></td><td data-bind=\"text: ovr\"></td><td data-bind=\"text: pot\"></td><td data-bind=\"text: hgt\"></td><td data-bind=\"text: stre\"></td><td data-bind=\"text: spd\"></td><td data-bind=\"text: jmp\"></td><td data-bind=\"text: endu\"></td><td data-bind=\"text: ins\"></td><td data-bind=\"text: dnk\"></td><td data-bind=\"text: ft\"></td><td data-bind=\"text: fg\"></td><td data-bind=\"text: tp\"></td><td data-bind=\"text: blk\"></td><td data-bind=\"text: stl\"></td><td data-bind=\"text: drb\"></td><td data-bind=\"text: pss\"></td><td data-bind=\"text: reb\"></td><td><span class=\"skills_alone\" data-bind=\"skillsBlock: skills\"></span></td></tr>\n  </tbody>\n</table>\n\n<h2>Awards</h2>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-nonfluid table-striped table-bordered table-condensed\" id=\"player-awards\" data-bind=\"visible: player.awards().length > 0\">\n  <thead>\n    <tr><th>Season</th><th>Award</th></tr>\n  </thead>\n  <tbody data-bind=\"foreach: player.awards\">\n    <tr><td data-bind=\"text: season\"></td><td data-bind=\"text: type\"></td></tr>\n  </tbody>\n</table>\n<p data-bind=\"visible: player.awards().length === 0\">None.</p>\n\n<h2>Salaries</h2>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-nonfluid table-striped table-bordered table-condensed\" id=\"player-salaries\">\n  <thead>\n    <tr><th>Season</th><th>Amount</th></tr>\n  </thead>\n  <tbody data-bind=\"foreach: player.salaries\">\n    <tr><td data-bind=\"text: season\"></td><td data-bind=\"currency: [amount, 'M']\"></td></tr>\n  </tbody>\n  <tfoot>\n    <tr><th>Total</th><th data-bind=\"currency: [player.salariesTotal, 'M']\"></th></tr>\n  </tfoot>\n</table>";
  });
templates['teamShotLocations'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form id=\"team-shot-locations-dropdown\" class=\"form-inline pull-right\"></form>\n\n<h1>Team Shot Locations <span data-bind=\"newWindow: []\"></span></h1>\n<p>More: <a data-bind=\"attrLeagueUrl: {href: ['team_stats', season]}\">Main Stats</a> | <a data-bind=\"attrLeagueUrl: {href: ['team_stat_dists', season]}\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"team-shot-locations\">\n<thead>\n  <tr><th colspan=\"4\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"At Rim\">At Rim</th><th colspan=\"3\" style=\"text-align: center\" title=\"Low Post\">Low Post</th><th colspan=\"3\" style=\"text-align: center\" title=\"Mid-Range\">Mid-Range</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th></tr>\n  <tr><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Won\">W</th><th title=\"Lost\">L</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th></tr>\n</thead>\n</table>\n</p>";
  });
})();