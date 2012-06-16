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
templates['box_score'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <h3><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.viewSeason;
  stack1 = foundHelper || depth0.viewSeason;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "viewSeason", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a></h2>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n  <thead>\n    <tr><th>Name</th><th>Pos</th><th>Min</th><th>FG</th><th>3Pt</th><th>FT</th><th>Off</th><th>Reb</th><th>Ast</th><th>TO</th><th>Stl</th><th>Blk</th><th>PF</th><th>Pts</th></tr>\n  </thead>\n  <tbody>\n  ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </tbody>\n  <tfoot>\n    <tr><td>Total</td><td></td><td>240</td><td>";
  foundHelper = helpers.fg;
  stack1 = foundHelper || depth0.fg;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fg", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fga;
  stack1 = foundHelper || depth0.fga;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fga", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tp;
  stack1 = foundHelper || depth0.tp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.tpa;
  stack1 = foundHelper || depth0.tpa;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tpa", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ft;
  stack1 = foundHelper || depth0.ft;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ft", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fta;
  stack1 = foundHelper || depth0.fta;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fta", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.orb;
  stack1 = foundHelper || depth0.orb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "orb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.rebounds;
  stack1 = foundHelper || depth0.rebounds;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rebounds", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td> ";
  foundHelper = helpers.team;
  stack1 = foundHelper || depth0.team;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "team.ast", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tov;
  stack1 = foundHelper || depth0.tov;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tov", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stl;
  stack1 = foundHelper || depth0.stl;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "stl", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.blk;
  stack1 = foundHelper || depth0.blk;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "blk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pf;
  stack1 = foundHelper || depth0.pf;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pf", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pts;
  stack1 = foundHelper || depth0.pts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td></tr>\n  </tfoot>\n  </table>\n";
  return buffer;}
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr class=\"separator\"><td><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.pos;
  stack1 = foundHelper || depth0.pos;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pos", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.min;
  stack1 = foundHelper || depth0.min;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "min", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.fg;
  stack1 = foundHelper || depth0.fg;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fg", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fga;
  stack1 = foundHelper || depth0.fga;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fga", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tp;
  stack1 = foundHelper || depth0.tp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.tpa;
  stack1 = foundHelper || depth0.tpa;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tpa", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ft;
  stack1 = foundHelper || depth0.ft;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ft", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fta;
  stack1 = foundHelper || depth0.fta;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fta", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.orb;
  stack1 = foundHelper || depth0.orb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "orb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.rebounds;
  stack1 = foundHelper || depth0.rebounds;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rebounds", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td> ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.ast", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tov;
  stack1 = foundHelper || depth0.tov;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tov", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stl;
  stack1 = foundHelper || depth0.stl;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "stl", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.blk;
  stack1 = foundHelper || depth0.blk;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "blk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pf;
  stack1 = foundHelper || depth0.pf;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pf", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pts;
  stack1 = foundHelper || depth0.pts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td></tr>\n  ";
  return buffer;}

  buffer += "<h2><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.wonAbbrev;
  stack1 = foundHelper || depth0.wonAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "wonAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.viewSeason;
  stack1 = foundHelper || depth0.viewSeason;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "viewSeason", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.won_region;
  stack1 = foundHelper || depth0.won_region;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "won_region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.won_name;
  stack1 = foundHelper || depth0.won_name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "won_name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> ";
  foundHelper = helpers.won_pts;
  stack1 = foundHelper || depth0.won_pts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "won_pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + ", <a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.lostAbbrev;
  stack1 = foundHelper || depth0.lostAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lostAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.viewSeason;
  stack1 = foundHelper || depth0.viewSeason;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "viewSeason", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.lost_region;
  stack1 = foundHelper || depth0.lost_region;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lost_region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.lost_name;
  stack1 = foundHelper || depth0.lost_name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lost_name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> ";
  foundHelper = helpers.lost_pts;
  stack1 = foundHelper || depth0.lost_pts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lost_pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h2>\n\n";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
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
templates['playButton'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  foundHelper = helpers.normal_link;
  stack1 = foundHelper || depth0.normal_link;
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(4, program4, data);
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  return buffer;}
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n          <li><a href=\"";
  foundHelper = helpers.url;
  stack1 = foundHelper || depth0.url;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "url", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.label;
  stack1 = foundHelper || depth0.label;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "label", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></li>\n        ";
  return buffer;}

function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n          <li><a onclick=\"";
  foundHelper = helpers.url;
  stack1 = foundHelper || depth0.url;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "url", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" href=\"javascript:void(0);\">";
  foundHelper = helpers.label;
  stack1 = foundHelper || depth0.label;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "label", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></li>\n        ";
  return buffer;}

  buffer += "<ul class=\"nav btn btn-primary\">\n  <li class=\"dropdown\">\n    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">Play <b class=\"caret\"></b></a>\n    <ul class=\"dropdown-menu\">\n      ";
  foundHelper = helpers.options;
  stack1 = foundHelper || depth0.options;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </ul>\n  </li>\n</ul>\n";
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
templates['game_log'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <option value=\"";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.selected;
  stack1 = foundHelper || depth0.selected;
  stack2 = helpers['if'];
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.region;
  stack1 = foundHelper || depth0.region;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</option>\n      ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <option value=\"";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.selected;
  stack1 = foundHelper || depth0.selected;
  stack2 = helpers['if'];
  tmp1 = self.program(5, program5, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + " season</option>\n      ";
  return buffer;}
function program5(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "  <script type=\"text/javascript\">\n    // Load game log list table and activate form\n    $(document).ready(function() {\n\n      $game_log_select_season = $('#game_log_select_season')\n      $game_log_select_season.change(function(event) { api.gameLogList($game_log_select_abbrev.val(), $game_log_select_season.val()); });\n      $game_log_select_abbrev = $('#game_log_select_abbrev')\n      $game_log_select_abbrev.change(function(event) { api.gameLogList($game_log_select_abbrev.val(), $game_log_select_season.val()); });\n      if ($game_log_select_season.length && $game_log_select_abbrev.length) {\n        api.gameLogList($game_log_select_abbrev.val(), $game_log_select_season.val(), true);\n      }\n\n      // Clickable rows for game log list table\n      $(document).on('click', '#game_log_list tbody tr', function(event) {\n        $clicked_tr = $(this);\n        $.get('/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/box_score/' + $clicked_tr.attr('id'), function(data) {\n          // Update boxscore\n          $('#game_log_box_score').html(data);\n\n          // Update gamelist highlighting\n          $clicked_tr.parent().children().each(function() {\n            $(this).removeClass('alert-info');\n          });\n          $clicked_tr.addClass('alert-info');\n        });\n      });\n    });\n  </script>\n\n  <form action=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log\" method=\"GET\" class=\"form-inline pull-right\">\n    <select id=\"game_log_select_abbrev\" name=\"team\" class=\"team\">\n      ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </select>\n    <select id=\"game_log_select_season\" name=\"season\" class=\"season\">\n      ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </select>\n  </form>\n\n  <h1>Game Log</h1>\n\n  <p>\n    <div class=\"row-fluid\">\n      <div class=\"span9\">\n        <div id=\"game_log_box_score\">\n          <p>Select a game from the menu on the right to view a box score.</p>\n        </div>\n      </div>\n\n      <div class=\"span3\" id=\"game_log_list\">\n      </div>\n    </div>\n  </p>\n";
  return buffer;});
templates['gameLogList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n    <tr id=\"";
  foundHelper = helpers.gid;
  stack1 = foundHelper || depth0.gid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><td>";
  foundHelper = helpers.home;
  stack1 = foundHelper || depth0.home;
  stack2 = helpers.unless;
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  foundHelper = helpers.oppAbbrev;
  stack1 = foundHelper || depth0.oppAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.won;
  stack1 = foundHelper || depth0.won;
  stack2 = helpers['if'];
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(6, program6, data);
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</td><td>";
  foundHelper = helpers.pts;
  stack1 = foundHelper || depth0.pts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.oppPts;
  stack1 = foundHelper || depth0.oppPts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppPts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td></tr>\n  ";
  return buffer;}
function program2(depth0,data) {
  
  
  return "@";}

function program4(depth0,data) {
  
  
  return "W";}

function program6(depth0,data) {
  
  
  return "L";}

  buffer += "<table id=\"game_log_list\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n<thead>\n  <tr><th>Opp</th><th>W/L</th><th>Score</th></tr>\n</thead>\n<tbody>\n  ";
  foundHelper = helpers.games;
  stack1 = foundHelper || depth0.games;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</tbody>\n</table>\n";
  return buffer;});
})();