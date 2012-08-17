(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['trade'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      [ '<input name=\"user_pids\" type=\"checkbox\" value=\"";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.contractExp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "' ],\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " checked=\"checked\"";}

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      [ '<input name=\"other_pids\" type=\"checkbox\" value=\"";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(5, program5, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.contractExp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "' ],\n    ";
  return buffer;}
function program5(depth0,data) {
  
  
  return " checked=\"checked\"";}

function program7(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n          <option value=\"";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(8, program8, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</option>\n        ";
  return buffer;}
function program8(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  var roster_checkboxes_other, roster_checkboxes_user;\n\n  // Don't use the dropdown function because this needs to be a POST\n  $('#trade_select_team').change(function(event) {\n    Davis.location.replace(new Davis.Request({\n      abbrev: $('#trade_select_team').val(),\n      fullPath: \"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/trade\",\n      method: \"post\"\n    }));\n  });\n\n  bbgm.datatableSinglePage($('#roster_user'), 5, [\n    ";
  foundHelper = helpers.userRoster;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.userRoster; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.userRoster) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n\n  bbgm.datatableSinglePage($('#roster_other'), 5, [\n    ";
  foundHelper = helpers.otherRoster;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0)}); }
  else { stack1 = depth0.otherRoster; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.otherRoster) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n\n  roster_checkboxes_user = $('#roster_user input');\n  roster_checkboxes_other = $('#roster_other input');\n\n  $('#rosters input[type=\"checkbox\"]').click(function(event) {\n    var otherPids, serialized, userPids;\n\n    serialized = $('#rosters').serializeArray();\n    userPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === \"user_pids\"; }), \"value\"), Math.floor);\n    otherPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === \"other_pids\"; }), \"value\"), Math.floor);\n\n    $('#propose_trade button').attr('disabled', 'disabled'); // Will be reenabled, if appropriate, when the summary is loaded\n    api.tradeUpdate(userPids, otherPids, function (summary, userPids, otherPids) {\n      var found, i, j;\n\n      $(\"#trade_summary\").html(summary);\n      for (i = 0; i < roster_checkboxes_user.length; i++) {\n        found = false;\n        for (j = 0; j < userPids.length; j++) {\n          if (Math.floor(roster_checkboxes_user[i].value) === userPids[j]) {\n            roster_checkboxes_user[i].checked = true;\n            found = true;\n            break;\n          }\n        }\n        if (!found) {\n          roster_checkboxes_user[i].checked = false;\n        }\n      }\n      for (i = 0; i < roster_checkboxes_other.length; i++) {\n        found = false;\n        for (j = 0; j < otherPids.length; j++) {\n          if (Math.floor(roster_checkboxes_other[i].value) === otherPids[j]) {\n            roster_checkboxes_other[i].checked = true;\n            found = true;\n            break;\n          }\n        }\n        if (!found) {\n          roster_checkboxes_other[i].checked = false;\n        }\n      }\n    });\n  });\n\n  $('#propose_trade button').click(function(event) {\n    $('#propose_trade button').attr('disabled', 'disabled');\n  });\n});\n</script>\n\n<h1>Trade</h1>\n\n<div class=\"row-fluid\">\n  <div class=\"span7\">\n    <form id=\"rosters\">\n      <p><select id=\"trade_select_team\" name=\"team\" class=\"team form-inline\">\n        ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(7, program7, data)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(7, program7, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </select>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster_other\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th></tr>\n      </thead>\n      </table>\n      </p>\n\n      <h2>";
  foundHelper = helpers.userTeamName;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.userTeamName; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h2>\n      <p>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster_user\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th></tr>\n      </thead>\n      </table>\n      </p>\n    </form>\n  </div>\n  <div class=\"span5\" id=\"trade_summary\">\n    ";
  foundHelper = helpers.tradeSummary;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tradeSummary; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>";
  return buffer;});
templates['player'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        Draft: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.draftYear;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " - Round ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.draftRound;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " (Pick ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.draftPick;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + ") by ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.draftAbbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n      ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        Undrafted: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.draftYear;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n      ";
  return buffer;}

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\"><input type=\"hidden\" name=\"pid\" value=\"";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"><button type=\"submit\" class=\"btn btn-small\">Trade For</button></form>\n";
  return buffer;}

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <tr><td><a href=\"#\">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.gp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.gs;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gs; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.fg;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.fga;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.fgp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.tp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.tpa;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.tpp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.ft;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.fta;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.ftp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.orb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.drb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.tov;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.stl;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.blk;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.pf;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td></tr>\n    ";
  return buffer;}

function program9(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <tr><td><a href=\"#\">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.hgt;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.hgt; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stre;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.stre; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.spd;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.spd; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.jmp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.jmp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.endu;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.endu; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ins;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ins; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.dnk;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.dnk; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ft;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ft; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.fg;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fg; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.blk;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.blk; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stl;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.stl; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.drb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.drb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pss;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pss; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.reb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.reb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td></tr>\n      ";
  return buffer;}

  buffer += "<script>\n$(document).ready(function() {\n  $(\"#player_tabs\").tab();\n});\n</script>\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h1>";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h1>\n    <div id=\"picture\" class=\"player_picture\">";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.face;
  foundHelper = helpers.face;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "face", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\n    <div style=\"float: left;\">\n      <strong>";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teamRegion;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teamName;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</strong><br />\n      Height: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.hgtFt;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "'";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.hgtIn;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"<br />\n      Weight: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.weight;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " lbs<br />\n      Age: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.age;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n      Born: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.bornYear;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " - ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.bornLoc;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n      ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.draftRound;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      Contract: $";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.contractAmount;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "M per year through ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.contractExp;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n    </div>\n  </div>\n  <div class=\"span6\">\n    <h2 class=\"pull-left\">Overall: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ovr;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h2>\n    <h2 class=\"pull-right\">Potential: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pot;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h2><br /><br /><br />\n    <div class=\"row-fluid\">\n      <div class=\"span4\">\n        <strong>Physical</strong><br/ >\n        Height: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.hgt;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Strength: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.stre;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Speed: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.spd;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Jumping: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.jmp;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Endurance: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.endu;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\n      </div>\n      <div class=\"span4\">\n        <strong>Shooting</strong><br/ >\n        Inside: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ins;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Layups: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dnk;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Free throws: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ft;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Two pointers: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.fg;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Three pointers: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.tp;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\n      </div>\n      <div class=\"span4\">\n        <strong>Skill</strong><br/ >\n        Blocks: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.blk;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Steals: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.stl;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Dribbling: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.drb;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Passing: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pss;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "<br />\n        Rebounding: ";
  stack1 = depth0.currentRatings;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.reb;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\n      </div>\n    </div>\n  </div>\n</div>\n\n<p></p>\n";
  stack1 = depth0.showTradeFor;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(5, program5, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<ul id=\"player_tabs\" class=\"nav nav-tabs\" data-tabs=\"tabs\">\n    <li class=\"active\"><a href=\"#career_stats\" data-toggle=\"tab\" data-no-davis=\"true\">Career Stats</a></li>\n    <li><a href=\"#playoffs_stats\" data-toggle=\"tab\" data-no-davis=\"true\">Playoffs Stats</a></li>\n    <li><a href=\"#game_log\" data-toggle=\"tab\" data-no-davis=\"true\">Game Log</a></li>\n    <li><a href=\"#ratings_history\" data-toggle=\"tab\" data-no-davis=\"true\">Ratings History</a></li>\n</ul>\n<div id=\"my-tab-content\" class=\"tab-content\">\n  <div class=\"tab-pane active\" id=\"career_stats\">\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n    <thead>\n      <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n      <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">PPG</th></tr>\n    </thead>\n    <tbody>\n    ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.stats;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n  <div class=\"tab-pane\" id=\"playoffs_stats\">\n    Not implemented yet\n  </div>\n  <div class=\"tab-pane\" id=\"game_log\">\n    Not implemented yet\n  </div>\n  <div class=\"tab-pane\" id=\"ratings_history\">\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_ratings\">\n    <thead>\n      <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th></tr>\n    </thead>\n    <tbody>\n      ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ratings;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program9, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n</div>";
  return buffer;});
templates['freeAgents'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	    [ '<a href=\"#\"><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></a>', '";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.contractExp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '<form action=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/negotiation/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" method=\"POST\" style=\"margin: 0\"><input type=\"hidden\" name=\"new\" value=\"1\"><button type=\"submit\" class=\"btn btn-mini btn-primary\">Negotiate</button></form>' ],\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.datatable($('#free_agents'), 4, [\n    ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n} );\n</script>\n\n<h1>Free Agents</h1>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"free_agents\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>\n";
  return buffer;});
templates['boxScore'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n  <h3><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></h2>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n  <thead>\n    <tr><th>Name</th><th>Pos</th><th>Min</th><th>FG</th><th>3Pt</th><th>FT</th><th>Off</th><th>Reb</th><th>Ast</th><th>TO</th><th>Stl</th><th>Blk</th><th>PF</th><th>Pts</th></tr>\n  </thead>\n  <tbody>\n  ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program2, data, depth1)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program2, data, depth1)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </tbody>\n  <tfoot>\n    <tr><td>Total</td><td></td><td>240</td><td>";
  foundHelper = helpers.fg;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fg; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fga;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fga; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.tpa;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tpa; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ft;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ft; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fta;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fta; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.orb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.orb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.trb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.trb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ast;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ast; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tov;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tov; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stl;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.stl; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.blk;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.blk; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pf;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pf; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pts;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pts; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td></tr>\n  </tfoot>\n  </table>\n";
  return buffer;}
function program2(depth0,data,depth2) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n    <tr><td><a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.fg;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fg; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fga;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fga; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.tpa;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tpa; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ft;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ft; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.fta;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fta; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.orb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.orb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.trb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.trb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ast;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ast; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tov;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tov; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stl;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.stl; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.blk;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.blk; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pf;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pf; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pts;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pts; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td></tr>\n  ";
  return buffer;}

  buffer += "<h2><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.won;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.won;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.won;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a> ";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.won;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pts;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + ", <a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lost;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lost;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lost;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a> ";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lost;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pts;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h2>\n";
  stack1 = depth0.game;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});
templates['standings'] = template(function (Handlebars,depth0,helpers,partials,data,depth1) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data,depth2) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <tr><td>1. <a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td align=\"right\">GB</td></tr>\n      ";
  return buffer;}

function program6(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n  <h2>";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h2>\n  <div class=\"row-fluid\">\n    <div class=\"span9\">\n      ";
  foundHelper = helpers.divs;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth1)}); }
  else { stack1 = depth0.divs; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.divs) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth1)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </div>\n\n    <div class=\"span3\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n      <thead>\n        <tr><th width=\"100%\">Team</th><th align=\"right\">GB</th></tr>\n      </thead>\n      <tbody>\n      ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program10, data, depth1)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program10, data, depth1)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n      </table>\n    </div>\n  </div>\n";
  return buffer;}
function program7(depth0,data,depth2) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n          <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n          <thead>\n            <tr><th width=\"100%\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Home</th><th>Road</th><th>Div</th><th>Conf</th><th>Streak</th><th>L10</th></tr>\n          </thead>\n          <tbody>\n          ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program8, data, depth2)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program8, data, depth2)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n          </tbody>\n          </table>\n      ";
  return buffer;}
function program8(depth0,data,depth3) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n            <tr><td><a href=\"/l/";
  stack1 = depth3['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.won;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.won; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.lost;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lost; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.winp;
  foundHelper = helpers.roundWinp;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "roundWinp", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>GB</td><td>";
  foundHelper = helpers.wonHome;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.wonHome; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostHome;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lostHome; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.wonRoad;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.wonRoad; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostRoad;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lostRoad; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.wonDiv;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.wonDiv; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostDiv;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lostDiv; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.wonConf;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.wonConf; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostConf;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lostConf; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>Streak</td><td>L10</td></tr>\n          ";
  return buffer;}

function program10(depth0,data,depth2) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <tr><td>1. <a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td align=\"right\">GB</td></tr>\n      ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    bbgm.dropdown($('#standings_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/standings\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"standings_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Standings</h1>\n<!-- ko foreach: confs -->\n  <h2 data-bind=\"text: name\"></h2>\n  <div class=\"row-fluid\">\n    <div class=\"span9\">\n      <!-- ko foreach: divs -->\n        <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n        <thead>\n          <tr><th width=\"100%\" data-bind=\"text: name\"></th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Home</th><th>Road</th><th>Div</th><th>Conf</th><th>Streak</th><th>L10</th></tr>\n        </thead>\n        <tbody data-bind=\"template: {name: 'div-row-template', foreach: teams}\"></tbody>\n        </table>\n      <!-- /ko -->\n    </div>\n\n    <div class=\"span3\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n      <thead>\n        <tr><th width=\"100%\">Team</th><th align=\"right\">GB</th></tr>\n      </thead>\n      <tbody>\n      ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth1)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth1)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n      </table>\n    </div>\n  </div>\n<!-- /ko -->\n\n";
  foundHelper = helpers.confs;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program6, data, depth0)}); }
  else { stack1 = depth0.confs; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.confs) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program6, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<script type=\"text/html\" id=\"div-row-template\">\n  <tr><td><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"><span data-bind=\"text: region\"></span> <span data-bind=\"text: name\"></span></a></td><td data-bind=\"text: won\"> </td><td data-bind=\"text: lost\"> </td><td>";
  stack1 = depth0.winp;
  foundHelper = helpers.roundWinp;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "roundWinp", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>GB</td><td><span data-bind=\"text: wonHome\"></span>-<span data-bind=\"text: lostHome\"></span></td><td><span data-bind=\"text: wonAway\"></span>-<span data-bind=\"text: lostAway\"></span></td><td>";
  foundHelper = helpers.wonDiv;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.wonDiv; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostDiv;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lostDiv; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.wonConf;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.wonConf; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostConf;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lostConf; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>Streak</td><td>L10</td></tr>\n</script>";
  return buffer;});
templates['schedule'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n  <li><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>\n  ";
  foundHelper = helpers.vsat;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.vsat; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\n  <a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>\n";
  return buffer;}

  buffer += "<h1>Upcoming Schedule</h1>\n\n<ol>\n";
  foundHelper = helpers.games;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.games; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.games) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ol>\n";
  return buffer;});
templates['finances'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      [ '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  stack1 = depth0.att;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = depth0.revenue;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M', '$";
  stack1 = depth0.profit;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M', '$";
  stack1 = depth0.cash;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M', '$";
  stack1 = depth0.payroll;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M' ],\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function () {\n  bbgm.datatableSinglePage($('#finances'), 5, [\n    ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<h1>Finances</h1>\n\n<p>The current salary cap is <strong>$";
  stack1 = depth0.salaryCap;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M</strong>.</p>\n\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"finances\">\n  <thead>\n    <tr><th>Team</th><th>Avg Attendance</th><th>Revenue (YTD)</th><th>Profit (YTD)</th><th>Cash</th><th>Payroll</th></tr>\n  </thead>\n  </table>\n</p>";
  return buffer;});
templates['playerRatings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      ['<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth1.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.hgt;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.hgt; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.stre;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.stre; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.spd;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.spd; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.jmp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.jmp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.endu;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.endu; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ins;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ins; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.dnk;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.dnk; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ft;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ft; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.fg;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.fg; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.tp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.blk;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.blk; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.stl;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.stl; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.drb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.drb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pss;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pss; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.reb;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.reb; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "'],\n    ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.dropdown($('#player_ratings_select_season'));\n\n  bbgm.datatable($('#player_ratings'), 4, [\n    ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player_ratings\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"player_ratings_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Ratings</h1>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_ratings\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th></tr>\n</thead>\n</table>\n</p>\n";
  return buffer;});
templates['playButton'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        ";
  foundHelper = helpers.normal_link;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data)}); }
  else { stack1 = depth0.normal_link; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.normal_link) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  return buffer;}
function program2(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n          <li><a href=\"";
  foundHelper = helpers.url;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.label;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></li>\n        ";
  return buffer;}

function program4(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n          <li><a onclick=\"";
  foundHelper = helpers.url;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" href=\"javascript:void(0);\">";
  foundHelper = helpers.label;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></li>\n        ";
  return buffer;}

  buffer += "<ul class=\"nav btn btn-primary\">\n  <li class=\"dropdown\">\n    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">Play <b class=\"caret\"></b></a>\n    <ul class=\"dropdown-menu\">\n      ";
  foundHelper = helpers.options;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.options; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.options) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </ul>\n  </li>\n</ul>\n";
  return buffer;});
templates['dashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n    <li>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"><h3>League ";
  foundHelper = helpers.lid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h3><span class=\"clearfix\">";
  foundHelper = helpers.team;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.team; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span><span class=\"clearfix\">Phase</span></a>\n      <form action=\"/delete_league\" method=\"POST\"><input type=\"hidden\" name=\"lid\" value=\"";
  foundHelper = helpers.lid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"><button class=\"btn btn-mini\">Delete</button></form>\n    </li>\n  ";
  return buffer;}

  buffer += "<h1>Active Leagues</h1>\n\n<ul class=\"dashboard_league\">\n  ";
  foundHelper = helpers.leagues;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.leagues; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.leagues) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n  <li class=\"dashboard_league_new\"><a href=\"/new_league\"><h2>Create new league</h2></a></li>\n</ul>\n";
  return buffer;});
templates['playerStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	    ['<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth1.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.gp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.gs;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gs; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fg;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fga;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fgp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tpa;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tpp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ft;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fta;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ftp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.orb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.drb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tov;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.stl;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.blk;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pf;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "'],\n    ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.dropdown($('#player_stats_select_season'));\n\n  bbgm.datatable($('#player_stats'), 23, [\n    ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"player_stats_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Stats</h1>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n<thead>\n  <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th></tr>\n</thead>\n</table>\n</p>\n";
  return buffer;});
templates['draftSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	          ['";
  foundHelper = helpers.rnd;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.rnd; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.pick;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pick; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.draftAbbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.draftAbbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.draftAbbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.draftAbbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.draftAge;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.draftAge; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.draftOvr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.draftOvr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.draftPot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.draftPot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.currentAbbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.currentAbbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.currentAbbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.currentAbbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.currentAge;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.currentAge; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.currentOvr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.currentOvr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.currentPot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.currentPot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.gp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "'],\n        ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    bbgm.dropdown($('#draft_select_season'));\n\n    bbgm.datatableSinglePage($('#draft_results'), 0, [\n        ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ]);\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/draft\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"draft_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " Draft Results</h1>\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"draft_results\">\n  <thead>\n    <tr><th colspan=\"3\"></th><th colspan=\"4\" style=\"text-align: center\">At Draft</th><th colspan=\"4\" style=\"text-align: center\">Current</th><th colspan=\"5\" style=\"text-align: center\">Career Stats</th></tr>\n    <tr><th>Pick</th><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th title=\"Games Played\">GP</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">PPG</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th></tr>\n  </thead>\n  </table>\n</p>\n";
  return buffer;});
templates['negotiationList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	    [ '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.contractExp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/negotiation/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" class=\"btn btn-mini btn-primary\">Negotiate</a>' ],\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.datatable($('#negotiation_list'), 4, [\n    ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n} );\n</script>\n\n<h1>Players With Expiring Contracts</h1>\n\n<p>You are allowed to go over the salary cap to resign your players before they become free agents. If you do not resign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.</p>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"negotiation_list\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>";
  return buffer;});
templates['negotiation'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <p>You are allowed to go over the salary cap to make this deal because you are resigning <a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a> to a contract extension. <strong>If you do not come to an agreement here, <a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a> will become a free agent.</strong> He will then be able to sign with any team, and you won't be able to go over the salary cap to sign him.</p>\n";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <p>You are not allowed to go over the salary cap to make this deal because <a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a> is a free agent.</p>\n";
  return buffer;}

  buffer += "<h1>Contract negotiation</h1>\n\n";
  stack1 = depth0.resigning;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2>";
  stack1 = depth0.team;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.team;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h2>\n    <p>Current Payroll: $";
  stack1 = depth0.payroll;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M</p>\n    <p>Salary Cap: $";
  stack1 = depth0.salaryCap;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M</p>\n    <h2>Your Proposal</h2>\n    <form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/negotiation/";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"text\" name=\"teamYears\" id=\"teamYears\" class=\"span1\" value=\"";
  stack1 = depth0.negotiation;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teamYears;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"> years\n      <p><div class=\"input-prepend input-append\">\n        <span class=\"add-on\">$</span><input type=\"text\" name=\"teamAmount\" id=\"teamAmount\" class=\"span1\" value=\"";
  stack1 = depth0.negotiation;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teamAmount;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"><span class=\"add-on\">M</span> per year\n      </div></p>\n      <button type=\"submit\" class=\"btn btn-large btn-primary\">Submit Proposal</button>  \n    </form>\n\n    <form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/negotiation/";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"cancel\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-danger\">Can't reach a deal? End negotiation</button>\n    </form>\n\n  </div>\n  <div class=\"span6\">\n    <h2><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></h2>\n    <p>Overal: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ovr;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</p>\n    <p>Potential: ";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pot;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</p>\n    <h2>Player Proposal</h2>\n    <p>";
  stack1 = depth0.negotiation;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.playerYears;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " years (through ";
  stack1 = depth0.negotiation;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.playerExpiration;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + ")</p>\n    <p>$";
  stack1 = depth0.negotiation;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.playerAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 3, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 3, {hash:{}});
  buffer += escapeExpression(stack1) + "M per year</p>\n    <form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/negotiation/";
  stack1 = depth0.player;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"accept\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-large btn-primary\" id=\"accept\">Accept Player Proposal</button>\n    </form>\n  </div>\n</div>\n";
  return buffer;});
templates['gameLogList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n    <tr id=\"";
  foundHelper = helpers.gid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"><td>";
  stack1 = depth0.home;
  stack1 = helpers.unless.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  foundHelper = helpers.oppAbbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.oppAbbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.won;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(6, program6, data),fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</td><td>";
  foundHelper = helpers.pts;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pts; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.oppPts;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.oppPts; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
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
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.games; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.games) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</tbody>\n</table>\n";
  return buffer;});
templates['leaders'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n    ";
  stack1 = depth0.newRow;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(5, program5, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    <div class=\"span4\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed leaders\">\n      <thead>\n        <tr><th>";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</th><th title=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.stat;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.stat; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</th></tr>\n      </thead>\n      <tbody>\n        ";
  foundHelper = helpers.data;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth1)}); }
  else { stack1 = depth0.data; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.data) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth1)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n      </table>\n    </div>\n  ";
  return buffer;}
function program5(depth0,data) {
  
  
  return "\n</div>\n<p></p>\n<div class=\"row-fluid\">\n    ";}

function program7(depth0,data,depth2) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n          <tr";
  stack1 = depth0.userTeam;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(8, program8, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td>";
  foundHelper = helpers['i'];
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0['i']; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + ". <a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>, <a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth2.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  stack1 = depth0.stat;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</tr>\n        ";
  return buffer;}
function program8(depth0,data) {
  
  
  return " class=\"alert-info\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.dropdown($(\"#leaders_select_season\"));\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/leaders\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"leaders_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>League Leaders</h1>\n\n<p></p>\n<div class=\"row-fluid\">\n  ";
  foundHelper = helpers.categories;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0)}); }
  else { stack1 = depth0.categories; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.categories) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>";
  return buffer;});
templates['playoffs'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data) {
  
  
  return "<p>This is what the playoff matchups would be if the season ended right now.</p>";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.dropdown($('#playoffs_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/playoffs\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"playoffs_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " Playoffs</h1>\n\n";
  stack1 = depth0.finalMatchups;
  stack1 = helpers.unless.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table-condensed\" width=\"100%\">\n<tbody>\n  <tr>\n    <td width=\"14.28%\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 0, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 0, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\" width=\"14.28%\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 1, 0, {hash:{}}) : helperMissing.call(depth0, "matchup", 1, 0, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 2, 0, {hash:{}}) : helperMissing.call(depth0, "matchup", 2, 0, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 3, 0, {hash:{}}) : helperMissing.call(depth0, "matchup", 3, 0, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"4\" width=\"14.28%\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 2, 1, {hash:{}}) : helperMissing.call(depth0, "matchup", 2, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\" width=\"14.28%\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 1, 2, {hash:{}}) : helperMissing.call(depth0, "matchup", 1, 2, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td width=\"14.28%\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 4, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 4, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 1, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td>\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 5, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 5, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 2, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 2, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 1, 1, {hash:{}}) : helperMissing.call(depth0, "matchup", 1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td rowspan=\"2\">\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 1, 3, {hash:{}}) : helperMissing.call(depth0, "matchup", 1, 3, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td>\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 6, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 6, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n  <tr>\n    <td>\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 3, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 3, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n    <td>\n      ";
  foundHelper = helpers.matchup;
  stack1 = foundHelper ? foundHelper.call(depth0, 0, 7, {hash:{}}) : helperMissing.call(depth0, "matchup", 0, 7, {hash:{}});
  buffer += escapeExpression(stack1) + "\n    </td>\n  </tr>\n</tbody>\n</table>\n</p>\n";
  return buffer;});
templates['gameLog'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(5, program5, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program5(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n  // Load game log list table and activate form\n  $(document).ready(function () {\n    function loadGameLogList(abbrev, season, firstTime) {\n      abbrev = typeof abbrev !== \"undefined\" ? abbrev : undefined;\n      season = typeof season !== \"undefined\" ? season : undefined;\n      firstTime = typeof season !== \"undefined\" ? firstTime : false;\n\n      api.gameLogList(abbrev, season, firstTime, function (content) {\n          $('#game_log_list').html(content);\n\n          if (firstTime) {\n              // Click the first one to show its boxscore by default\n              $('#game_log_list tbody tr').first().click();\n          }\n      });\n    }\n\n    $game_log_select_season = $('#game_log_select_season')\n    $game_log_select_season.change(function(event) { loadGameLogList($game_log_select_abbrev.val(), $game_log_select_season.val()); });\n    $game_log_select_abbrev = $('#game_log_select_abbrev')\n    $game_log_select_abbrev.change(function(event) { loadGameLogList($game_log_select_abbrev.val(), $game_log_select_season.val()); });\n    if ($game_log_select_season.length && $game_log_select_abbrev.length) {\n      loadGameLogList($game_log_select_abbrev.val(), $game_log_select_season.val(), true);\n    }\n\n    // Clickable rows for game log list table\n    $(document).on('click', '#game_log_list tbody tr', function(event) {\n      $clicked_tr = $(this);\n      api.boxScore($clicked_tr.attr('id'), function(content) {\n        // Update boxscore\n        $('#game_log_box_score').html(content);\n\n        // Update gamelist highlighting\n        $clicked_tr.parent().children().each(function() {\n          $(this).removeClass('alert-info');\n        });\n        $clicked_tr.addClass('alert-info');\n      });\n    });\n  });\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/game_log\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"game_log_select_abbrev\" name=\"team\" class=\"team\">\n    ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <select id=\"game_log_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Game Log</h1>\n\n<p>\n<div class=\"row-fluid\">\n  <div class=\"span9\">\n    <div id=\"game_log_box_score\">\n      <p>Select a game from the menu on the right to view a box score.</p>\n    </div>\n  </div>\n\n  <div class=\"span3\" id=\"game_log_list\">\n  </div>\n</div>\n</p>\n";
  return buffer;});
templates['newLeague'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.tid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.tid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</option>\n    ";
  return buffer;}

  buffer += "<h1>Create New League</h1>\n<form action=\"/new_league\" method=\"POST\">\n  <label>Which team do you want to manage?\n  <select name=\"tid\">\n    ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select></label>\n  <label><select name=\"players\">\n    <option value=\"nba2012\">2012 NBA Players</option>\n    <option value=\"random\">Random Players</option>\n  </select></label>\n  <button type=\"submit\" class=\"btn\">Create New League</button>  \n</form>\n";
  return buffer;});
templates['teamStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	    ['<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.gp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.won;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.won; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.lost;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lost; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fg;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fga;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fgp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tpa;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tpp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ft;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.fta;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ftp;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.orb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.drb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.tov;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.stl;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.blk;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pf;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "', '";
  stack1 = depth0.oppPts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "'],\n    ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.dropdown($('#team_stats_select_season'));\n\n  bbgm.datatableSinglePage($('#team_stats'), 2, [\n    ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/team_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"team_stats_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Team Stats</h1>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"team_stats\">\n<thead>\n  <tr><th colspan=\"4\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"7\"></th></tr>\n  <tr><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Won\">W</th><th title=\"Lost\">L</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Opponent's Points\">OPts</th></tr>\n</thead>\n</table>\n</p>";
  return buffer;});
templates['history'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(2, program2, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <h5>";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h5>\n      ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program5, data, depth1)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program5, data, depth1)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program5(depth0,data,depth2) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a> (<a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth2.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>)<br>\n      ";
  return buffer;}

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <h5>";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h5>\n      ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program8, data, depth1)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program8, data, depth1)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program8(depth0,data,depth2) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a> (<a href=\"/l/";
  stack1 = depth2['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth2.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>)<br>\n      ";
  return buffer;}

function program10(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a> (<a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  stack1 = depth1.season;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>) ";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "<br>\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  bbgm.dropdown($('#history_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/history\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"history_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " Season Summary</h1>\n\n<p></p>\n<div class=\"row-fluid\">\n  <div class=\"span4\">\n    <h4>League Champions</h4>\n    <p><strong><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.champ;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.champ;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.champ;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></strong><br>\n    <a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/playoffs/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">Playoffs Bracket</a></p>\n    <h4>Best Record</h4>\n    <p>East: <a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.bre;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.bre;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.bre;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a> (";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.bre;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.won;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "-";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.bre;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lost;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + ")<br>\n    West: <a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.brw;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.brw;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.brw;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a> (";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.brw;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.won;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "-";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.brw;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lost;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + ")<br></p>\n    <h4>Most Valueable Player</h4>\n    <p><strong><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.mvp;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.mvp;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.mvp;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.mvp;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.mvp;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " pts, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.mvp;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.mvp;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " ast</p>\n    <h4>Defensive Player of the Year</h4>\n    <p><strong><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dpoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dpoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dpoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dpoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dpoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dpoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.blk;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " blk, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.dpoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.stl;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " stl</p>\n    <h4>Sixth Man of the Year</h4>\n    <p><strong><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.smoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.smoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.smoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.smoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.smoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " pts, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.smoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.smoy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " ast</p>\n    <h4>Rookie of the Year</h4>\n    <p><strong><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.roy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.roy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.roy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.roy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.abbrev;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.roy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " pts, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.roy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.roy;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + " ast</p>\n  </div>\n  <div class=\"span4\">\n    <h4>All-League Teams</h4>\n    ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.allLeague;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program4, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n  <div class=\"span4\">\n    <h4>All-Defensive Teams</h4>\n    ";
  stack1 = depth0.awards;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.allDefensive;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>\n<div class=\"row-fluid\">\n  <div class=\"span12\">\n    <h4>Retired Players</h4>\n    ";
  foundHelper = helpers.retiredPlayers;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program10, data, depth0)}); }
  else { stack1 = depth0.retiredPlayers; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.retiredPlayers) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program10, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>";
  return buffer;});
templates['error'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h1>Error</h1>\n\n";
  foundHelper = helpers.error;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.error; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\n";
  return buffer;});
templates['league_layout'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"contentwrapper\">\n  <div id=\"league_content\">\n  </div>\n</div>\n\n<div id=\"league_menu\" data-lid=\"";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">\n  <div class=\"well sidebar-nav\">\n    <ul class=\"nav nav-list\" id=\"league_sidebar\">\n      <li id=\"nav_league_dashboard\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\">Dashboard</a></li>\n      <li class=\"nav-header\">League</li>\n      <li id=\"nav_standings\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/standings\">Standings</a></li>\n      <li id=\"nav_playoffs\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/playoffs\">Playoffs</a></li>\n      <li id=\"nav_finances\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/finances\">Finances</a></li>\n      <li id=\"nav_history\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/history\">History</a></li>\n      <li class=\"nav-header\">Team</li>\n      <li id=\"nav_roster\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster\">Roster</a></li>\n      <li id=\"nav_schedule\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/schedule\">Schedule</a></li>\n      <li id=\"nav_history\"><a href=\"#\">History</a></li>\n      <li class=\"nav-header\">Players</li>\n      <li id=\"nav_free_agents\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/free_agents\">Free Agents</a></li>\n      <li id=\"nav_trade\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/trade\">Trade</a></li>\n      <li id=\"nav_draft\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/draft\">Draft</a></li>\n      <li class=\"nav-header\">Stats</li>\n      <li id=\"nav_game_log\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/game_log\">Game Log</a></li>\n      <li id=\"nav_leaders\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/leaders\">League Leaders</a></li>\n      <li id=\"nav_player_ratings\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player_ratings\">Player Ratings</a></li>\n      <li id=\"nav_player_stats\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player_stats\">Player Stats</a></li>\n      <li id=\"nav_team_stats\"><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/team_stats\">Team Stats</a></li>\n    </ul>\n  </div>\n</div>\n";
  return buffer;});
templates['tradeSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <li><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program3(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <li><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program5(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <li><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <li><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<p class=\"alert alert-error\"><strong>Warning!</strong> ";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.warning;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</p>";
  return buffer;}

function program11(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "<p class=\"alert alert-info\">";
  foundHelper = helpers.message;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.message; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</p>\n";
  return buffer;}

function program13(depth0,data) {
  
  
  return " disabled=\"disabled\"";}

  buffer += "<h3>Trade Summary</h3>\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h4>";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h4>\n    <h5>Trade Away:</h5>\n    <ul>\n      ";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trade;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.total;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Receive:</h5>\n    <ul>\n      ";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trade;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program3, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.total;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Payroll after trade: $";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.payrollAfterTrade;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M</h5>\n    <h5>Salary cap: $";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.salaryCap;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M</h5>\n  </div>\n  <div class=\"span6\">\n    <h4>";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h4>\n    <h5>Trade Away:</h5>\n    <ul>\n      ";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trade;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program5, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.total;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Receive:</h5>\n    <ul>\n      ";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.trade;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  stack1 = stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program7, data, depth0)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[0];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.total;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Payroll after trade: $";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.teams;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1[1];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.payrollAfterTrade;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M</h5>\n    <h5>Salary cap: $";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.salaryCap;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M</h5>\n  </div>\n</div>\n\n<br>\n";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.warning;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(9, program9, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = depth0.message;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(11, program11, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<center>\n  <form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\" id=\"propose_trade\">\n    <input type=\"hidden\" name=\"propose\" value=\"1\">\n    <button type=\"submit\" class=\"btn btn-large btn-primary\"";
  stack1 = depth0.summary;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.disablePropose;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(13, program13, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Propose Trade</button>\n  </form>\n\n  <form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\" id=\"clear_trade\">\n    <input type=\"hidden\" name=\"clear\" value=\"1\">\n    <button type=\"submit\" class=\"btn\">Clear Trade</button>\n  </form>\n</center>\n";
  return buffer;});
templates['draft'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " style=\"display: none;\"";}

function program3(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <tr id=\"undrafted_";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"><td><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "<td>";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td><button class=\"btn btn-mini btn-primary\" data-player-id=\"";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth1.started;
  stack1 = helpers.unless.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Draft</button></td></tr>\n      ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " disabled=\"disabled\"";}

function program6(depth0,data,depth1) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <tr><td>";
  foundHelper = helpers.rnd;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.rnd; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.pick;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pick; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td><a href=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "<td>";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td></tr>\n      ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    function updateDraftTables(pids) {\n        for (var i=0; i<pids.length; i++) {\n            var draftedPlayer = new Array(5);\n            // Find row in undrafted players table, get metadata, delete row\n            var undraftedTds = $('#undrafted_' + pids[i] + ' td')\n            for (var j=0; j<5; j++) {\n                draftedPlayer[j] = undraftedTds[j].innerHTML;\n            }\n\n            // Find correct row (first blank row) in drafted players table, write metadata\n            var draftedRows = $('#drafted tbody tr');\n            for (var j=0; j<draftedRows.length; j++) {\n                if (draftedRows[j].children[3].innerHTML.length == 0) {\n                    $('#undrafted_' + pids[i]).remove();\n                    draftedRows[j].children[2].innerHTML = draftedPlayer[0];\n                    draftedRows[j].children[3].innerHTML = draftedPlayer[1];\n                    draftedRows[j].children[4].innerHTML = draftedPlayer[2];\n                    draftedRows[j].children[5].innerHTML = draftedPlayer[3];\n                    draftedRows[j].children[6].innerHTML = draftedPlayer[4];\n                    break;\n                }\n            }\n        }\n    }\n\n    \n\n    function draftUntilUserOrEnd() {\n        api.draftUntilUserOrEnd(function (pids, done) {\n          updateDraftTables(pids);\n          if (!done) {\n              $('#undrafted button').removeAttr('disabled');\n          }\n      });\n    }\n\n    $('#start_draft').click(function(event) {\n        $($('#start_draft').parent()).hide()\n        draftUntilUserOrEnd();\n    });\n\n    $('#undrafted button').click(function(event) {\n        $('#undrafted button').attr('disabled', 'disabled');\n        api.draftUser(this.getAttribute('data-player-id'), function (pid) {\n            updateDraftTables([pid]);\n            draftUntilUserOrEnd();\n        });\n    });\n});\n</script>\n\n<h1>Draft</h1>\n\n<p>When your turn in the draft comes up, select from the list of available players on the left.</p>\n\n<p";
  stack1 = depth0.started;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><button class=\"btn btn-large btn-primary\" id=\"start_draft\">Start draft</button></p>\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2>Undrafted Players</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"undrafted\">\n    <thead>\n      <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Draft</th></tr>\n    </thead>\n    <tbody>\n      ";
  foundHelper = helpers.undrafted;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program3, data, depth0)}); }
  else { stack1 = depth0.undrafted; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.undrafted) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program3, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n  <div class=\"span6\">\n    <h2>Draft Results</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"drafted\">\n    <thead>\n      <tr><th>Pick</th><th>Team</th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th></tr>\n    </thead>\n    <tbody>\n      ";
  foundHelper = helpers.drafted;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program6, data, depth0)}); }
  else { stack1 = depth0.drafted; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.drafted) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program6, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n</div>\n";
  return buffer;});
templates['roster'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        // Roster reordering\n        function highlightHandles() {\n            var i = 1;\n            $('#roster tbody').children().each(function() {\n                if (i <= 5) {\n                    $(this).find('td:first').removeClass('btn-info').addClass('btn-primary');\n                } else {\n                    $(this).find('td:first').removeClass('btn-primary').addClass('btn-info');\n                }\n                i++;\n            });\n        }\n        highlightHandles();\n        var fixHelper = function(e, ui) {\n            // Return helper which preserves the width of table cells being reordered\n            ui.children().each(function() {\n                $(this).width($(this).width());\n            });\n            return ui;\n        };\n        $(\"#roster tbody\").sortable({\n            helper: fixHelper,\n            cursor: \"move\",\n            update: function(e, ui) {\n                var i, sortedPids;\n\n                sortedPids = $(this).sortable(\"toArray\");\n                for (i = 0; i < sortedPids.length; i++) {\n                    sortedPids[i] = parseInt(sortedPids[i].substr(7), 10);\n                }\n\n                api.rosterReorder(sortedPids, function () {\n                    highlightHandles();\n                });\n            }\n        }).disableSelection();\n        $(\"#auto_sort_roster\").click(function(event) {\n            api.rosterAutoSort();\n        });\n\n        // Release player\n        $(\"#roster button\").click(function(event) {\n            if (this.dataset.action === \"release\") {\n                if (window.confirm('Are you sure you want to release ' + this.dataset.playerName + '?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ' + this.dataset.contractExpiration + '.')) {\n                    var tr = this.parentNode.parentNode;\n                    api.rosterRelease(this.dataset.playerId, function(error) {\n                        if (error) {\n                            alert(\"Error: \" + error);\n                        }\n                        else {\n                            tr.parentNode.removeChild(tr);\n                            highlightHandles();\n                        }                        \n                    })\n                }\n            }\n            else if (this.dataset.action === \"buyOut\") {\n                if (";
  stack1 = depth0.team;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.cash;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " > this.dataset.cashOwed) {\n                    if (window.confirm('Are you sure you want to buy out ' + this.dataset.playerName + '? You will have to pay him the $' + this.dataset.cashOwed + 'M remaining on his contract from your current cash reserves of $";
  stack1 = depth0.team;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.cash;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "M. He will then become a free agent and his contract will no longer count towards your salary cap.')) {\n                        var tr = this.parentNode.parentNode;\n                        $.post('/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster_buy_out', {'pid': this.dataset.playerId}, function (data) {\n                            if (data['error']) {\n                                alert('Error: ' + data['error']);\n                            }\n                            else {\n                                tr.parentNode.removeChild(tr);\n                                highlightHandles();\n                            }\n                        }, 'json');\n                    }\n                }\n                else {\n                    alert('You only have $";
  stack1 = depth0.team;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.cash;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "M in cash, but it would take $' + this.dataset.cashOwed + 'M to buy out ' + this.dataset.playerName + '.');\n                }\n            }\n            else if (this.dataset.action === \"tradeFor\") {\n\n            }\n        });\n    ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.abbrev;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.abbrev; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.region;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.region; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</option>\n    ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program6(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <option value=\"";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(7, program7, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.season;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.season; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " season</option>\n    ";
  return buffer;}
function program7(depth0,data) {
  
  
  return " selected=\"selected\"";}

function program9(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n  <p>You currently have ";
  foundHelper = helpers.numRosterSpots;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.numRosterSpots; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
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
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n    <tr id=\"roster_";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth1.sortable;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(20, program20, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<td><a href=\"/l/";
  stack1 = depth1['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.pos;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pos; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.age;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.age; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ovr;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ovr; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pot;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pot; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td>";
  stack1 = depth1.currentSeason;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(22, program22, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<td>";
  stack1 = depth0.min;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.pts;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.trb;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = depth0.ast;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "</td>";
  stack1 = depth1.sortable;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(24, program24, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = depth1.showTradeFor;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(26, program26, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</tr>\n  ";
  return buffer;}
function program20(depth0,data) {
  
  
  return "<td class=\"roster_handle\"></td>";}

function program22(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "<td>$";
  stack1 = depth0.contractAmount;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.contractExp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td>";
  return buffer;}

function program24(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "<td><button class=\"btn btn-mini\" data-action=\"release\" data-player-id=\"";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" data-player-name=\"";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" data-contract-expiration=\"";
  foundHelper = helpers.contract_exp;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.contract_exp; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">Release</button></td><td><button class=\"btn btn-mini\" data-action=\"buyOut\" data-player-id=\"";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" data-player-name=\"";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" data-cash-owed=\"";
  stack1 = depth0.cash_owed;
  foundHelper = helpers.round;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, 1, {hash:{}}) : helperMissing.call(depth0, "round", stack1, 1, {hash:{}});
  buffer += escapeExpression(stack1) + "\">Buy out</button></td>";
  return buffer;}

function program26(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "<td><form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\" style=\"margin: 0\"><input type=\"hidden\" name=\"pid\" value=\"";
  foundHelper = helpers.pid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.pid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"><button type=\"submit\" class=\"btn btn-mini\">Trade For</button></form></td>";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    bbgm.dropdown($('#roster_select_team'), $('#roster_select_season'));\n\n    ";
  stack1 = depth0.sortable;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n});\n</script>\n\n<form action=\"/l/";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/roster\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"roster_select_team\" name=\"team\" class=\"team\">\n    ";
  foundHelper = helpers.teams;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  else { stack1 = depth0.teams; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.teams) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <select id=\"roster_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(6, program6, data)}); }
  else { stack1 = depth0.seasons; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.seasons) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(6, program6, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>";
  stack1 = depth0.team;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.region;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " ";
  stack1 = depth0.team;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " Roster</h1>\n\n";
  stack1 = depth0.sortable;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(9, program9, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster\">\n<thead>\n  <tr>";
  stack1 = depth0.sortable;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(11, program11, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th>";
  stack1 = depth0.currentSeason;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(13, program13, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th>";
  stack1 = depth0.sortable;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(15, program15, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  stack1 = depth0.showTradeFor;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(17, program17, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</tr>\n</thead>\n<tbody>\n  ";
  foundHelper = helpers.players;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.programWithDepth(program19, data, depth0)}); }
  else { stack1 = depth0.players; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.players) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.programWithDepth(program19, data, depth0)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</tbody>\n</table>\n</p>\n";
  return buffer;});
templates['leagueDashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h1>League ";
  stack1 = depth0['g'];
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.lid;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h1>\n";
  return buffer;});
})();