(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['playoffs'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, stack3, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
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
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data) {
  
  
  return "<p>This is what the playoff matchups would be if the season ended right now.</p>";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.dropdown($('#playoffs_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/playoffs\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"playoffs_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + " Playoffs</h1>\n\n";
  foundHelper = helpers.finalMatchups;
  stack1 = foundHelper || depth0.finalMatchups;
  stack2 = helpers.unless;
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table-condensed\" width=\"100%\">\n<tbody>\n  <tr>\n    <td width=\"14.28%\">\n      ";
  stack1 = 0;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\" width=\"14.28%\">\n      ";
  stack1 = 0;
  stack2 = 1;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  stack1 = 0;
  stack2 = 2;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  stack1 = 0;
  stack2 = 3;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  stack1 = 1;
  stack2 = 2;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\" width=\"14.28%\">\n      ";
  stack1 = 2;
  stack2 = 1;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td width=\"14.28%\">\n      ";
  stack1 = 4;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  stack1 = 1;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td>\n      ";
  stack1 = 5;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  stack1 = 2;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\">\n      ";
  stack1 = 1;
  stack2 = 1;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\">\n      ";
  stack1 = 3;
  stack2 = 1;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td>\n      ";
  stack1 = 6;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  stack1 = 3;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td>\n      ";
  stack1 = 7;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n</tbody>\n</table>\n</p>\n";
  return buffer;});
templates['standings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
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
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n  <h2>";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h2>\n  <div class=\"row-fluid\">\n    <div class=\"span9\">\n      ";
  foundHelper = helpers.divs;
  stack1 = foundHelper || depth0.divs;
  tmp1 = self.programWithDepth(program5, data, depth1);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </div>\n\n    <div class=\"span3\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n      <thead>\n        <tr><th width=\"100%\">Team</th><th align=\"right\">GB</th></tr>\n      </thead>\n      <tbody>\n      ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.programWithDepth(program8, data, depth1);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n      </table>\n    </div>\n  </div>\n";
  return buffer;}
function program5(depth0,data,depth2) {
  
  var buffer = "", stack1;
  buffer += "\n          <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n          <thead>\n            <tr><th width=\"100%\">";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Home</th><th>Road</th><th>Div</th><th>Conf</th><th>Streak</th><th>L10</th></tr>\n          </thead>\n          <tbody>\n          ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.programWithDepth(program6, data, depth2);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n          </tbody>\n          </table>\n      ";
  return buffer;}
function program6(depth0,data,depth3) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n            <tr><td><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth3['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, ".........g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.won;
  stack1 = foundHelper || depth0.won;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "won", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.lost;
  stack1 = foundHelper || depth0.lost;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lost", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.winp;
  stack1 = foundHelper || depth0.winp;
  foundHelper = helpers.roundWinp;
  stack2 = foundHelper || depth0.roundWinp;
  if(typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, { hash: {} }); }
  else if(stack2=== undef) { stack1 = helperMissing.call(depth0, "roundWinp", stack1, { hash: {} }); }
  else { stack1 = stack2; }
  buffer += escapeExpression(stack1) + "</td><td>GB</td><td>";
  foundHelper = helpers.wonHome;
  stack1 = foundHelper || depth0.wonHome;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "wonHome", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostHome;
  stack1 = foundHelper || depth0.lostHome;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lostHome", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.wonRoad;
  stack1 = foundHelper || depth0.wonRoad;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "wonRoad", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostRoad;
  stack1 = foundHelper || depth0.lostRoad;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lostRoad", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.wonDiv;
  stack1 = foundHelper || depth0.wonDiv;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "wonDiv", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostDiv;
  stack1 = foundHelper || depth0.lostDiv;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lostDiv", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.wonConf;
  stack1 = foundHelper || depth0.wonConf;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "wonConf", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostConf;
  stack1 = foundHelper || depth0.lostConf;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lostConf", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>Streak</td><td>L10</td></tr>\n          ";
  return buffer;}

function program8(depth0,data,depth2) {
  
  var buffer = "", stack1;
  buffer += "\n        <tr><td>1. <a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth2['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  stack1 = foundHelper || depth0.region;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "region", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td align=\"right\">GB</td></tr>\n      ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    bbgm.dropdown($('#standings_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/standings\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"standings_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Standings</h1>\n\n";
  foundHelper = helpers.confs;
  stack1 = foundHelper || depth0.confs;
  tmp1 = self.programWithDepth(program4, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});
templates['error'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<h1>Error</h1>\n\n";
  foundHelper = helpers.error;
  stack1 = foundHelper || depth0.error;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "error", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\n";
  return buffer;});
templates['draft'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " style=\"display: none;\"";}

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <tr id=\"undrafted_";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><td><a href=\"/l/";
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
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<td>";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td><button class=\"btn btn-mini btn-primary\" data-player-id=\"";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" disabled=\"disabled\">Draft</button></td></tr>\n      ";
  return buffer;}

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <tr><td>";
  foundHelper = helpers.round;
  stack1 = foundHelper || depth0.round;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "round", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.pick;
  stack1 = foundHelper || depth0.pick;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pick", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td><a href=\"/l/";
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
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td><a href=\"/l/";
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
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<td>";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td></tr>\n      ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    function updateDraftTables(pids) {\n        for (var i=0; i<pids.length; i++) {\n            var draftedPlayer = new Array(5);\n            // Find row in undrafted players table, get metadata, delete row\n            var undraftedTds = $('#undrafted_' + pids[i] + ' td')\n            for (var j=0; j<5; j++) {\n                draftedPlayer[j] = undraftedTds[j].innerHTML;\n            }\n\n            // Find correct row (first blank row) in drafted players table, write metadata\n            var draftedRows = $('#drafted tbody tr');\n            for (var j=0; j<draftedRows.length; j++) {\n                if (draftedRows[j].children[3].innerHTML.length == 0) {\n                    $('#undrafted_' + pids[i]).remove();\n                    draftedRows[j].children[2].innerHTML = draftedPlayer[0];\n                    draftedRows[j].children[3].innerHTML = draftedPlayer[1];\n                    draftedRows[j].children[4].innerHTML = draftedPlayer[2];\n                    draftedRows[j].children[5].innerHTML = draftedPlayer[3];\n                    draftedRows[j].children[6].innerHTML = draftedPlayer[4];\n                    break;\n                }\n            }\n        }\n    }\n\n    function cbDraftUntilUserOrEnd(pids, done) {\n        updateDraftTables(pids);\n        if (!done) {\n            $('#undrafted button').removeAttr('disabled');\n        }\n    }\n\n    function draftUntilUserOrEnd() {\n        [pids, done] = api.draftUntilUserOrEnd(cbDraftUntilUserOrEnd);\n    }\n\n    $('#start_draft').click(function(event) {\n        $($('#start_draft').parent()).hide()\n        draftUntilUserOrEnd(cbDraftUntilUserOrEnd);\n    });\n\n    $('#undrafted button').click(function(event) {\n        $('#undrafted button').attr('disabled', 'disabled');\n        var pid = api.draftUser(this.getAttribute('data-player-id'), function (pid) {\n            update_draft_tables([pid]);\n            draftUntilUserOrEnd(cbDraftUntilUserOrEnd);\n        });\n    });\n});\n</script>\n\n<h1>Draft</h1>\n\n<p>When your turn in the draft comes up, select from the list of available players on the left.</p>\n\n<p";
  foundHelper = helpers.started;
  stack1 = foundHelper || depth0.started;
  stack2 = helpers['if'];
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><button class=\"btn btn-large btn-primary\" id=\"start_draft\">Start draft</button></p>\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2>Undrafted Players</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"undrafted\">\n    <thead>\n      <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Draft</th></tr>\n    </thead>\n    <tbody>\n      ";
  foundHelper = helpers.undrafted;
  stack1 = foundHelper || depth0.undrafted;
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n  <div class=\"span6\">\n    <h2>Draft Results</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"drafted\">\n    <thead>\n      <tr><th>Pick</th><th>Team</th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th></tr>\n    </thead>\n    <tbody>\n      ";
  foundHelper = helpers.drafted;
  stack1 = foundHelper || depth0.drafted;
  tmp1 = self.program(5, program5, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n</div>\n";
  return buffer;});
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

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n  <h3><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth1['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.season);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.season", { hash: {} }); }
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
  tmp1 = self.programWithDepth(program2, data, depth1);
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
  foundHelper = helpers.trb;
  stack1 = foundHelper || depth0.trb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "trb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ast;
  stack1 = foundHelper || depth0.ast;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ast", { hash: {} }); }
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
function program2(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n    <tr><td><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth2['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......g.lid", { hash: {} }); }
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
  stack1 = 1;
  foundHelper = helpers.min;
  stack2 = foundHelper || depth0.min;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
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
  foundHelper = helpers.trb;
  stack1 = foundHelper || depth0.trb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "trb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ast;
  stack1 = foundHelper || depth0.ast;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ast", { hash: {} }); }
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
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.won);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.won.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.season);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.won);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.won.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.won);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.won.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> ";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.won);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.won.pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + ", <a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lost);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.lost.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.season);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lost);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.lost.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lost);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.lost.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> ";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lost);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "game.lost.pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h2>\n";
  foundHelper = helpers.game;
  stack1 = foundHelper || depth0.game;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teams);
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});
templates['schedule'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n  <li><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth1['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[0]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teams.0.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[0]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teams.0.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[0]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teams.0.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>\n  ";
  foundHelper = helpers.vsat;
  stack1 = foundHelper || depth0.vsat;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "vsat", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\n  <a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth1['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[1]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teams.1.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[1]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teams.1.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[1]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teams.1.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>\n";
  return buffer;}

  buffer += "<h1>Upcoming Schedule</h1>\n\n<ol>\n";
  foundHelper = helpers.games;
  stack1 = foundHelper || depth0.games;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ol>\n";
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
templates['roster'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        // Roster reordering\n        function highlightHandles() {\n            var i = 1;\n            $('#roster tbody').children().each(function() {\n                if (i <= 5) {\n                    $(this).find('td:first').removeClass('btn-info');\n                    $(this).find('td:first').addClass('btn-primary');\n                }\n                else {\n                    $(this).find('td:first').removeClass('btn-primary');\n                    $(this).find('td:first').addClass('btn-info');\n                }\n                i++;\n            });\n        }\n        highlightHandles();\n        var fixHelper = function(e, ui) {\n            // Return helper which preserves the width of table cells being reordered\n            ui.children().each(function() {\n              $(this).width($(this).width());\n            });\n            return ui;\n        };\n        $('#roster tbody').sortable({\n            helper: fixHelper,\n            cursor: 'move',\n            update: function(e, ui) {\n                sorted = $(this).sortable('serialize');\n                $.post('/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/reorder', sorted, function(msg) {\n                  highlightHandles();\n                });\n            }\n        }).disableSelection();\n        $('#auto_sort_roster').click(function(event) {\n            $.post('/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/auto_sort', {'json': 1}, function (data) {\n                ajax_update(data);\n            }, 'json');\n        });\n\n        // Release player\n        $('#roster button').click(function(event) {\n            if (this.dataset.action == 'release') {\n                if (window.confirm('Are you sure you want to release ' + this.dataset.playerName + '?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ' + this.dataset.contractExpiration + '.')) {\n                    var tr = this.parentNode.parentNode;\n                    $.post('/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster_release', {'pid': this.dataset.playerId}, function (data) {\n                        if (data['error']) {\n                            alert('Error: ' + data['error']);\n                        }\n                        else {\n                            tr.parentNode.removeChild(tr);\n                        }\n                    }, 'json');\n                }\n            }\n            else if (this.dataset.action == 'buy_out') {\n                if (";
  foundHelper = helpers.team;
  stack1 = foundHelper || depth0.team;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.cash);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "team.cash", { hash: {} }); }
  buffer += escapeExpression(stack1) + " > this.dataset.cashOwed) {\n                    if (window.confirm('Are you sure you want to buy out ' + this.dataset.playerName + '? You will have to pay him the $' + this.dataset.cashOwed + 'M remaining on his contract from your current cash reserves of $";
  stack1 = 1;
  foundHelper = helpers.team;
  stack2 = foundHelper || depth0.team;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.cash);
  if(typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, { hash: {} }); }
  else if(stack2=== undef) { stack1 = helperMissing.call(depth0, "team.cash", stack1, { hash: {} }); }
  else { stack1 = stack2; }
  buffer += escapeExpression(stack1) + "M. He will then become a free agent and his contract will no longer count towards your salary cap.')) {\n                        var tr = this.parentNode.parentNode;\n                        $.post('/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster_buy_out', {'pid': this.dataset.playerId}, function (data) {\n                            if (data['error']) {\n                                alert('Error: ' + data['error']);\n                            }\n                            else {\n                                tr.parentNode.removeChild(tr);\n                            }\n                        }, 'json');\n                    }\n                }\n                else {\n                    alert('You only have $";
  stack1 = 1;
  foundHelper = helpers.team;
  stack2 = foundHelper || depth0.team;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.cash);
  if(typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, { hash: {} }); }
  else if(stack2=== undef) { stack1 = helperMissing.call(depth0, "team.cash", stack1, { hash: {} }); }
  else { stack1 = stack2; }
  buffer += escapeExpression(stack1) + "M in cash, but it would take $' + this.dataset.cashOwed + 'M to buy out ' + this.dataset.playerName + '.');\n                }\n            }\n            else if (this.dataset.action == 'trade_for') {\n\n            }\n        });\n    ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.selected;
  stack1 = foundHelper || depth0.selected;
  stack2 = helpers['if'];
  tmp1 = self.program(4, program4, data);
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
  buffer += escapeExpression(stack1) + "</option>\n    ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program6(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.selected;
  stack1 = foundHelper || depth0.selected;
  stack2 = helpers['if'];
  tmp1 = self.program(7, program7, data);
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
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program7(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <p>You currently have ";
  foundHelper = helpers.numRosterSpots;
  stack1 = foundHelper || depth0.numRosterSpots;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "numRosterSpots", { hash: {} }); }
  buffer += escapeExpression(stack1) + " empty roster spots.</p>\n  <p>Drag and drop row handles to move players between the starting lineup (<span class=\"roster_gs\">&#9632;</span>) and the bench (<span class=\"roster_bench\">&#9632;</span>).</p>\n  <p><button class=\"btn\" id=\"auto_sort_roster\">Auto sort roster</button></p>\n";
  return buffer;}

function program11(depth0,data) {
  
  
  return "<th></th>";}

function program13(depth0,data) {
  
  
  return "<th>Contract</th>";}

function program15(depth0,data) {
  
  
  return "<th>Release</th><th>Buy out</th>";}

function program17(depth0,data) {
  
  
  return "<th>Trade For</th>";}

function program19(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n    <tr id=\"roster_";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth1.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(20, program20, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<td><a href=\"/l/";
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
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td>";
  foundHelper = helpers.currentSeason;
  stack1 = foundHelper || depth1.currentSeason;
  stack2 = helpers['if'];
  tmp1 = self.program(22, program22, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<td>";
  stack1 = 1;
  foundHelper = helpers.min;
  stack2 = foundHelper || depth0.min;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.pts;
  stack2 = foundHelper || depth0.pts;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.trb;
  stack2 = foundHelper || depth0.trb;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.ast;
  stack2 = foundHelper || depth0.ast;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td>";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth1.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(24, program24, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  foundHelper = helpers.showTradeFor;
  stack1 = foundHelper || depth1.showTradeFor;
  stack2 = helpers['if'];
  tmp1 = self.program(26, program26, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</tr>\n  ";
  return buffer;}
function program20(depth0,data) {
  
  
  return "<td class=\"roster_handle\"></td>";}

function program22(depth0,data) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "<td>$";
  stack1 = 1;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M through ";
  foundHelper = helpers.contractExp;
  stack1 = foundHelper || depth0.contractExp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contractExp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td>";
  return buffer;}

function program24(depth0,data) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "<td><button class=\"btn btn-mini\" data-action=\"release\" data-player-id=\"";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" data-player-name=\"";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" data-contract-expiration=\"";
  foundHelper = helpers.contract_exp;
  stack1 = foundHelper || depth0.contract_exp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contract_exp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">Release</button></td><td><button class=\"btn btn-mini\" data-action=\"buy_out\" data-player-id=\"";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" data-player-name=\"";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" data-cash-owed=\"";
  stack1 = 1;
  foundHelper = helpers.cash_owed;
  stack2 = foundHelper || depth0.cash_owed;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\">Buy out</button></td>";
  return buffer;}

function program26(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<td><form action=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\" style=\"margin: 0\"><input type=\"hidden\" name=\"pid\" value=\"";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><button type=\"submit\" class=\"btn btn-mini\">Trade For</button></form></td>";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    bbgm.dropdown($('#roster_select_team'), $('#roster_select_season'));\n\n    ";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth0.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"roster_select_team\" name=\"team\" class=\"team\">\n    ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <select id=\"roster_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(6, program6, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>";
  foundHelper = helpers.team;
  stack1 = foundHelper || depth0.team;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "team.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.team;
  stack1 = foundHelper || depth0.team;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "team.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + " Roster</h1>\n\n";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth0.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(9, program9, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster\">\n<thead>\n  <tr>";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth0.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(11, program11, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th>";
  foundHelper = helpers.currentSeason;
  stack1 = foundHelper || depth0.currentSeason;
  stack2 = helpers['if'];
  tmp1 = self.program(13, program13, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th>";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth0.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(15, program15, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  foundHelper = helpers.showTradeFor;
  stack1 = foundHelper || depth0.showTradeFor;
  stack2 = helpers['if'];
  tmp1 = self.program(17, program17, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</tr>\n</thead>\n<tbody>\n  ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program19, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</tbody>\n</table>\n</p>\n";
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
  buffer += escapeExpression(stack1) + "/trade\">Trade</a></li>\n      <li id=\"nav_draft\"><a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/draft\">Draft</a></li>\n      <li class=\"nav-header\">Stats</li>\n      <li id=\"nav_game_log\"><a href=\"/l/";
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
  buffer += "\n      <option value=\"";
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
  buffer += escapeExpression(stack1) + "</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <option value=\"";
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
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program5(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n  // Load game log list table and activate form\n  $(document).ready(function () {\n    function loadGameLogList(abbrev, season, firstTime) {\n      abbrev = typeof abbrev !== \"undefined\" ? abbrev : undefined;\n      season = typeof season !== \"undefined\" ? season : undefined;\n      firstTime = typeof season !== \"undefined\" ? firstTime : false;\n\n      api.gameLogList(abbrev, season, firstTime, function (html) {\n          $('#game_log_list').html(html);\n\n          if (firstTime) {\n              // Click the first one to show its boxscore by default\n              $('#game_log_list tbody tr').first().click();\n          }\n      });\n    }\n\n    $game_log_select_season = $('#game_log_select_season')\n    $game_log_select_season.change(function(event) { loadGameLogList($game_log_select_abbrev.val(), $game_log_select_season.val()); });\n    $game_log_select_abbrev = $('#game_log_select_abbrev')\n    $game_log_select_abbrev.change(function(event) { loadGameLogList($game_log_select_abbrev.val(), $game_log_select_season.val()); });\n    if ($game_log_select_season.length && $game_log_select_abbrev.length) {\n      loadGameLogList($game_log_select_abbrev.val(), $game_log_select_season.val(), true);\n    }\n\n    // Clickable rows for game log list table\n    $(document).on('click', '#game_log_list tbody tr', function(event) {\n      $clicked_tr = $(this);\n      api.boxScore($clicked_tr.attr('id'), function(html) {\n        // Update boxscore\n        $('#game_log_box_score').html(html);\n\n        // Update gamelist highlighting\n        $clicked_tr.parent().children().each(function() {\n          $(this).removeClass('alert-info');\n        });\n        $clicked_tr.addClass('alert-info');\n      });\n    });\n  });\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"game_log_select_abbrev\" name=\"team\" class=\"team\">\n    ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <select id=\"game_log_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Game Log</h1>\n\n<p>\n<div class=\"row-fluid\">\n  <div class=\"span9\">\n    <div id=\"game_log_box_score\">\n      <p>Select a game from the menu on the right to view a box score.</p>\n    </div>\n  </div>\n\n  <div class=\"span3\" id=\"game_log_list\">\n  </div>\n</div>\n</p>\n";
  return buffer;});
templates['draftSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n	          ['";
  foundHelper = helpers.round;
  stack1 = foundHelper || depth0.round;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "round", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.pick;
  stack1 = foundHelper || depth0.pick;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pick", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
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
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.pos;
  stack1 = foundHelper || depth0.pos;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pos", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.draftAbbrev;
  stack1 = foundHelper || depth0.draftAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "draftAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.draftAbbrev;
  stack1 = foundHelper || depth0.draftAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "draftAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.draftAge;
  stack1 = foundHelper || depth0.draftAge;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "draftAge", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.draftOvr;
  stack1 = foundHelper || depth0.draftOvr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "draftOvr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.draftPot;
  stack1 = foundHelper || depth0.draftPot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "draftPot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.currentAbbrev;
  stack1 = foundHelper || depth0.currentAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.current_abbrev;
  stack1 = foundHelper || depth0.current_abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "current_abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.currentAge;
  stack1 = foundHelper || depth0.currentAge;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentAge", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.currentOvr;
  stack1 = foundHelper || depth0.currentOvr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentOvr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.currentPot;
  stack1 = foundHelper || depth0.currentPot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentPot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.gp;
  stack2 = foundHelper || depth0.gp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.min;
  stack2 = foundHelper || depth0.min;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.pts;
  stack2 = foundHelper || depth0.pts;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.trb;
  stack2 = foundHelper || depth0.trb;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.ast;
  stack2 = foundHelper || depth0.ast;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "'],\n        ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.selected;
  stack1 = foundHelper || depth0.selected;
  stack2 = helpers['if'];
  tmp1 = self.program(4, program4, data);
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
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    bbgm.dropdown($('#draft_select_season'));\n\n    bbgm.datatableSinglePage($('#draft_results'), 0, [\n        ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ]);\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers['g'];
  stack1 = foundHelper || depth0['g'];
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "g.lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/draft\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"draft_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + " Draft Results</h1>\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"draft_results\">\n  <thead>\n    <tr><th colspan=\"3\"></th><th colspan=\"4\" style=\"text-align: center\">At Draft</th><th colspan=\"4\" style=\"text-align: center\">Current</th><th colspan=\"5\" style=\"text-align: center\">Career Stats</th></tr>\n    <tr><th>Pick</th><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th title=\"Games Played\">GP</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">PPG</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th></tr>\n  </thead>\n  </table>\n</p>\n";
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