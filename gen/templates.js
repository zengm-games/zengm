(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['boxScore'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, self=this, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n  <h3><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/"
    + escapeExpression(((stack1 = ((stack1 = depth1.game),stack1 == null || stack1 === false ? stack1 : stack1.season)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">";
  if (stack2 = helpers.region) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.region; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " ";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></h2>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n  <thead>\n    <tr><th>Name</th><th>Pos</th><th>Min</th><th>FG</th><th>3Pt</th><th>FT</th><th>Off</th><th>Reb</th><th>Ast</th><th>TO</th><th>Stl</th><th>Blk</th><th>PF</th><th>Pts</th></tr>\n  </thead>\n  <tbody>\n  ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program2, data, depth1),data:data};
  if (stack2 = helpers.players) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.players; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.players) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </tbody>\n  <tfoot>\n    <tr><td>Total</td><td></td><td>";
  if (stack2 = helpers.min) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.min; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.fg) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.fg; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.fga) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.fga; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.tp) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.tp; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.tpa) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.tpa; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.ft) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ft; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.fta) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.fta; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.orb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.orb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.trb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.trb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.ast) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ast; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.tov) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.tov; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.stl) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.stl; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.blk) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.blk; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pf) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pf; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pts) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pts; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n  </tfoot>\n  </table>\n";
  return buffer;
  }
function program2(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n    <tr";
  stack1 = helpers['if'].call(depth0, depth0.separator, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.skills_block),stack1 ? stack1.call(depth0, depth0.skills, options) : helperMissing.call(depth0, "skills_block", depth0.skills, options)))
    + "</td><td>";
  if (stack2 = helpers.pos) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pos; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.min, 1, options) : helperMissing.call(depth0, "round", depth0.min, 1, options)))
    + "</td><td>";
  if (stack2 = helpers.fg) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.fg; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.fga) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.fga; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.tp) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.tp; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.tpa) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.tpa; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.ft) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ft; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.fta) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.fta; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.orb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.orb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.trb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.trb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.ast) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ast; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.tov) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.tov; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.stl) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.stl; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.blk) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.blk; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pf) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pf; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pts) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pts; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n  ";
  return buffer;
  }
function program3(depth0,data) {
  
  
  return " class=\"separator\"";
  }

  buffer += "<h2><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
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
    + ", <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.season)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.lost)),stack1 == null || stack1 === false ? stack1 : stack1.pts)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  if (stack2 = helpers.overtime) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.overtime; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h2>\n";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.game),stack1 == null || stack1 === false ? stack1 : stack1.teams)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n";
  return buffer;
  });
templates['draftSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/draft\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"draft-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Draft Summary ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"draft-results\">\n  <thead>\n    <tr><th colspan=\"3\"></th><th colspan=\"5\" style=\"text-align: center\">At Draft</th><th colspan=\"5\" style=\"text-align: center\">Current</th><th colspan=\"5\" style=\"text-align: center\">Career Stats</th></tr>\n    <tr><th>Pick</th><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Skills</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Skills</th><th title=\"Games Played\">GP</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">PPG</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n  </thead>\n  </table>\n</p>\n";
  return buffer;
  });
templates['leagueLayout'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"contentwrapper\">\n  <div id=\"league_content\">\n  </div>\n</div>\n\n<div id=\"league_menu\" data-lid=\"";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n  <div class=\"well sidebar-nav\">\n    <ul class=\"nav nav-list\" id=\"league_sidebar\">\n      <li id=\"nav_league_dashboard\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Dashboard</a></li>\n      <li class=\"nav-header\">League</li>\n      <li id=\"nav_standings\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/standings\">Standings</a></li>\n      <li id=\"nav_playoffs\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/playoffs\">Playoffs</a></li>\n      <li id=\"nav_finances\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/finances\">Finances</a></li>\n      <li id=\"nav_history\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/history\">History</a></li>\n      <li class=\"nav-header\">Team</li>\n      <li id=\"nav_roster\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/roster\">Roster</a></li>\n      <li id=\"nav_schedule\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/schedule\">Schedule</a></li>\n      <li id=\"nav_team_history\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_history\">History</a></li>\n      <li class=\"nav-header\">Players</li>\n      <li id=\"nav_free_agents\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/free_agents\">Free Agents</a></li>\n      <li id=\"nav_trade\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/trade\">Trade</a></li>\n      <li id=\"nav_draft\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/draft\">Draft</a></li>\n      <li class=\"nav-header\">Stats</li>\n      <li id=\"nav_game_log\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/game_log\">Game Log</a></li>\n      <li id=\"nav_leaders\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/leaders\">League Leaders</a></li>\n      <li id=\"nav_player_ratings\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_ratings\">Player Ratings</a></li>\n      <li id=\"nav_player_stats\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_stats\">Player Stats</a></li>\n      <li id=\"nav_team_stats\"><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_stats\">Team Stats</a></li>\n    </ul>\n  </div>\n</div>\n";
  return buffer;
  });
templates['freeAgents'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h1>Free Agents ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"free-agents\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>\n";
  return buffer;
  });
templates['leaders'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1, options;
  buffer += "\n    ";
  stack1 = helpers['if'].call(depth0, depth0.newRow, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    <div class=\"span4\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed leaders\">\n      <thead>\n        <tr><th>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</th><th title=\"";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.stat) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.stat; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</th></tr>\n      </thead>\n      <tbody>\n        ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth1),data:data};
  if (stack1 = helpers.data) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.data; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.data) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n      </table>\n    </div>\n  ";
  return buffer;
  }
function program5(depth0,data) {
  
  
  return "\n</div>\n<p></p>\n<div class=\"row-fluid\">\n    ";
  }

function program7(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n          <tr";
  stack1 = helpers['if'].call(depth0, depth0.userTeam, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td>";
  if (stack1 = helpers['i']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['i']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ". <a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.skills_block),stack1 ? stack1.call(depth0, ((stack1 = depth0.ratings),stack1 == null || stack1 === false ? stack1 : stack1.skills), options) : helperMissing.call(depth0, "skills_block", ((stack1 = depth0.ratings),stack1 == null || stack1 === false ? stack1 : stack1.skills), options)))
    + ", <a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/"
    + escapeExpression(((stack1 = depth2.season),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.stat, 1, options) : helperMissing.call(depth0, "round", depth0.stat, 1, options)))
    + "</tr>\n        ";
  return buffer;
  }
function program8(depth0,data) {
  
  
  return " class=\"alert-info\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/leaders\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"leaders-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>League Leaders ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<p>Only eligible players are shown (a player shooting 2 for 2 on the season is not eligible for the league lead in FG%).</p>\n\n<p></p>\n<div class=\"row-fluid\">\n  ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0),data:data};
  if (stack1 = helpers.categories) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.categories; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.categories) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>";
  return buffer;
  });
templates['browserError'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Error</h1>\n\n<p>Your browser is not modern enough to run Basketball GM.</p>\n\n<p>Currently, <a href=\"http://www.firefox.com/\">Mozilla Firefox</a> and <a href=\"http://www.google.com/chrome/\">Google Chrome</a> work best with Basketball GM.</p>";
  });
templates['playerStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"player-stats-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Stats ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_shot_locations\">Shot Locations</a> | <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_player_stats\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player-stats\">\n<thead>\n  <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n</thead>\n</table>\n</p>";
  return buffer;
  });
templates['trade'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n          <option value=\"";
  if (stack1 = helpers.abbrev) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.region) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</option>\n        ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<h1>Trade ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<div class=\"row-fluid\">\n  <div class=\"span7\">\n    <form id=\"rosters\">\n      <p><select id=\"trade-select-team\" name=\"team\" class=\"team form-inline\">\n        ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.teams) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </select>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster-other\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n      </thead>\n      </table>\n      </p>\n\n      <h2>";
  if (stack1 = helpers.userTeamName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.userTeamName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n      <p>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster-user\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n      </thead>\n      </table>\n      </p>\n    </form>\n  </div>\n  <div class=\"span5\" id=\"trade-summary\">\n    ";
  if (stack1 = helpers.tradeSummary) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.tradeSummary; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>";
  return buffer;
  });
templates['tradeSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n        <li><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a> ($";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.contractAmount, 2, options) : helperMissing.call(depth0, "round", depth0.contractAmount, 2, options)))
    + "M)</li>\n      ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<p class=\"alert alert-error\"><strong>Warning!</strong> "
    + escapeExpression(((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.warning)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</p>";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<p class=\"alert alert-info\">";
  if (stack1 = helpers.message) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.message; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n";
  return buffer;
  }

function program7(depth0,data) {
  
  
  return " disabled=\"disabled\"";
  }

  buffer += "<h3>Trade Summary</h3>\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h4>"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h4>\n    <h5>Trade Away:</h5>\n    <ul>\n      ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.trade)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      <li>$";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options)))
    + "M Total</li>\n    </ul>\n    <h5>Receive:</h5>\n    <ul>\n      ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.trade)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      <li>$";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options)))
    + "M Total</li>\n    </ul>\n    <h5>Payroll after trade: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.payrollAfterTrade), 2, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.payrollAfterTrade), 2, options)))
    + "M</h5>\n    <h5>Salary cap: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.salaryCap), 2, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.salaryCap), 2, options)))
    + "M</h5>\n  </div>\n  <div class=\"span6\">\n    <h4>"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h4>\n    <h5>Trade Away:</h5>\n    <ul>\n      ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.trade)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      <li>$";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options)))
    + "M Total</li>\n    </ul>\n    <h5>Receive:</h5>\n    <ul>\n      ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.trade)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      <li>$";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.total), 2, options)))
    + "M Total</li>\n    </ul>\n    <h5>Payroll after trade: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.payrollAfterTrade), 2, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.teams)),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.payrollAfterTrade), 2, options)))
    + "M</h5>\n    <h5>Salary cap: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.salaryCap), 2, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.salaryCap), 2, options)))
    + "M</h5>\n  </div>\n</div>\n\n<br>\n";
  stack2 = helpers['if'].call(depth0, ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.warning), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n";
  stack2 = helpers['if'].call(depth0, depth0.message, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n<center>\n  <form action=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/trade\" method=\"POST\" id=\"propose-trade\">\n    <input type=\"hidden\" name=\"propose\" value=\"1\">\n    <button type=\"submit\" class=\"btn btn-large btn-primary\"";
  stack2 = helpers['if'].call(depth0, ((stack1 = depth0.summary),stack1 == null || stack1 === false ? stack1 : stack1.disablePropose), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">Propose Trade</button>\n  </form>\n\n  <form action=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/trade\" method=\"POST\" id=\"clear-trade\">\n    <input type=\"hidden\" name=\"clear\" value=\"1\">\n    <button type=\"submit\" class=\"btn\">Clear Trade</button>\n  </form>\n</center>\n";
  return buffer;
  });
templates['leagueDashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var stack1;
  stack1 = helpers['if'].call(depth0, depth0.streakLong, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += ", ";
  if (stack1 = helpers.streakLong) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.streakLong; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1);
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n        <b>";
  if (stack1 = helpers.seriesTitle) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.seriesTitle; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</b><br>\n        ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 0, options) : helperMissing.call(depth0, "matchup", 0, 0, options)))
    + "<br>\n      ";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  if (stack1 = helpers.rank) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.rank; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "th place in conference<br>\n        (Top 8 teams make the playoffs)<br>\n      ";
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/playoffs\">» Playoffs</a>\n      ";
  return buffer;
  }

function program10(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/playoffs\">» Playoffs Projections</a>\n      ";
  return buffer;
  }

function program12(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        Next Game: ";
  stack1 = helpers.unless.call(depth0, depth0.nextGameHome, {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/roster/";
  if (stack1 = helpers.nextGameAbbrev) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.nextGameAbbrev; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.nextGameAbbrev) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.nextGameAbbrev; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a><br>\n      ";
  return buffer;
  }
function program13(depth0,data) {
  
  
  return "@";
  }

function program15(depth0,data) {
  
  
  return "No completed games yet this season.<br>";
  }

function program17(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        ";
  stack1 = helpers.unless.call(depth0, depth0.home, {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.oppAbbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.oppAbbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.oppAbbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.oppAbbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>, ";
  stack2 = helpers['if'].call(depth0, depth0.won, {hash:{},inverse:self.program(20, program20, data),fn:self.program(18, program18, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/game_log/"
    + escapeExpression(((stack1 = depth1.abbrev),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = depth1.season),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.gid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.pts) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pts; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.oppPts) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.oppPts; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2);
  if (stack2 = helpers.overtime) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.overtime; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a><br>\n      ";
  return buffer;
  }
function program18(depth0,data) {
  
  
  return "won";
  }

function program20(depth0,data) {
  
  
  return "lost";
  }

function program22(depth0,data) {
  
  
  return "None yet.<br>";
  }

function program24(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/"
    + escapeExpression(((stack1 = depth1.abbrev),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>: <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/standings/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.won) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.won; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.lost) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lost; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  stack2 = helpers['if'].call(depth0, depth0.extraText, {hash:{},inverse:self.noop,fn:self.programWithDepth(program25, data, depth1),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "<br>\n      ";
  return buffer;
  }
function program25(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2;
  buffer += ", <a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/playoffs/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.extraText) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.extraText; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  return buffer;
  }

function program27(depth0,data) {
  
  
  return "None.<br>";
  }

function program29(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>: ";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " yo, ";
  if (stack2 = helpers.ovr) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ovr; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " ovr, ";
  if (stack2 = helpers.pot) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pot; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " pot</span><br>\n      ";
  return buffer;
  }

function program31(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n        <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>: ";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " yo, $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.contractAmount, 2, options) : helperMissing.call(depth0, "round", depth0.contractAmount, 2, options)))
    + "M<br>\n        <span style=\"margin-left: 2em\">";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.pts, 1, options) : helperMissing.call(depth0, "round", depth0.pts, 1, options)))
    + " pts, ";
  if (stack2 = helpers.ovr) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ovr; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " ovr, ";
  if (stack2 = helpers.pot) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pot; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " pot</span><br>\n      ";
  return buffer;
  }

  buffer += "<h1>";
  if (stack1 = helpers.region) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " Dashboard ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<div class=\"row-fluid\">\n  <div class=\"span4\">\n    <h3>Current Record</h3>\n    <p>\n      ";
  if (stack1 = helpers.won) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.won; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "-";
  if (stack1 = helpers.lost) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lost; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1);
  stack1 = helpers.unless.call(depth0, depth0.playoffsStarted, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<br>\n      <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/standings\">» Standings</a>\n    </p>\n\n    <h3>Playoffs</h3>\n    <p>\n      ";
  stack1 = helpers['if'].call(depth0, depth0.showPlayoffSeries, {hash:{},inverse:self.program(6, program6, data),fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  stack1 = helpers['if'].call(depth0, depth0.playoffsStarted, {hash:{},inverse:self.program(10, program10, data),fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </p>\n\n    <h3>Recent Games</h3>\n    <p>\n      ";
  stack1 = helpers['if'].call(depth0, depth0.nextGameAbbrev, {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  stack1 = helpers.unless.call(depth0, depth0.recentGames, {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program17, data, depth0),data:data};
  if (stack1 = helpers.recentGames) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.recentGames; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.recentGames) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/game_log\">» Game Log</a><br>\n      <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/standings\">» Schedule</a>\n    </p>\n\n    <h3>Recent History</h3>\n    <p>\n      ";
  stack1 = helpers.unless.call(depth0, depth0.recentHistory, {hash:{},inverse:self.noop,fn:self.program(22, program22, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program24, data, depth0),data:data};
  if (stack1 = helpers.recentHistory) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.recentHistory; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.recentHistory) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_history\">» Team History</a><br>\n      <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/history\">» League History</a>\n    </p>\n\n  </div>\n  <div class=\"span4\">\n    <h3>Team Stats</h3>\n    <p>\n      Points: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.pts, 1, options) : helperMissing.call(depth0, "round", depth0.pts, 1, options)))
    + " (";
  if (stack2 = helpers.ptsRank) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ptsRank; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "th)<br>\n      Allowed: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.oppPts, 1, options) : helperMissing.call(depth0, "round", depth0.oppPts, 1, options)))
    + " (";
  if (stack2 = helpers.oppPtsRank) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.oppPtsRank; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "th)<br>\n      Rebounds: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.trb, 1, options) : helperMissing.call(depth0, "round", depth0.trb, 1, options)))
    + " (";
  if (stack2 = helpers.trbRank) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.trbRank; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "th)<br>\n      Assists: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.ast, 1, options) : helperMissing.call(depth0, "round", depth0.ast, 1, options)))
    + " (";
  if (stack2 = helpers.astRank) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.astRank; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "th)<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/team_stats\">» Team Stats</a>\n    </p>\n\n    <h3>Team Leaders</h3>\n    <p>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options)))
    + " pts<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options)))
    + " reb<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.teamLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options)))
    + " ast<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster\">» Full Roster</a>\n    </p>\n\n    <h3>League Leaders</h3>\n    <p>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>, <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.pts)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options)))
    + " pts<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>, <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.trb)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options)))
    + " reb<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>, <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.leagueLeaders),stack1 == null || stack1 === false ? stack1 : stack1.ast)),stack1 == null || stack1 === false ? stack1 : stack1.stat), 1, options)))
    + " ast<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/leaders\">» League Leaders</a><br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player_stats\">» Player Stats</a>\n    </p>\n  </div>\n  <div class=\"span4\">\n    <h3>Finances</h3>\n    <p>\n      Avg Attendance: ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.att, options) : helperMissing.call(depth0, "round", depth0.att, options)))
    + "<br>\n      Revenue (YTD): $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.revenue, 2, options) : helperMissing.call(depth0, "round", depth0.revenue, 2, options)))
    + "M<br>\n      Profit (YTD): $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.profit, 2, options) : helperMissing.call(depth0, "round", depth0.profit, 2, options)))
    + "M<br>\n      Cash: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.cash, 2, options) : helperMissing.call(depth0, "round", depth0.cash, 2, options)))
    + "M<br>\n      Payroll: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.payroll, 2, options) : helperMissing.call(depth0, "round", depth0.payroll, 2, options)))
    + "M<br>\n      Salary Cap: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.salaryCap, 2, options) : helperMissing.call(depth0, "round", depth0.salaryCap, 2, options)))
    + "M<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/finances\">» League Finances</a>\n    </p>\n\n    <h3>Top Free Agents</h3>\n    <p>\n      ";
  stack2 = helpers.unless.call(depth0, depth0.freeAgents, {hash:{},inverse:self.noop,fn:self.program(27, program27, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program29, data, depth0),data:data};
  if (stack2 = helpers.freeAgents) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.freeAgents; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.freeAgents) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      (You have ";
  if (stack2 = helpers.numRosterSpots) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.numRosterSpots; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " open roster spots)<br>\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/free_agents\">» Free Agents</a>\n    </p>\n\n    <h3>Expiring Contracts</h3>\n    <p>\n      ";
  stack2 = helpers.unless.call(depth0, depth0.expiring, {hash:{},inverse:self.noop,fn:self.program(27, program27, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program31, data, depth0),data:data};
  if (stack2 = helpers.expiring) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.expiring; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.expiring) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster\">» Full Roster</a>\n    </p>\n  </div>\n</div>";
  return buffer;
  });
templates['distTeamStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_team_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"dist-team-stats-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Team Stat Distributions ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_stats\">Main Stats</a> | <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_shot_locations\">Shot Locations</a></p>\n\n<p>These <a href=\"http://en.wikipedia.org/wiki/Box_plot\">box plots</a> show the league-wide distributions of team stats for the selected season. Black plots are for this league and blue plots are from the 2010-2011 NBA season, for comparison. The five vertical lines in each plot represent the minimum of the scale, the minimum, the first <a href=\"http://en.wikipedia.org/wiki/Quartile\">quartile</a>, the median, the third quartile, the maximum, and the maximum of the scale.</p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" id=\"dist-team-stats\">\n  <tbody></tbody>\n</table>\n</p>\n";
  return buffer;
  });
templates['standings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1, options;
  buffer += "\n  <h2>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n  <div class=\"row-fluid\">\n    <div class=\"span9\">\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program5, data, depth1),data:data};
  if (stack1 = helpers.divs) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.divs; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.divs) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </div>\n\n    <div class=\"span3\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n      <thead>\n        <tr><th width=\"100%\">Team</th><th align=\"right\">GB</th></tr>\n      </thead>\n      <tbody>\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program8, data, depth1),data:data};
  if (stack1 = helpers.teams) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n      </table>\n    </div>\n  </div>\n";
  return buffer;
  }
function program5(depth0,data,depth2) {
  
  var buffer = "", stack1, options;
  buffer += "\n          <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n          <thead>\n            <tr><th width=\"100%\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Home</th><th>Road</th><th>Div</th><th>Conf</th><th>Streak</th><th>L10</th></tr>\n          </thead>\n          <tbody>\n          ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program6, data, depth2),data:data};
  if (stack1 = helpers.teams) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n          </tbody>\n          </table>\n      ";
  return buffer;
  }
function program6(depth0,data,depth3) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n            <tr><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth3.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.region) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.region; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " ";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td>";
  if (stack2 = helpers.won) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.won; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.lost) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lost; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.roundWinp),stack1 ? stack1.call(depth0, depth0.winp, options) : helperMissing.call(depth0, "roundWinp", depth0.winp, options)))
    + "</td><td>";
  if (stack2 = helpers.gb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.wonHome) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.wonHome; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.lostHome) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lostHome; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.wonAway) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.wonAway; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.lostAway) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lostAway; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.wonDiv) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.wonDiv; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.lostDiv) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lostDiv; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.wonConf) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.wonConf; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.lostConf) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lostConf; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.streak) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.streak; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.lastTen) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lastTen; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n          ";
  return buffer;
  }

function program8(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <tr";
  stack1 = helpers['if'].call(depth0, depth0.separator, {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td>";
  if (stack1 = helpers.rank) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.rank; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ". <a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.region) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.region; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td align=\"right\">";
  if (stack2 = helpers.gb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n      ";
  return buffer;
  }
function program9(depth0,data) {
  
  
  return " class=\"separator\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/standings\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"standings-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Standings ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0),data:data};
  if (stack1 = helpers.confs) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.confs; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.confs) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  });
templates['playoffs'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

function program4(depth0,data) {
  
  
  return "<p>This is what the playoff matchups would be if the season ended right now.</p>";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/playoffs\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"playoffs-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Playoffs ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n";
  stack1 = helpers.unless.call(depth0, depth0.finalMatchups, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table-condensed\" width=\"100%\">\n<tbody>\n  <tr>\n    <td width=\"14.28%\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 0, options) : helperMissing.call(depth0, "matchup", 0, 0, options)))
    + "\n    </td>\n    <td rowspan=\"2\" width=\"14.28%\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 1, 0, options) : helperMissing.call(depth0, "matchup", 1, 0, options)))
    + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 2, 0, options) : helperMissing.call(depth0, "matchup", 2, 0, options)))
    + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 3, 0, options) : helperMissing.call(depth0, "matchup", 3, 0, options)))
    + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 2, 1, options) : helperMissing.call(depth0, "matchup", 2, 1, options)))
    + "\n    </td>\n    <td rowspan=\"2\" width=\"14.28%\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 1, 2, options) : helperMissing.call(depth0, "matchup", 1, 2, options)))
    + "\n    </td>\n    <td width=\"14.28%\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 4, options) : helperMissing.call(depth0, "matchup", 0, 4, options)))
    + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 1, options) : helperMissing.call(depth0, "matchup", 0, 1, options)))
    + "\n    </td>\n    <td>\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 5, options) : helperMissing.call(depth0, "matchup", 0, 5, options)))
    + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 2, options) : helperMissing.call(depth0, "matchup", 0, 2, options)))
    + "\n    </td>\n    <td rowspan=\"2\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 1, 1, options) : helperMissing.call(depth0, "matchup", 1, 1, options)))
    + "\n    </td>\n    <td rowspan=\"2\">\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 1, 3, options) : helperMissing.call(depth0, "matchup", 1, 3, options)))
    + "\n    </td>\n    <td>\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 6, options) : helperMissing.call(depth0, "matchup", 0, 6, options)))
    + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 3, options) : helperMissing.call(depth0, "matchup", 0, 3, options)))
    + "\n    </td>\n    <td>\n      ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.matchup),stack1 ? stack1.call(depth0, 0, 7, options) : helperMissing.call(depth0, "matchup", 0, 7, options)))
    + "\n    </td>\n  </tr>\n</tbody>\n</table>\n</p>\n";
  return buffer;
  });
templates['teamStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"team-stats-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Team Stats ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_shot_locations\">Shot Locations</a> | <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_team_stats\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"team-stats\">\n<thead>\n  <tr><th colspan=\"4\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"7\"></th></tr>\n  <tr><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Won\">W</th><th title=\"Lost\">L</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Opponent's Points\">OPts</th></tr>\n</thead>\n</table>\n</p>";
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
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1, options;
  buffer += "\n      <b>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</b><br>\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program5, data, depth1),data:data};
  if (stack1 = helpers.players) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;
  }
function program5(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a> (<a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/"
    + escapeExpression(((stack1 = depth2.season),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>)<br>\n      ";
  return buffer;
  }

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a> (overall rating: "
    + escapeExpression(((stack1 = ((stack1 = depth0.ratings),stack1 == null || stack1 === false ? stack1 : stack1.ovr)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "; age: ";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + ")<br>\n    ";
  return buffer;
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/history\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"history-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Season Summary ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<p></p>\n<div class=\"row-fluid\">\n  <div class=\"span4\">\n    <h4>League Champions</h4>\n    <p><strong><a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = depth0.champ),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.champ),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = depth0.champ),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></strong><br>\n    <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/playoffs/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">Playoffs Bracket</a></p>\n    <h4>Best Record</h4>\n    <p>East: <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.bre)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.bre)),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.bre)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> ("
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.bre)),stack1 == null || stack1 === false ? stack1 : stack1.won)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.bre)),stack1 == null || stack1 === false ? stack1 : stack1.lost)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")<br>\n    West: <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.brw)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.brw)),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.brw)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> ("
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.brw)),stack1 == null || stack1 === false ? stack1 : stack1.won)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "-"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.brw)),stack1 == null || stack1 === false ? stack1 : stack1.lost)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")<br></p>\n    <h4>Most Valueable Player</h4>\n    <p><strong><a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></strong> (<a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>)<br>\n    ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options)))
    + " pts, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options)))
    + " reb, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.mvp)),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options)))
    + " ast</p>\n    <h4>Defensive Player of the Year</h4>\n    <p><strong><a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></strong> (<a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>)<br>\n    ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options)))
    + " reb, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.blk), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.blk), 1, options)))
    + " blk, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.stl), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.dpoy)),stack1 == null || stack1 === false ? stack1 : stack1.stl), 1, options)))
    + " stl</p>\n    <h4>Sixth Man of the Year</h4>\n    <p><strong><a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></strong> (<a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>)<br>\n    ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options)))
    + " pts, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options)))
    + " reb, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.smoy)),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options)))
    + " ast</p>\n    <h4>Rookie of the Year</h4>\n    <p><strong><a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></strong> (<a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>)<br>\n    ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options)))
    + " pts, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options)))
    + " reb, ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options) : helperMissing.call(depth0, "round", ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.roy)),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options)))
    + " ast</p>\n  </div>\n  <div class=\"span4\">\n    <h4>All-League Teams</h4>\n    ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.allLeague)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </div>\n  <div class=\"span4\">\n    <h4>All-Defensive Teams</h4>\n    ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.awards),stack1 == null || stack1 === false ? stack1 : stack1.allDefensive)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </div>\n</div>\n<div class=\"row-fluid\">\n  <div class=\"span12\">\n    <h4>Retired Players</h4>\n    ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth0),data:data};
  if (stack2 = helpers.retiredPlayers) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.retiredPlayers; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.retiredPlayers) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </div>\n</div>";
  return buffer;
  });
templates['playButton'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <li><a href=\"";
  if (stack1 = helpers.url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n      ";
  return buffer;
  }

  buffer += "<ul class=\"nav btn btn-primary\">\n  <li class=\"dropdown\">\n    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">Play <b class=\"caret\"></b></a>\n    <ul class=\"dropdown-menu\">\n      ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.options) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.options; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.options) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </ul>\n  </li>\n</ul>\n";
  return buffer;
  });
templates['schedule'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <li><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teams),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teams),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teams),stack1 == null || stack1 === false ? stack1 : stack1[0])),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>\n  ";
  if (stack2 = helpers.vsat) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.vsat; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\n  <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teams),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.abbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teams),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.teams),stack1 == null || stack1 === false ? stack1 : stack1[1])),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>\n";
  return buffer;
  }

  buffer += "<h1>Upcoming Schedule ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<ol>\n";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data};
  if (stack1 = helpers.games) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.games; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.games) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ol>\n";
  return buffer;
  });
templates['error'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h1>Error</h1>\n\n";
  if (stack1 = helpers.error) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.error; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n";
  return buffer;
  });
templates['newLeague'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.tid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.tid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.region) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</option>\n    ";
  return buffer;
  }

  buffer += "<h1>Create New League</h1>\n<p>\n<form action=\"/new_league\" method=\"POST\">\n  <label>League name</label>\n  <input type=\"text\" name=\"name\" value=\"";
  if (stack1 = helpers.randomName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.randomName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  <label>Which team do you want to manage?</label>\n  <select name=\"tid\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.teams) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <!--<label><select name=\"players\">\n    <option value=\"random\" selected=\"selected\">Random Players</option>\n    <option value=\"nba2012\">2012 NBA Players</option>\n  </select></label>--><br>\n  <button type=\"submit\" class=\"btn\">Create New League</button>  \n</form>\n</p>";
  return buffer;
  });
templates['dashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <li>\n      <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" class=\"btn league\" title=\"";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ". ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><strong>";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ". ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "<br></strong><span class=\"clearfix\">";
  if (stack1 = helpers.region) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.teamName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.teamName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "<br></span><span class=\"clearfix\">";
  if (stack1 = helpers.phaseText) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.phaseText; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></a>\n      <form action=\"/delete_league\" method=\"POST\" class=\"delete\"><input type=\"hidden\" name=\"lid\" value=\"";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><button class=\"btn btn-mini\">Delete</button></form>\n    </li>\n  ";
  return buffer;
  }

  buffer += "<ul class=\"dashboard_league\">\n  ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.leagues) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.leagues; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.leagues) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n  <li class=\"dashboard_league_new\"><a href=\"/new_league\" class=\"btn btn-primary league\"><h2 style=\"\">Create new league</h2></a></li>\n</ul>";
  return buffer;
  });
templates['playerShotLocations'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_shot_locations\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"player-shot-locations-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Shot Locations ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_stats\">Main Stats</a> | <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_player_stats\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player-shot-locations\">\n<thead>\n  <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"At Rim\">At Rim</th><th colspan=\"3\" style=\"text-align: center\" title=\"Low Post\">Low Post</th><th colspan=\"3\" style=\"text-align: center\" title=\"Mid-Range\">Mid-Range</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th></tr>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th></tr>\n</thead>\n</table>\n</p>";
  return buffer;
  });
templates['negotiation'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <p>You are allowed to go over the salary cap to make this deal because you are resigning <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> to a contract extension. <strong>If you do not come to an agreement here, <a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> will become a free agent.</strong> He will then be able to sign with any team, and you won't be able to go over the salary cap to sign him.</p>\n";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <p>You are not allowed to go over the salary cap to make this deal because <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> is a free agent.</p>\n";
  return buffer;
  }

  buffer += "<h1>Contract Negotiation ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n";
  stack1 = helpers['if'].call(depth0, depth0.resigning, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2>"
    + escapeExpression(((stack1 = ((stack1 = depth0.team),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = depth0.team),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h2>\n    <p>Current Payroll: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.payroll, 2, options) : helperMissing.call(depth0, "round", depth0.payroll, 2, options)))
    + "M</p>\n    <p>Salary Cap: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.salaryCap, 2, options) : helperMissing.call(depth0, "round", depth0.salaryCap, 2, options)))
    + "M</p>\n    <h2>Your Proposal</h2>\n    <form action=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/negotiation/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"text\" name=\"teamYears\" id=\"teamYears\" class=\"span1\" value=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.negotiation),stack1 == null || stack1 === false ? stack1 : stack1.teamYears)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"> years\n      <p><div class=\"input-prepend input-append\">\n        <span class=\"add-on\">$</span><input type=\"text\" name=\"teamAmount\" id=\"teamAmount\" class=\"span5\" value=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.negotiation),stack1 == null || stack1 === false ? stack1 : stack1.teamAmount)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"><span class=\"add-on\">M</span> per year\n      </div></p>\n      <button type=\"submit\" class=\"btn btn-large btn-primary\">Submit Proposal</button>  \n    </form>\n\n    <form action=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/negotiation/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"cancel\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-danger\">Can't reach a deal? End negotiation</button>\n    </form>\n\n  </div>\n  <div class=\"span6\">\n    <h2><a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></h2>\n    <p>Overal: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.ovr)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</p>\n    <p>Potential: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pot)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</p>\n    <h2>Player Proposal</h2>\n    <p>"
    + escapeExpression(((stack1 = ((stack1 = depth0.negotiation),stack1 == null || stack1 === false ? stack1 : stack1.playerYears)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " years (through "
    + escapeExpression(((stack1 = ((stack1 = depth0.negotiation),stack1 == null || stack1 === false ? stack1 : stack1.playerExpiration)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</p>\n    <p>$";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.negotiation),stack1 == null || stack1 === false ? stack1 : stack1.playerAmount), 3, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.negotiation),stack1 == null || stack1 === false ? stack1 : stack1.playerAmount), 3, options)))
    + "M per year</p>\n    <form action=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/negotiation/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"accept\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-large btn-primary\" id=\"accept\">Accept Player Proposal</button>\n    </form>\n  </div>\n</div>\n";
  return buffer;
  });
templates['finances'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


  buffer += "<h1>Finances ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<p>The current salary cap is <strong>$";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.salaryCap, 2, options) : helperMissing.call(depth0, "round", depth0.salaryCap, 2, options)))
    + "M</strong>.</p>\n\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"finances\">\n  <thead>\n    <tr><th>Team</th><th>Avg Attendance</th><th>Revenue (YTD)</th><th>Profit (YTD)</th><th>Cash</th><th>Payroll</th></tr>\n  </thead>\n  </table>\n</p>";
  return buffer;
  });
templates['negotiationList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<h1>Players With Expiring Contracts</h1>\n\n<p>You are allowed to go over the salary cap to resign your players before they become free agents. If you do not resign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.</p>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"negotiation-list\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>";
  });
templates['distPlayerRatings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_player_ratings\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"dist-player-ratings-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Rating Distributions ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_ratings\">Main Ratings</a></p>\n\n<p>These <a href=\"http://en.wikipedia.org/wiki/Box_plot\">box plots</a> show the league-wide distributions of player ratings for all active players in the selected season. The five vertical lines in each plot represent the minimum of the scale (0), the minimum, the first <a href=\"http://en.wikipedia.org/wiki/Quartile\">quartile</a>, the median, the third quartile, the maximum, and the maximum of the scale (100).</p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" id=\"dist-player-ratings\">\n  <tbody></tbody>\n</table>\n</p>\n";
  return buffer;
  });
templates['deleteLeague'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h1>Delete League ";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "?</h1>\n\n<p>Are you <em>absolutely</em> sure you want to delete League ";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "? You will <em>permanently</em> lose any record of all ";
  if (stack1 = helpers.numSeasons) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.numSeasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " seasons, ";
  if (stack1 = helpers.numPlayers) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.numPlayers; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " players, and ";
  if (stack1 = helpers.numGames) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.numGames; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " games from this league (well... unless you have backup somewhere).</p>\n\n<form action=\"/delete_league\" method=\"post\" style=\"float: left; margin-right: 1em\">\n  <input type=\"hidden\" name=\"lid\" value=\"";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n  <input type=\"hidden\" name=\"confirm\" value=\"1\">\n  <button class=\"btn btn-danger\">Yes, I am sure! Delete League ";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ".</button>\n</form>\n<form action=\"/\" method=\"get\">\n  <button class=\"btn\">Cancel</button>\n</form>";
  return buffer;
  });
templates['playerRatings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_ratings\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"player-ratings-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Ratings ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_player_ratings\">Rating Distributions</a></p>\n\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player-ratings\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th></tr>\n</thead>\n</table>\n</p>";
  return buffer;
  });
templates['gameLogList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, self=this, functionType="function", escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n    <tr";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/game_log/"
    + escapeExpression(((stack1 = depth1.abbrev),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = depth1.season),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.gid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  stack2 = helpers.unless.call(depth0, depth0.home, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  if (stack2 = helpers.oppAbbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.oppAbbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/game_log/"
    + escapeExpression(((stack1 = depth1.abbrev),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = depth1.season),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.gid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  stack2 = helpers['if'].call(depth0, depth0.won, {hash:{},inverse:self.program(8, program8, data),fn:self.program(6, program6, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</a></td><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/game_log/"
    + escapeExpression(((stack1 = depth1.abbrev),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/"
    + escapeExpression(((stack1 = depth1.season),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.gid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.pts) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pts; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.oppPts) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.oppPts; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2);
  if (stack2 = helpers.overtime) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.overtime; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td></tr>\n  ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " class=\"alert-info\"";
  }

function program4(depth0,data) {
  
  
  return "@";
  }

function program6(depth0,data) {
  
  
  return "W";
  }

function program8(depth0,data) {
  
  
  return "L";
  }

  buffer += "<table id=\"game_log_list\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n<thead>\n  <tr><th>Opp</th><th>W/L</th><th>Score</th></tr>\n</thead>\n<tbody>\n  ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data};
  if (stack1 = helpers.games) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.games; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.games) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</tbody>\n</table>\n";
  return buffer;
  });
templates['gameLog'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.abbrev) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.region) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/game_log\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"game-log-select-team\" name=\"team\" class=\"team\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.teams) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <select id=\"game-log-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Game Log ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<p>\n<div class=\"row-fluid\">\n  <div class=\"span9\">\n    ";
  if (stack1 = helpers.boxScore) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.boxScore; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n\n  <div class=\"span3\">\n    ";
  if (stack1 = helpers.gameLogList) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.gameLogList; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>\n</p>\n";
  return buffer;
  });
templates['roster'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.abbrev) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.region) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n  <p>";
  if (stack1 = helpers.numRosterSpots) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.numRosterSpots; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " open roster spots<br>\n  Payroll: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.payroll, 2, options) : helperMissing.call(depth0, "round", depth0.payroll, 2, options)))
    + "M<br>\n  Salary cap: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.salaryCap, 2, options) : helperMissing.call(depth0, "round", depth0.salaryCap, 2, options)))
    + "M<br>\n  Cash: $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.team),stack1 == null || stack1 === false ? stack1 : stack1.cash), 2, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.team),stack1 == null || stack1 === false ? stack1 : stack1.cash), 2, options)))
    + "M (used for buying out players)</p>\n";
  return buffer;
  }

function program8(depth0,data) {
  
  
  return "\n  <p>Drag and drop row handles to move players between the starting lineup (<span class=\"roster_gs\">&#9632;</span>) and the bench (<span class=\"roster_bench\">&#9632;</span>).</p>\n  <p><button class=\"btn\" id=\"roster-auto-sort\">Auto sort roster</button></p>\n";
  }

function program10(depth0,data) {
  
  
  return "<th></th>";
  }

function program12(depth0,data) {
  
  
  return "<th>Contract</th>";
  }

function program14(depth0,data) {
  
  
  return "<th>Release</th><th>Buy out</th>";
  }

function program16(depth0,data) {
  
  
  return "<th>Trade For</th>";
  }

function program18(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n    <tr id=\"roster_";
  if (stack1 = helpers.pid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.separator, {hash:{},inverse:self.noop,fn:self.program(19, program19, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  stack1 = helpers['if'].call(depth0, depth1.sortable, {hash:{},inverse:self.noop,fn:self.program(21, program21, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.skills_block),stack1 ? stack1.call(depth0, ((stack1 = depth0.ratings),stack1 == null || stack1 === false ? stack1 : stack1.skills), options) : helperMissing.call(depth0, "skills_block", ((stack1 = depth0.ratings),stack1 == null || stack1 === false ? stack1 : stack1.skills), options)))
    + "</td><td>";
  if (stack2 = helpers.pos) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pos; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>"
    + escapeExpression(((stack1 = ((stack1 = depth0.ratings),stack1 == null || stack1 === false ? stack1 : stack1.ovr)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td><td>"
    + escapeExpression(((stack1 = ((stack1 = depth0.ratings),stack1 == null || stack1 === false ? stack1 : stack1.pot)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td>";
  stack2 = helpers['if'].call(depth0, depth1.currentSeason, {hash:{},inverse:self.noop,fn:self.program(23, program23, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "<td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.min), 1, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.min), 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.pts), 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.trb), 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.ast), 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.per), 1, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.stats),stack1 == null || stack1 === false ? stack1 : stack1.per), 1, options)))
    + "</td>";
  stack2 = helpers['if'].call(depth0, depth1.sortable, {hash:{},inverse:self.noop,fn:self.program(25, program25, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  stack2 = helpers['if'].call(depth0, depth1.showTradeFor, {hash:{},inverse:self.noop,fn:self.programWithDepth(program28, data, depth0, depth1),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</tr>\n  ";
  return buffer;
  }
function program19(depth0,data) {
  
  
  return " class=\"separator\"";
  }

function program21(depth0,data) {
  
  
  return "<td class=\"roster_handle\"></td>";
  }

function program23(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "<td>$";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.contractAmount, 2, options) : helperMissing.call(depth0, "round", depth0.contractAmount, 2, options)))
    + "M thru ";
  if (stack2 = helpers.contractExp) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.contractExp; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>";
  return buffer;
  }

function program25(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "<td><button class=\"btn btn-mini\" data-action=\"release\" data-player-id=\"";
  if (stack1 = helpers.pid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-player-name=\"";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-contract-expiration=\"";
  if (stack1 = helpers.contractExp) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.contractExp; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers.unless.call(depth0, depth0.canRelease, {hash:{},inverse:self.noop,fn:self.program(26, program26, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Release</button></td><td><button class=\"btn btn-mini\" data-action=\"buyOut\" data-player-id=\"";
  if (stack1 = helpers.pid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-player-name=\"";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-cash-owed=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.cashOwed, 2, options) : helperMissing.call(depth0, "round", depth0.cashOwed, 2, options)))
    + "\"";
  stack2 = helpers.unless.call(depth0, depth0.canBuyOut, {hash:{},inverse:self.noop,fn:self.program(26, program26, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">Buy out</button></td>";
  return buffer;
  }
function program26(depth0,data) {
  
  
  return " disabled=\"disabled\"";
  }

function program28(depth0,data,depth1,depth2) {
  
  var buffer = "", stack1;
  buffer += "<td><form action=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/trade\" method=\"POST\" style=\"margin: 0\"><input type=\"hidden\" name=\"pid\" value=\""
    + escapeExpression(((stack1 = depth1.pid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"><button type=\"submit\" class=\"btn btn-mini\">Trade For</button></form></td>";
  return buffer;
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/roster\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"roster-select-team\" name=\"team\" class=\"team\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.teams) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <select id=\"roster-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>"
    + escapeExpression(((stack1 = ((stack1 = depth0.team),stack1 == null || stack1 === false ? stack1 : stack1.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = depth0.team),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " Roster ";
  if (stack2 = helpers.new_window) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.new_window; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h1>\n\n";
  stack2 = helpers['if'].call(depth0, depth0.currentSeason, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n";
  stack2 = helpers['if'].call(depth0, depth0.sortable, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster\">\n<thead>\n  <tr>";
  stack2 = helpers['if'].call(depth0, depth0.sortable, {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "<th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th>";
  stack2 = helpers['if'].call(depth0, depth0.currentSeason, {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "<th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th title=\"Player Efficiency Rating\">PER</th>";
  stack2 = helpers['if'].call(depth0, depth0.sortable, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  stack2 = helpers['if'].call(depth0, depth0.showTradeFor, {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</tr>\n</thead>\n<tbody>\n  ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program18, data, depth0),data:data};
  if (stack2 = helpers.players) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.players; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.players) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</tbody>\n</table>\n</p>\n";
  return buffer;
  });
templates['teamHistory'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "None yet.";
  }

function program3(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n    <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/"
    + escapeExpression(((stack1 = depth1.abbrev),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>: <a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/standings/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.won) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.won; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "-";
  if (stack2 = helpers.lost) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lost; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  stack2 = helpers['if'].call(depth0, depth0.extraText, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth1),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "<br>\n  ";
  return buffer;
  }
function program4(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2;
  buffer += ", <a href=\"/l/"
    + escapeExpression(((stack1 = depth2.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/playoffs/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.extraText) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.extraText; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  return buffer;
  }

  buffer += "<h1>Team History ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<p>\n  ";
  stack1 = helpers.unless.call(depth0, depth0.history, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program3, data, depth0),data:data};
  if (stack1 = helpers.history) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.history; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.history) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</p>";
  return buffer;
  });
templates['draft'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " style=\"display: none;\"";
  }

function program3(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n        <tr id=\"undrafted-";
  if (stack1 = helpers.pid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.skills_block),stack1 ? stack1.call(depth0, depth0.skills, options) : helperMissing.call(depth0, "skills_block", depth0.skills, options)))
    + "</td><td>";
  if (stack2 = helpers.pos) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pos; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "<td>";
  if (stack2 = helpers.ovr) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ovr; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pot) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pot; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td><button class=\"btn btn-mini btn-primary\" data-player-id=\"";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\"";
  stack2 = helpers.unless.call(depth0, depth1.started, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">Draft</button></td></tr>\n      ";
  return buffer;
  }
function program4(depth0,data) {
  
  
  return " disabled=\"disabled\"";
  }

function program6(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n        <tr><td>";
  if (stack1 = helpers.rnd) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.rnd; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "-";
  if (stack1 = helpers.pick) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.pick; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td><a href=\"/l/";
  if (stack2 = helpers.lid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.lid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/player/";
  if (stack2 = helpers.pid) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pid; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.skills_block),stack1 ? stack1.call(depth0, depth0.skills, options) : helperMissing.call(depth0, "skills_block", depth0.skills, options)))
    + "</td><td>";
  if (stack2 = helpers.pos) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pos; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "<td>";
  if (stack2 = helpers.ovr) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ovr; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pot) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pot; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n      ";
  return buffer;
  }

  buffer += "<h1>Draft ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n\n<p>When your turn in the draft comes up, select from the list of available players on the left.</p>\n\n<p";
  stack1 = helpers['if'].call(depth0, depth0.started, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><button class=\"btn btn-large btn-primary\" id=\"start-draft\">Start draft</button></p>\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2>Undrafted Players</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"undrafted\">\n    <thead>\n      <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Draft</th></tr>\n    </thead>\n    <tbody>\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program3, data, depth0),data:data};
  if (stack1 = helpers.undrafted) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.undrafted; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.undrafted) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n  <div class=\"span6\">\n    <h2>Draft Results</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"drafted\">\n    <thead>\n      <tr><th>Pick</th><th>Team</th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th></tr>\n    </thead>\n    <tbody>\n      ";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program6, data, depth0),data:data};
  if (stack1 = helpers.drafted) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.drafted; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.drafted) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n</div>\n";
  return buffer;
  });
templates['distPlayerStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_player_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"dist-player-stats-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Stat Distributions ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_stats\">Main Stats</a> | <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/player_shot_locations\">Shot Locations</a></p>\n\n<p>These <a href=\"http://en.wikipedia.org/wiki/Box_plot\">box plots</a> show the league-wide distributions of player stats for all active players in the selected season. Black plots are for this league and blue plots are from the 2009-2010 NBA season, for comparison. NBA data was generously provided by <a href=\"http://www.databasebasketball.com/stats_download.htm\">databaseBasketball.com</a>. The five vertical lines in each plot represent the minimum of the scale, the minimum, the first <a href=\"http://en.wikipedia.org/wiki/Quartile\">quartile</a>, the median, the third quartile, the maximum, and the maximum of the scale.</p>\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" id=\"dist-player-stats\">\n  <tbody></tbody>\n</table>\n</p>\n";
  return buffer;
  });
templates['player'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        Draft: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.draftYear)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " - Round "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.draftRound)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " (Pick "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.draftPick)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ") by "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.draftAbbrev)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n      ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        Undrafted: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.draftYear)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n      ";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n        ";
  stack1 = helpers['if'].call(depth0, depth0.freeAgent, {hash:{},inverse:self.program(8, program8, data),fn:self.program(6, program6, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ": $";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.contractAmount), 2, options) : helperMissing.call(depth0, "round", ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.contractAmount), 2, options)))
    + "M/yr thru "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.contractExp)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n      ";
  return buffer;
  }
function program6(depth0,data) {
  
  
  return "Asking for";
  }

function program8(depth0,data) {
  
  
  return "Contract";
  }

function program10(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "<span class=\"skills_alone\">";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.skills_block),stack1 ? stack1.call(depth0, ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.skills), options) : helperMissing.call(depth0, "skills_block", ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.skills), options)))
    + "</span><br>";
  return buffer;
  }

function program12(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <div class=\"span6\">\n      <h2 class=\"pull-left\">Overall: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.ovr)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h2>\n      <h2 class=\"pull-right\">Potential: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.pot)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h2><br><br><br>\n      <div class=\"row-fluid\">\n        <div class=\"span4\">\n          <strong>Physical</strong><br/ >\n          Height: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.hgt)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Strength: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.stre)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Speed: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.spd)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Jumping: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.jmp)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Endurance: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.endu)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n        </div>\n        <div class=\"span4\">\n          <strong>Shooting</strong><br/ >\n          Inside: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.ins)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Layups: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.dnk)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Free throws: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.ft)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Two pointers: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.fg)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Three pointers: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.tp)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n        </div>\n        <div class=\"span4\">\n          <strong>Skill</strong><br/ >\n          Blocks: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.blk)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Steals: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.stl)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Dribbling: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.drb)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Passing: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.pss)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n          Rebounding: "
    + escapeExpression(((stack1 = ((stack1 = depth0.currentRatings),stack1 == null || stack1 === false ? stack1 : stack1.reb)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n        </div>\n      </div>\n    </div>\n  ";
  return buffer;
  }

function program14(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/trade\" method=\"POST\"><input type=\"hidden\" name=\"pid\" value=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"><button type=\"submit\" class=\"btn btn-small\">Trade For</button></form>\n";
  return buffer;
  }

function program16(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/negotiation/"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.pid)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" method=\"POST\"><input type=\"hidden\" name=\"new\" value=\"1\"><button type=\"submit\" class=\"btn btn-small\">Sign free agent</button></form>\n";
  return buffer;
  }

function program18(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n    <tr><td><a href=\"#\">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></td><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td>";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.gp) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gp; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.gs) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gs; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.min, 1, options) : helperMissing.call(depth0, "round", depth0.min, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fg, 1, options) : helperMissing.call(depth0, "round", depth0.fg, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fga, 1, options) : helperMissing.call(depth0, "round", depth0.fga, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgp, 1, options) : helperMissing.call(depth0, "round", depth0.fgp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tp, 1, options) : helperMissing.call(depth0, "round", depth0.tp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpa, 1, options) : helperMissing.call(depth0, "round", depth0.tpa, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpp, 1, options) : helperMissing.call(depth0, "round", depth0.tpp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.ft, 1, options) : helperMissing.call(depth0, "round", depth0.ft, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fta, 1, options) : helperMissing.call(depth0, "round", depth0.fta, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.ftp, 1, options) : helperMissing.call(depth0, "round", depth0.ftp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.orb, 1, options) : helperMissing.call(depth0, "round", depth0.orb, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.drb, 1, options) : helperMissing.call(depth0, "round", depth0.drb, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.trb, 1, options) : helperMissing.call(depth0, "round", depth0.trb, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.ast, 1, options) : helperMissing.call(depth0, "round", depth0.ast, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tov, 1, options) : helperMissing.call(depth0, "round", depth0.tov, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.stl, 1, options) : helperMissing.call(depth0, "round", depth0.stl, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.blk, 1, options) : helperMissing.call(depth0, "round", depth0.blk, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.pf, 1, options) : helperMissing.call(depth0, "round", depth0.pf, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.pts, 1, options) : helperMissing.call(depth0, "round", depth0.pts, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.per, 1, options) : helperMissing.call(depth0, "round", depth0.per, 1, options)))
    + "</td></tr>\n  ";
  return buffer;
  }

function program20(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n    <tr><td>Career</td><td></td><td></td><td>";
  if (stack1 = helpers.gp) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.gp; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td><td>";
  if (stack1 = helpers.gs) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.gs; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.min, 1, options) : helperMissing.call(depth0, "round", depth0.min, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fg, 1, options) : helperMissing.call(depth0, "round", depth0.fg, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fga, 1, options) : helperMissing.call(depth0, "round", depth0.fga, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgp, 1, options) : helperMissing.call(depth0, "round", depth0.fgp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tp, 1, options) : helperMissing.call(depth0, "round", depth0.tp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpa, 1, options) : helperMissing.call(depth0, "round", depth0.tpa, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpp, 1, options) : helperMissing.call(depth0, "round", depth0.tpp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.ft, 1, options) : helperMissing.call(depth0, "round", depth0.ft, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fta, 1, options) : helperMissing.call(depth0, "round", depth0.fta, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.ftp, 1, options) : helperMissing.call(depth0, "round", depth0.ftp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.orb, 1, options) : helperMissing.call(depth0, "round", depth0.orb, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.drb, 1, options) : helperMissing.call(depth0, "round", depth0.drb, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.trb, 1, options) : helperMissing.call(depth0, "round", depth0.trb, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.ast, 1, options) : helperMissing.call(depth0, "round", depth0.ast, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tov, 1, options) : helperMissing.call(depth0, "round", depth0.tov, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.stl, 1, options) : helperMissing.call(depth0, "round", depth0.stl, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.blk, 1, options) : helperMissing.call(depth0, "round", depth0.blk, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.pf, 1, options) : helperMissing.call(depth0, "round", depth0.pf, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.pts, 1, options) : helperMissing.call(depth0, "round", depth0.pts, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.per, 1, options) : helperMissing.call(depth0, "round", depth0.per, 1, options)))
    + "</td></tr>\n  ";
  return buffer;
  }

function program22(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n    <tr><td><a href=\"#\">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></td><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td>";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.gp) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gp; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.gs) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.gs; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.min, 1, options) : helperMissing.call(depth0, "round", depth0.min, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgAtRim, 1, options) : helperMissing.call(depth0, "round", depth0.fgAtRim, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgaAtRim, 1, options) : helperMissing.call(depth0, "round", depth0.fgaAtRim, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgpAtRim, 1, options) : helperMissing.call(depth0, "round", depth0.fgpAtRim, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgLowPost, 1, options) : helperMissing.call(depth0, "round", depth0.fgLowPost, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgaLowPost, 1, options) : helperMissing.call(depth0, "round", depth0.fgaLowPost, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgpLowPost, 1, options) : helperMissing.call(depth0, "round", depth0.fgpLowPost, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgMidRange, 1, options) : helperMissing.call(depth0, "round", depth0.fgMidRange, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgaMidRange, 1, options) : helperMissing.call(depth0, "round", depth0.fgaMidRange, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgpMidRange, 1, options) : helperMissing.call(depth0, "round", depth0.fgpMidRange, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tp, 1, options) : helperMissing.call(depth0, "round", depth0.tp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpa, 1, options) : helperMissing.call(depth0, "round", depth0.tpa, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpp, 1, options) : helperMissing.call(depth0, "round", depth0.tpp, 1, options)))
    + "</td></tr>\n  ";
  return buffer;
  }

function program24(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n    <tr><td>Career</td><td></td><td></td><td>";
  if (stack1 = helpers.gp) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.gp; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td><td>";
  if (stack1 = helpers.gs) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.gs; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.min, 1, options) : helperMissing.call(depth0, "round", depth0.min, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgAtRim, 1, options) : helperMissing.call(depth0, "round", depth0.fgAtRim, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgaAtRim, 1, options) : helperMissing.call(depth0, "round", depth0.fgaAtRim, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgpAtRim, 1, options) : helperMissing.call(depth0, "round", depth0.fgpAtRim, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgLowPost, 1, options) : helperMissing.call(depth0, "round", depth0.fgLowPost, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgaLowPost, 1, options) : helperMissing.call(depth0, "round", depth0.fgaLowPost, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgpLowPost, 1, options) : helperMissing.call(depth0, "round", depth0.fgpLowPost, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgMidRange, 1, options) : helperMissing.call(depth0, "round", depth0.fgMidRange, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgaMidRange, 1, options) : helperMissing.call(depth0, "round", depth0.fgaMidRange, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.fgpMidRange, 1, options) : helperMissing.call(depth0, "round", depth0.fgpMidRange, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tp, 1, options) : helperMissing.call(depth0, "round", depth0.tp, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpa, 1, options) : helperMissing.call(depth0, "round", depth0.tpa, 1, options)))
    + "</td><td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0.tpp, 1, options) : helperMissing.call(depth0, "round", depth0.tpp, 1, options)))
    + "</td></tr>\n  ";
  return buffer;
  }

function program26(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n      <tr><td><a href=\"#\">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></td><td><a href=\"/l/"
    + escapeExpression(((stack1 = depth1.lid),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/roster/";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/";
  if (stack2 = helpers.season) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.season; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.abbrev) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.abbrev; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a></td><td>";
  if (stack2 = helpers.age) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.age; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.ovr) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ovr; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pot) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pot; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.hgt) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.hgt; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.stre) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.stre; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.spd) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.spd; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.jmp) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.jmp; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.endu) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.endu; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.ins) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ins; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.dnk) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.dnk; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.ft) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ft; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.fg) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.fg; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.tp) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.tp; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.blk) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.blk; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.stl) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.stl; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.drb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.drb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.pss) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.pss; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td>";
  if (stack2 = helpers.reb) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.reb; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td><td><span class=\"skills_alone\">";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.skills_block),stack1 ? stack1.call(depth0, depth0.skills, options) : helperMissing.call(depth0, "skills_block", depth0.skills, options)))
    + "</span></td></tr>\n    ";
  return buffer;
  }

  buffer += "<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h1>"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ";
  if (stack2 = helpers.new_window) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.new_window; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h1>\n    <div id=\"picture\" class=\"player_picture\">";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.face),stack1 ? stack1.call(depth0, ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.face), options) : helperMissing.call(depth0, "face", ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.face), options)))
    + "</div>\n    <div style=\"float: left;\">\n      <strong>"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.teamRegion)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.teamName)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</strong><br>\n      Height: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.hgtFt)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "'"
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.hgtIn)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"<br>\n      Weight: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.weight)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " lbs<br>\n      Age: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.age)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n      Born: "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.bornYear)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " - "
    + escapeExpression(((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.bornLoc)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "<br>\n      ";
  stack2 = helpers['if'].call(depth0, ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.draftRound), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      ";
  stack2 = helpers['if'].call(depth0, depth0.showContract, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n      ";
  stack2 = helpers.unless.call(depth0, depth0.retired, {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n    </div>\n  </div>\n  ";
  stack2 = helpers.unless.call(depth0, depth0.retired, {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</div>\n\n<p></p>\n";
  stack2 = helpers['if'].call(depth0, depth0.showTradeFor, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n";
  stack2 = helpers['if'].call(depth0, depth0.freeAgent, {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n<h2>Regular Season Stats</h2>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n  <thead>\n    <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Player Efficiency Rating\">PER</th></tr>\n  </thead>\n  <tbody>\n  ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.stats)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program18, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  ";
  stack2 = helpers['with'].call(depth0, ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.careerStats), {hash:{},inverse:self.noop,fn:self.program(20, program20, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </tbody>\n</table>\n\n<h2>Shot Locations</h2>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n  <thead>\n    <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"At Rim\">At Rim</th><th colspan=\"3\" style=\"text-align: center\" title=\"Low Post\">Low Post</th><th colspan=\"3\" style=\"text-align: center\" title=\"Mid-Range\">Mid-Range</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th></tr>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th></tr>\n  </thead>\n  <tbody>\n  ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.stats)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program22, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  ";
  stack2 = helpers['with'].call(depth0, ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.careerStats), {hash:{},inverse:self.noop,fn:self.program(24, program24, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </tbody>\n</table>\n\n<h2>Ratings History</h2>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_ratings\">\n  <thead>\n    <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th><th>Skills</th></tr>\n  </thead>\n  <tbody>\n    ";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.player),stack1 == null || stack1 === false ? stack1 : stack1.ratings)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program26, data, depth0),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </tbody>\n</table>";
  return buffer;
  });
templates['teamShotLocations'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <option value=\"";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  stack1 = helpers['if'].call(depth0, depth0.selected, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  if (stack1 = helpers.season) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " season</option>\n    ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";
  }

  buffer += "<form action=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_shot_locations\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"team-shot-locations-select-season\" name=\"season\" class=\"season\">\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.seasons) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Team Shot Locations ";
  if (stack1 = helpers.new_window) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.new_window; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n<p>More: <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/team_stats\">Main Stats</a> | <a href=\"/l/";
  if (stack1 = helpers.lid) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/dist_team_stats\">Stat Distributions</a></p>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"team-shot-locations\">\n<thead>\n  <tr><th colspan=\"4\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"At Rim\">At Rim</th><th colspan=\"3\" style=\"text-align: center\" title=\"Low Post\">Low Post</th><th colspan=\"3\" style=\"text-align: center\" title=\"Mid-Range\">Mid-Range</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th></tr>\n  <tr><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Won\">W</th><th title=\"Lost\">L</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th></tr>\n</thead>\n</table>\n</p>";
  return buffer;
  });
})();