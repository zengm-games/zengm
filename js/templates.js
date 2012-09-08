(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['player'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        Draft: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.draftYear);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.draftYear", { hash: {} }); }
  buffer += escapeExpression(stack1) + " - Round ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.draftRound);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.draftRound", { hash: {} }); }
  buffer += escapeExpression(stack1) + " (Pick ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.draftPick);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.draftPick", { hash: {} }); }
  buffer += escapeExpression(stack1) + ") by ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.draftAbbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.draftAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n      ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        Undrafted: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.draftYear);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.draftYear", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n      ";
  return buffer;}

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\"><input type=\"hidden\" name=\"pid\" value=\"";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><button type=\"submit\" class=\"btn btn-small\">Trade For</button></form>\n";
  return buffer;}

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n      <tr><td><a href=\"#\">";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.gp;
  stack1 = foundHelper || depth0.gp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.gs;
  stack1 = foundHelper || depth0.gs;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gs", { hash: {} }); }
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
  stack1 = 1;
  foundHelper = helpers.fg;
  stack2 = foundHelper || depth0.fg;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.fga;
  stack2 = foundHelper || depth0.fga;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.fgp;
  stack2 = foundHelper || depth0.fgp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tp;
  stack2 = foundHelper || depth0.tp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tpa;
  stack2 = foundHelper || depth0.tpa;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tpp;
  stack2 = foundHelper || depth0.tpp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.ft;
  stack2 = foundHelper || depth0.ft;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.fta;
  stack2 = foundHelper || depth0.fta;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.ftp;
  stack2 = foundHelper || depth0.ftp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.orb;
  stack2 = foundHelper || depth0.orb;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.drb;
  stack2 = foundHelper || depth0.drb;
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
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tov;
  stack2 = foundHelper || depth0.tov;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.stl;
  stack2 = foundHelper || depth0.stl;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.blk;
  stack2 = foundHelper || depth0.blk;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.pf;
  stack2 = foundHelper || depth0.pf;
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
  buffer += escapeExpression(stack1) + "</td></tr>\n    ";
  return buffer;}

function program9(depth0,data) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n      <tr><td>Career</td><td></td><td></td><td>";
  foundHelper = helpers.gp;
  stack1 = foundHelper || depth0.gp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.gs;
  stack1 = foundHelper || depth0.gs;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gs", { hash: {} }); }
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
  stack1 = 1;
  foundHelper = helpers.fg;
  stack2 = foundHelper || depth0.fg;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.fga;
  stack2 = foundHelper || depth0.fga;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.fgp;
  stack2 = foundHelper || depth0.fgp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tp;
  stack2 = foundHelper || depth0.tp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tpa;
  stack2 = foundHelper || depth0.tpa;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tpp;
  stack2 = foundHelper || depth0.tpp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.ft;
  stack2 = foundHelper || depth0.ft;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.fta;
  stack2 = foundHelper || depth0.fta;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.ftp;
  stack2 = foundHelper || depth0.ftp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.orb;
  stack2 = foundHelper || depth0.orb;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.drb;
  stack2 = foundHelper || depth0.drb;
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
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.tov;
  stack2 = foundHelper || depth0.tov;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.stl;
  stack2 = foundHelper || depth0.stl;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.blk;
  stack2 = foundHelper || depth0.blk;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</td><td>";
  stack1 = 1;
  foundHelper = helpers.pf;
  stack2 = foundHelper || depth0.pf;
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
  buffer += escapeExpression(stack1) + "</td></tr>\n    ";
  return buffer;}

function program11(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n        <tr><td><a href=\"#\">";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td>";
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
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.hgt;
  stack1 = foundHelper || depth0.hgt;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "hgt", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stre;
  stack1 = foundHelper || depth0.stre;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "stre", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.spd;
  stack1 = foundHelper || depth0.spd;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "spd", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.jmp;
  stack1 = foundHelper || depth0.jmp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "jmp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.endu;
  stack1 = foundHelper || depth0.endu;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "endu", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ins;
  stack1 = foundHelper || depth0.ins;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ins", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.dnk;
  stack1 = foundHelper || depth0.dnk;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "dnk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.ft;
  stack1 = foundHelper || depth0.ft;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ft", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.fg;
  stack1 = foundHelper || depth0.fg;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fg", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.tp;
  stack1 = foundHelper || depth0.tp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.blk;
  stack1 = foundHelper || depth0.blk;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "blk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.stl;
  stack1 = foundHelper || depth0.stl;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "stl", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.drb;
  stack1 = foundHelper || depth0.drb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "drb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.pss;
  stack1 = foundHelper || depth0.pss;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pss", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.reb;
  stack1 = foundHelper || depth0.reb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "reb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td></tr>\n      ";
  return buffer;}

  buffer += "<script>\n$(document).ready(function() {\n  $(\"#player_tabs\").tab();\n});\n</script>\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h1>";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h1>\n    <div id=\"picture\" class=\"player_picture\">";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.face);
  foundHelper = helpers.face;
  stack2 = foundHelper || depth0.face;
  if(typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, { hash: {} }); }
  else if(stack2=== undef) { stack1 = helperMissing.call(depth0, "face", stack1, { hash: {} }); }
  else { stack1 = stack2; }
  buffer += escapeExpression(stack1) + "</div>\n    <div style=\"float: left;\">\n      <strong>";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teamRegion);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.teamRegion", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teamName);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.teamName", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</strong><br />\n      Height: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.hgtFt);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.hgtFt", { hash: {} }); }
  buffer += escapeExpression(stack1) + "'";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.hgtIn);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.hgtIn", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"<br />\n      Weight: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.weight);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.weight", { hash: {} }); }
  buffer += escapeExpression(stack1) + " lbs<br />\n      Age: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.age);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n      Born: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.bornYear);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.bornYear", { hash: {} }); }
  buffer += escapeExpression(stack1) + " - ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.bornLoc);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.bornLoc", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n      ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.draftRound);
  stack2 = helpers['if'];
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(3, program3, data);
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      Contract: $";
  stack1 = 2;
  foundHelper = helpers.player;
  stack2 = foundHelper || depth0.player;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.contractAmount);
  if(typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, { hash: {} }); }
  else if(stack2=== undef) { stack1 = helperMissing.call(depth0, "player.contractAmount", stack1, { hash: {} }); }
  else { stack1 = stack2; }
  buffer += escapeExpression(stack1) + "M per year through ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.contractExp);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.contractExp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n    </div>\n  </div>\n  <div class=\"span6\">\n    <h2 class=\"pull-left\">Overall: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ovr);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h2>\n    <h2 class=\"pull-right\">Potential: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pot);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h2><br /><br /><br />\n    <div class=\"row-fluid\">\n      <div class=\"span4\">\n        <strong>Physical</strong><br/ >\n        Height: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.hgt);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.hgt", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Strength: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.stre);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.stre", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Speed: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.spd);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.spd", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Jumping: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.jmp);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.jmp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Endurance: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.endu);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.endu", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\n      </div>\n      <div class=\"span4\">\n        <strong>Shooting</strong><br/ >\n        Inside: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ins);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.ins", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Layups: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.dnk);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.dnk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Free throws: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ft);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.ft", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Two pointers: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.fg);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.fg", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Three pointers: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.tp);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.tp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\n      </div>\n      <div class=\"span4\">\n        <strong>Skill</strong><br/ >\n        Blocks: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.blk);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.blk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Steals: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.stl);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.stl", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Dribbling: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.drb);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.drb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Passing: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pss);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.pss", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br />\n        Rebounding: ";
  foundHelper = helpers.currentRatings;
  stack1 = foundHelper || depth0.currentRatings;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.reb);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentRatings.reb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\n      </div>\n    </div>\n  </div>\n</div>\n\n<p></p>\n";
  foundHelper = helpers.showTradeFor;
  stack1 = foundHelper || depth0.showTradeFor;
  stack2 = helpers['if'];
  tmp1 = self.program(5, program5, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<ul id=\"player_tabs\" class=\"nav nav-tabs\" data-tabs=\"tabs\">\n    <li class=\"active\"><a href=\"#career_stats\" data-toggle=\"tab\" data-no-davis=\"true\">Career Stats</a></li>\n    <li><a href=\"#playoffs_stats\" data-toggle=\"tab\" data-no-davis=\"true\">Playoffs Stats</a></li>\n    <li><a href=\"#game_log\" data-toggle=\"tab\" data-no-davis=\"true\">Game Log</a></li>\n    <li><a href=\"#ratings_history\" data-toggle=\"tab\" data-no-davis=\"true\">Ratings History</a></li>\n</ul>\n<div id=\"my-tab-content\" class=\"tab-content\">\n  <div class=\"tab-pane active\" id=\"career_stats\">\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n    <thead>\n      <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n      <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">PPG</th></tr>\n    </thead>\n    <tbody>\n    ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.stats);
  tmp1 = self.programWithDepth(program7, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.careerStats);
  stack2 = helpers['with'];
  tmp1 = self.program(9, program9, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n  <div class=\"tab-pane\" id=\"playoffs_stats\">\n    Not implemented yet\n  </div>\n  <div class=\"tab-pane\" id=\"game_log\">\n    Not implemented yet\n  </div>\n  <div class=\"tab-pane\" id=\"ratings_history\">\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_ratings\">\n    <thead>\n      <tr><th>Year</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th></tr>\n    </thead>\n    <tbody>\n      ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ratings);
  tmp1 = self.programWithDepth(program11, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n</div>";
  return buffer;});
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

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.dropdown($('#playoffs_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
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
  buffer += "\n  </select>\n</form>\n\n<h1>Playoffs</h1>\n\n";
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
templates['playerStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n	    ['<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth1.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.gp;
  stack1 = foundHelper || depth0.gp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.gs;
  stack1 = foundHelper || depth0.gs;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gs", { hash: {} }); }
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
  foundHelper = helpers.fg;
  stack2 = foundHelper || depth0.fg;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.fga;
  stack2 = foundHelper || depth0.fga;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.fgp;
  stack2 = foundHelper || depth0.fgp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tp;
  stack2 = foundHelper || depth0.tp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tpa;
  stack2 = foundHelper || depth0.tpa;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tpp;
  stack2 = foundHelper || depth0.tpp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.ft;
  stack2 = foundHelper || depth0.ft;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.fta;
  stack2 = foundHelper || depth0.fta;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.ftp;
  stack2 = foundHelper || depth0.ftp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.orb;
  stack2 = foundHelper || depth0.orb;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.drb;
  stack2 = foundHelper || depth0.drb;
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
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tov;
  stack2 = foundHelper || depth0.tov;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.stl;
  stack2 = foundHelper || depth0.stl;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.blk;
  stack2 = foundHelper || depth0.blk;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.pf;
  stack2 = foundHelper || depth0.pf;
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
  buffer += escapeExpression(stack1) + "'],\n    ";
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

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.dropdown($('#player_stats_select_season'));\n\n  ui.datatable($('#player_stats'), 23, [\n    ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"player_stats_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Stats</h1>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_stats\">\n<thead>\n  <tr><th colspan=\"6\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"6\"></th></tr>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Games Started\">GS</th><th title=\"Minutes\">Min</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th></tr>\n</thead>\n</table>\n</p>\n";
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth3.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, ".........lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.gb;
  stack1 = foundHelper || depth0.gb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
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
  foundHelper = helpers.wonAway;
  stack1 = foundHelper || depth0.wonAway;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "wonAway", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lostAway;
  stack1 = foundHelper || depth0.lostAway;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lostAway", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.streak;
  stack1 = foundHelper || depth0.streak;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "streak", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td>";
  foundHelper = helpers.lastTen;
  stack1 = foundHelper || depth0.lastTen;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lastTen", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td></tr>\n          ";
  return buffer;}

function program8(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <tr";
  foundHelper = helpers.separator;
  stack1 = foundHelper || depth0.separator;
  stack2 = helpers['if'];
  tmp1 = self.program(9, program9, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td>";
  foundHelper = helpers.rank;
  stack1 = foundHelper || depth0.rank;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rank", { hash: {} }); }
  buffer += escapeExpression(stack1) + ". <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a></td><td align=\"right\">";
  foundHelper = helpers.gb;
  stack1 = foundHelper || depth0.gb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td></tr>\n      ";
  return buffer;}
function program9(depth0,data) {
  
  
  return " class=\"separator\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    ui.dropdown($('#standings_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
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
templates['negotiationList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n	    [ '<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  stack1 = foundHelper || depth0.contractExp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contractExp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/negotiation/";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" class=\"btn btn-mini btn-primary\">Negotiate</a>' ],\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.datatable($('#negotiation_list'), 4, [\n    ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n} );\n</script>\n\n<h1>Players With Expiring Contracts</h1>\n\n<p>You are allowed to go over the salary cap to resign your players before they become free agents. If you do not resign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.</p>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"negotiation_list\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>";
  return buffer;});
templates['leagueDashboard'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, stack3, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var stack1, stack2;
  foundHelper = helpers.streakLong;
  stack1 = foundHelper || depth0.streakLong;
  stack2 = helpers['if'];
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }}
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += ", ";
  foundHelper = helpers.streakLong;
  stack1 = foundHelper || depth0.streakLong;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "streakLong", { hash: {} }); }
  buffer += escapeExpression(stack1);
  return buffer;}

function program4(depth0,data) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n        <b>";
  foundHelper = helpers.seriesTitle;
  stack1 = foundHelper || depth0.seriesTitle;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "seriesTitle", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</b><br>\n        ";
  stack1 = 0;
  stack2 = 0;
  foundHelper = helpers.matchup;
  stack3 = foundHelper || depth0.matchup;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "matchup", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "<br>\n      ";
  return buffer;}

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  foundHelper = helpers.rank;
  stack1 = foundHelper || depth0.rank;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rank", { hash: {} }); }
  buffer += escapeExpression(stack1) + "th place in conference<br>\n        (Top 8 teams make the playoffs)<br>\n      ";
  return buffer;}

function program8(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/playoffs\">» Playoffs</a>\n      ";
  return buffer;}

function program10(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/playoffs\">» Playoffs Projections</a>\n      ";
  return buffer;}

function program12(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        Next Game: ";
  foundHelper = helpers.nextGameHome;
  stack1 = foundHelper || depth0.nextGameHome;
  stack2 = helpers.unless;
  tmp1 = self.program(13, program13, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.nextGameAbbrev;
  stack1 = foundHelper || depth0.nextGameAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "nextGameAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.nextGameAbbrev;
  stack1 = foundHelper || depth0.nextGameAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "nextGameAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a><br>\n      ";
  return buffer;}
function program13(depth0,data) {
  
  
  return "@";}

function program15(depth0,data) {
  
  
  return "No completed games yet this season.<br>";}

function program17(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        ";
  foundHelper = helpers.home;
  stack1 = foundHelper || depth0.home;
  stack2 = helpers.unless;
  tmp1 = self.program(18, program18, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.oppAbbrev;
  stack1 = foundHelper || depth0.oppAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.oppAbbrev;
  stack1 = foundHelper || depth0.oppAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>, ";
  foundHelper = helpers.won;
  stack1 = foundHelper || depth0.won;
  stack2 = helpers['if'];
  tmp1 = self.program(20, program20, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(22, program22, data);
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth1.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth1.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.gid;
  stack1 = foundHelper || depth0.gid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.pts;
  stack1 = foundHelper || depth0.pts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.oppPts;
  stack1 = foundHelper || depth0.oppPts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppPts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a><br>\n      ";
  return buffer;}
function program18(depth0,data) {
  
  
  return "@";}

function program20(depth0,data) {
  
  
  return "won";}

function program22(depth0,data) {
  
  
  return "lost";}

function program24(depth0,data) {
  
  
  return "None yet.<br>";}

function program26(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth1.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>: <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/standings/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.won;
  stack1 = foundHelper || depth0.won;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "won", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lost;
  stack1 = foundHelper || depth0.lost;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lost", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>";
  foundHelper = helpers.extraText;
  stack1 = foundHelper || depth0.extraText;
  stack2 = helpers['if'];
  tmp1 = self.programWithDepth(program27, data, depth1);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<br>\n      ";
  return buffer;}
function program27(depth0,data,depth2) {
  
  var buffer = "", stack1;
  buffer += ", <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/playoffs/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.extraText;
  stack1 = foundHelper || depth0.extraText;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "extraText", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>";
  return buffer;}

function program29(depth0,data) {
  
  
  return "None.<br>";}

function program31(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n        <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a>: ";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + " yo, ";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ovr, ";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + " pot</span><br>\n      ";
  return buffer;}

function program33(depth0,data) {
  
  
  return "None.<br>";}

function program35(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n        <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a>: ";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + " yo, $";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n        <span style=\"margin-left: 2em\">";
  stack1 = 1;
  foundHelper = helpers.pts;
  stack2 = foundHelper || depth0.pts;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " pts, ";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ovr, ";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + " pot</span><br>\n      ";
  return buffer;}

  buffer += "<h1>";
  foundHelper = helpers.region;
  stack1 = foundHelper || depth0.region;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + " Dashboard</h1>\n\n<div class=\"row-fluid\">\n  <div class=\"span4\">\n    <h3>Current Record</h3>\n    <p>\n      ";
  foundHelper = helpers.won;
  stack1 = foundHelper || depth0.won;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "won", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.lost;
  stack1 = foundHelper || depth0.lost;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lost", { hash: {} }); }
  buffer += escapeExpression(stack1);
  foundHelper = helpers.playoffsStarted;
  stack1 = foundHelper || depth0.playoffsStarted;
  stack2 = helpers.unless;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/standings\">» Standings</a>\n    </p>\n\n    <h3>Playoffs</h3>\n    <p>\n      ";
  foundHelper = helpers.showPlayoffSeries;
  stack1 = foundHelper || depth0.showPlayoffSeries;
  stack2 = helpers['if'];
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(6, program6, data);
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  foundHelper = helpers.playoffsStarted;
  stack1 = foundHelper || depth0.playoffsStarted;
  stack2 = helpers['if'];
  tmp1 = self.program(8, program8, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(10, program10, data);
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </p>\n\n    <h3>Recent Games</h3>\n    <p>\n      ";
  foundHelper = helpers.nextGameAbbrev;
  stack1 = foundHelper || depth0.nextGameAbbrev;
  stack2 = helpers['if'];
  tmp1 = self.program(12, program12, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  foundHelper = helpers.recentGames;
  stack1 = foundHelper || depth0.recentGames;
  stack2 = helpers.unless;
  tmp1 = self.program(15, program15, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  foundHelper = helpers.recentGames;
  stack1 = foundHelper || depth0.recentGames;
  tmp1 = self.programWithDepth(program17, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log\">» Game Log</a><br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/standings\">» Schedule</a>\n    </p>\n\n    <h3>Recent History</h3>\n    <p>\n      ";
  foundHelper = helpers.recentHistory;
  stack1 = foundHelper || depth0.recentHistory;
  stack2 = helpers.unless;
  tmp1 = self.program(24, program24, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  foundHelper = helpers.recentHistory;
  stack1 = foundHelper || depth0.recentHistory;
  tmp1 = self.programWithDepth(program26, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/team_history\">» Team History</a><br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/history\">» League History</a>\n    </p>\n\n  </div>\n  <div class=\"span4\">\n    <h3>Team Stats</h3>\n    <p>\n      Points: ";
  stack1 = 1;
  foundHelper = helpers.pts;
  stack2 = foundHelper || depth0.pts;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " (";
  foundHelper = helpers.ptsRank;
  stack1 = foundHelper || depth0.ptsRank;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ptsRank", { hash: {} }); }
  buffer += escapeExpression(stack1) + "th)<br>\n      Allowed: ";
  stack1 = 1;
  foundHelper = helpers.oppPts;
  stack2 = foundHelper || depth0.oppPts;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " (";
  foundHelper = helpers.oppPtsRank;
  stack1 = foundHelper || depth0.oppPtsRank;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppPtsRank", { hash: {} }); }
  buffer += escapeExpression(stack1) + "th)<br>\n      Rebounds: ";
  stack1 = 1;
  foundHelper = helpers.trb;
  stack2 = foundHelper || depth0.trb;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " (";
  foundHelper = helpers.trbRank;
  stack1 = foundHelper || depth0.trbRank;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "trbRank", { hash: {} }); }
  buffer += escapeExpression(stack1) + "th)<br>\n      Assists: ";
  stack1 = 1;
  foundHelper = helpers.ast;
  stack2 = foundHelper || depth0.ast;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " (";
  foundHelper = helpers.astRank;
  stack1 = foundHelper || depth0.astRank;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "astRank", { hash: {} }); }
  buffer += escapeExpression(stack1) + "th)<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/team_stats\">» Team Stats</a>\n    </p>\n\n    <h3>Team Leaders</h3>\n    <p>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.teamLeaders;
  stack1 = foundHelper || depth0.teamLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teamLeaders.pts.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.teamLeaders;
  stack1 = foundHelper || depth0.teamLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teamLeaders.pts.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>: ";
  stack1 = 1;
  foundHelper = helpers.teamLeaders;
  stack2 = foundHelper || depth0.teamLeaders;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.pts);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.stat);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " pts<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.teamLeaders;
  stack1 = foundHelper || depth0.teamLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trb);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teamLeaders.trb.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.teamLeaders;
  stack1 = foundHelper || depth0.teamLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trb);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teamLeaders.trb.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>: ";
  stack1 = 1;
  foundHelper = helpers.teamLeaders;
  stack2 = foundHelper || depth0.teamLeaders;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.trb);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.stat);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " reb<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.teamLeaders;
  stack1 = foundHelper || depth0.teamLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teamLeaders.ast.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.teamLeaders;
  stack1 = foundHelper || depth0.teamLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "teamLeaders.ast.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>: ";
  stack1 = 1;
  foundHelper = helpers.teamLeaders;
  stack2 = foundHelper || depth0.teamLeaders;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.ast);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.stat);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " ast<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster\">» Full Roster</a>\n    </p>\n\n    <h3>League Leaders</h3>\n    <p>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.pts.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.pts.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>, <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.pts.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pts);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.pts.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>: ";
  stack1 = 1;
  foundHelper = helpers.leagueLeaders;
  stack2 = foundHelper || depth0.leagueLeaders;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.pts);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.stat);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " pts<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trb);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.trb.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trb);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.trb.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>, <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trb);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.trb.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trb);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.trb.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>: ";
  stack1 = 1;
  foundHelper = helpers.leagueLeaders;
  stack2 = foundHelper || depth0.leagueLeaders;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.trb);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.stat);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " reb<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.ast.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.ast.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>, <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.ast.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.leagueLeaders;
  stack1 = foundHelper || depth0.leagueLeaders;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ast);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "leagueLeaders.ast.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>: ";
  stack1 = 1;
  foundHelper = helpers.leagueLeaders;
  stack2 = foundHelper || depth0.leagueLeaders;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.ast);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.stat);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " ast<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/leaders\">» League Leaders</a><br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player_stats\">» Player Stats</a>\n    </p>\n  </div>\n  <div class=\"span4\">\n    <h3>Finances</h3>\n    <p>\n      Avg Attendance: ";
  foundHelper = helpers.att;
  stack1 = foundHelper || depth0.att;
  foundHelper = helpers.round;
  stack2 = foundHelper || depth0.round;
  if(typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, { hash: {} }); }
  else if(stack2=== undef) { stack1 = helperMissing.call(depth0, "round", stack1, { hash: {} }); }
  else { stack1 = stack2; }
  buffer += escapeExpression(stack1) + "<br>\n      Revenue (YTD): $";
  stack1 = 2;
  foundHelper = helpers.revenue;
  stack2 = foundHelper || depth0.revenue;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n      Profit (YTD): $";
  stack1 = 2;
  foundHelper = helpers.profit;
  stack2 = foundHelper || depth0.profit;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n      Cash: $";
  stack1 = 2;
  foundHelper = helpers.cash;
  stack2 = foundHelper || depth0.cash;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n      Payroll: $";
  stack1 = 2;
  foundHelper = helpers.payroll;
  stack2 = foundHelper || depth0.payroll;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n      Salary Cap: $";
  stack1 = 2;
  foundHelper = helpers.salaryCap;
  stack2 = foundHelper || depth0.salaryCap;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/finances\">» League Finances</a>\n    </p>\n\n    <h3>Top Free Agents</h3>\n    <p>\n      ";
  foundHelper = helpers.freeAgents;
  stack1 = foundHelper || depth0.freeAgents;
  stack2 = helpers.unless;
  tmp1 = self.program(29, program29, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  foundHelper = helpers.freeAgents;
  stack1 = foundHelper || depth0.freeAgents;
  tmp1 = self.programWithDepth(program31, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      (You have ";
  foundHelper = helpers.numRosterSpots;
  stack1 = foundHelper || depth0.numRosterSpots;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "numRosterSpots", { hash: {} }); }
  buffer += escapeExpression(stack1) + " open roster spots)<br>\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/free_agents\">» Free Agents</a>\n    </p>\n\n    <h3>Expiring Contracts</h3>\n    <p>\n      ";
  foundHelper = helpers.expiring;
  stack1 = foundHelper || depth0.expiring;
  stack2 = helpers.unless;
  tmp1 = self.program(33, program33, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  foundHelper = helpers.expiring;
  stack1 = foundHelper || depth0.expiring;
  tmp1 = self.programWithDepth(program35, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster\">» Full Roster</a>\n    </p>\n  </div>\n</div>";
  return buffer;});
templates['boxScore'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n  <h3><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += "\n    <tr";
  foundHelper = helpers.separator;
  stack1 = foundHelper || depth0.separator;
  stack2 = helpers['if'];
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
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
function program3(depth0,data) {
  
  
  return " class=\"separator\"";}

  buffer += "<h2><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
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
templates['finances'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, stack3, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n      [ '<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.att;
  stack1 = foundHelper || depth0.att;
  foundHelper = helpers.round;
  stack2 = foundHelper || depth0.round;
  if(typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, { hash: {} }); }
  else if(stack2=== undef) { stack1 = helperMissing.call(depth0, "round", stack1, { hash: {} }); }
  else { stack1 = stack2; }
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = 2;
  foundHelper = helpers.revenue;
  stack2 = foundHelper || depth0.revenue;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M', '$";
  stack1 = 2;
  foundHelper = helpers.profit;
  stack2 = foundHelper || depth0.profit;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M', '$";
  stack1 = 2;
  foundHelper = helpers.cash;
  stack2 = foundHelper || depth0.cash;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M', '$";
  stack1 = 2;
  foundHelper = helpers.payroll;
  stack2 = foundHelper || depth0.payroll;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M' ],\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function () {\n  ui.datatableSinglePage($('#finances'), 5, [\n    ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<h1>Finances</h1>\n\n<p>The current salary cap is <strong>$";
  stack1 = 2;
  foundHelper = helpers.salaryCap;
  stack2 = foundHelper || depth0.salaryCap;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M</strong>.</p>\n\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"finances\">\n  <thead>\n    <tr><th>Team</th><th>Avg Attendance</th><th>Revenue (YTD)</th><th>Profit (YTD)</th><th>Cash</th><th>Payroll</th></tr>\n  </thead>\n  </table>\n</p>";
  return buffer;});
templates['draft'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " style=\"display: none;\"";}

function program3(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        <tr id=\"undrafted_";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.started;
  stack1 = foundHelper || depth1.started;
  stack2 = helpers.unless;
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Draft</button></td></tr>\n      ";
  return buffer;}
function program4(depth0,data) {
  
  
  return " disabled=\"disabled\"";}

function program6(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n        <tr><td>";
  foundHelper = helpers.rnd;
  stack1 = foundHelper || depth0.rnd;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rnd", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.pick;
  stack1 = foundHelper || depth0.pick;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pick", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
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

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    function updateDraftTables(pids) {\n        for (var i=0; i<pids.length; i++) {\n            var draftedPlayer = new Array(5);\n            // Find row in undrafted players table, get metadata, delete row\n            var undraftedTds = $('#undrafted_' + pids[i] + ' td')\n            for (var j=0; j<5; j++) {\n                draftedPlayer[j] = undraftedTds[j].innerHTML;\n            }\n\n            // Find correct row (first blank row) in drafted players table, write metadata\n            var draftedRows = $('#drafted tbody tr');\n            for (var j=0; j<draftedRows.length; j++) {\n                if (draftedRows[j].children[3].innerHTML.length == 0) {\n                    $('#undrafted_' + pids[i]).remove();\n                    draftedRows[j].children[2].innerHTML = draftedPlayer[0];\n                    draftedRows[j].children[3].innerHTML = draftedPlayer[1];\n                    draftedRows[j].children[4].innerHTML = draftedPlayer[2];\n                    draftedRows[j].children[5].innerHTML = draftedPlayer[3];\n                    draftedRows[j].children[6].innerHTML = draftedPlayer[4];\n                    break;\n                }\n            }\n        }\n    }\n\n    \n\n    function draftUntilUserOrEnd() {\n        api.draftUntilUserOrEnd(function (pids, done) {\n          updateDraftTables(pids);\n          if (!done) {\n              $('#undrafted button').removeAttr('disabled');\n          }\n      });\n    }\n\n    $('#start_draft').click(function(event) {\n        $($('#start_draft').parent()).hide()\n        draftUntilUserOrEnd();\n    });\n\n    $('#undrafted button').click(function(event) {\n        $('#undrafted button').attr('disabled', 'disabled');\n        api.draftUser(this.getAttribute('data-player-id'), function (pid) {\n            updateDraftTables([pid]);\n            draftUntilUserOrEnd();\n        });\n    });\n});\n</script>\n\n<h1>Draft</h1>\n\n<p>When your turn in the draft comes up, select from the list of available players on the left.</p>\n\n<p";
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
  tmp1 = self.programWithDepth(program3, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </tbody>\n    </table>\n  </div>\n  <div class=\"span6\">\n    <h2>Draft Results</h2>\n    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"drafted\">\n    <thead>\n      <tr><th>Pick</th><th>Team</th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th></tr>\n    </thead>\n    <tbody>\n      ";
  foundHelper = helpers.drafted;
  stack1 = foundHelper || depth0.drafted;
  tmp1 = self.programWithDepth(program6, data, depth0);
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
  buffer += escapeExpression(stack1) + "\" class=\"btn\"><h3>League ";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h3><span class=\"clearfix\">";
  foundHelper = helpers.region;
  stack1 = foundHelper || depth0.region;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span><span class=\"clearfix\">";
  foundHelper = helpers.phaseText;
  stack1 = foundHelper || depth0.phaseText;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "phaseText", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span></a>\n      <form action=\"/delete_league\" method=\"post\"><input type=\"hidden\" name=\"lid\" value=\"";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><button class=\"btn btn-mini\">Delete</button></form>\n    </li>\n  ";
  return buffer;}

  buffer += "<ul class=\"dashboard_league\">\n  ";
  foundHelper = helpers.leagues;
  stack1 = foundHelper || depth0.leagues;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n  <li class=\"dashboard_league_new\"><a href=\"/new_league\" class=\"btn btn-primary\"><h2 style=\"\">Create new league</h2></a></li>\n</ul>\n";
  return buffer;});
templates['schedule'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n  <li><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
templates['leaders'] = template(function (Handlebars,depth0,helpers,partials,data) {
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
  
  var buffer = "", stack1, stack2;
  buffer += "\n    ";
  foundHelper = helpers.newRow;
  stack1 = foundHelper || depth0.newRow;
  stack2 = helpers['if'];
  tmp1 = self.program(5, program5, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    <div class=\"span4\">\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed leaders\">\n      <thead>\n        <tr><th>";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</th><th title=\"";
  foundHelper = helpers.title;
  stack1 = foundHelper || depth0.title;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "title", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.stat;
  stack1 = foundHelper || depth0.stat;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "stat", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</th></tr>\n      </thead>\n      <tbody>\n        ";
  foundHelper = helpers.data;
  stack1 = foundHelper || depth0.data;
  tmp1 = self.programWithDepth(program7, data, depth1);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n      </table>\n    </div>\n  ";
  return buffer;}
function program5(depth0,data) {
  
  
  return "\n</div>\n<p></p>\n<div class=\"row-fluid\">\n    ";}

function program7(depth0,data,depth2) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n          <tr";
  foundHelper = helpers.userTeam;
  stack1 = foundHelper || depth0.userTeam;
  stack2 = helpers['if'];
  tmp1 = self.program(8, program8, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td>";
  foundHelper = helpers['i'];
  stack1 = foundHelper || depth0['i'];
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "i", { hash: {} }); }
  buffer += escapeExpression(stack1) + ". <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a>, <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth2.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td>";
  stack1 = 1;
  foundHelper = helpers.stat;
  stack2 = foundHelper || depth0.stat;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "</tr>\n        ";
  return buffer;}
function program8(depth0,data) {
  
  
  return " class=\"alert-info\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.dropdown($(\"#leaders_select_season\"));\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/leaders\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"leaders_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>League Leaders</h1>\n\n<p></p>\n<div class=\"row-fluid\">\n  ";
  foundHelper = helpers.categories;
  stack1 = foundHelper || depth0.categories;
  tmp1 = self.programWithDepth(program4, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>";
  return buffer;});
templates['newLeague'] = template(function (Handlebars,depth0,helpers,partials,data) {
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

  buffer += "<h1>Create New League</h1>\n<p>\n<form action=\"/new_league\" method=\"POST\">\n  <label>Which team do you want to manage?</label>\n  <select name=\"tid\">\n    ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n  <label><select name=\"players\">\n    <option value=\"random\">Random Players</option>\n    <option value=\"nba2012\">2012 NBA Players</option>\n  </select></label>\n  <button type=\"submit\" class=\"btn\">Create New League</button>  \n</form>\n</p>";
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
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n        // Roster reordering\n        function highlightHandles() {\n            var i = 1;\n            $('#roster tbody').children().each(function() {\n                var tr;\n\n                tr = $(this);\n                if (i <= 5) {\n                    tr.find('td:first').removeClass('btn-info').addClass('btn-primary');\n                } else {\n                    tr.find('td:first').removeClass('btn-primary').addClass('btn-info');\n                }\n                if (i === 5) {\n                    tr.addClass('separator');\n                } else {\n                    tr.removeClass('separator');\n                }\n                i++;\n            });\n        }\n        highlightHandles();\n        var fixHelper = function(e, ui) {\n            // Return helper which preserves the width of table cells being reordered\n            ui.children().each(function() {\n                $(this).width($(this).width());\n            });\n            return ui;\n        };\n        $(\"#roster tbody\").sortable({\n            helper: fixHelper,\n            cursor: \"move\",\n            update: function(e, ui) {\n                var i, sortedPids;\n\n                sortedPids = $(this).sortable(\"toArray\");\n                for (i = 0; i < sortedPids.length; i++) {\n                    sortedPids[i] = parseInt(sortedPids[i].substr(7), 10);\n                }\n\n                api.rosterReorder(sortedPids, function () {\n                    highlightHandles();\n                });\n            }\n        }).disableSelection();\n        $(\"#auto_sort_roster\").click(function(event) {\n            api.rosterAutoSort();\n        });\n\n        // Release player\n        $(\"#roster button\").click(function(event) {\n            if (this.dataset.action === \"release\") {\n                if (window.confirm('Are you sure you want to release ' + this.dataset.playerName + '?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ' + this.dataset.contractExpiration + '.')) {\n                    var tr = this.parentNode.parentNode;\n                    api.rosterRelease(this.dataset.playerId, function (error) {\n                        if (error) {\n                            alert(\"Error: \" + error);\n                        }\n                        else {\n                            Davis.location.assign(new Davis.Request(Davis.location.current()));\n                        }                        \n                    });\n                }\n            }\n            else if (this.dataset.action === \"buyOut\") {\n                if (";
  foundHelper = helpers.team;
  stack1 = foundHelper || depth0.team;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.cash);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "team.cash", { hash: {} }); }
  buffer += escapeExpression(stack1) + " > this.dataset.cashOwed) {\n                    if (window.confirm('Are you sure you want to buy out ' + this.dataset.playerName + '? You will have to pay him the $' + this.dataset.cashOwed + 'M remaining on his contract from your current cash reserves of $";
  stack1 = 2;
  foundHelper = helpers.team;
  stack2 = foundHelper || depth0.team;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.cash);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M. He will then become a free agent and his contract will no longer count towards your salary cap.')) {\n                        var tr = this.parentNode.parentNode;\n                        api.rosterBuyOut(this.dataset.playerId, function (error) {\n                            if (error) {\n                                alert(\"Error: \" + error);\n                            }\n                            else {\n                                Davis.location.assign(new Davis.Request(Davis.location.current()));\n                            }\n                        });\n                    }\n                }\n                else {\n                    alert('Error: You only have $";
  stack1 = 2;
  foundHelper = helpers.team;
  stack2 = foundHelper || depth0.team;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.cash);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M in cash, but it would take $' + this.dataset.cashOwed + 'M to buy out ' + this.dataset.playerName + '.');\n                }\n            }\n            else if (this.dataset.action === \"tradeFor\") {\n\n            }\n        });\n    ";
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
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n  <p>";
  foundHelper = helpers.numRosterSpots;
  stack1 = foundHelper || depth0.numRosterSpots;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "numRosterSpots", { hash: {} }); }
  buffer += escapeExpression(stack1) + " open roster spots<br>\n  Payroll: $";
  stack1 = 2;
  foundHelper = helpers.payroll;
  stack2 = foundHelper || depth0.payroll;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n  Salary cap: $";
  stack1 = 2;
  foundHelper = helpers.salaryCap;
  stack2 = foundHelper || depth0.salaryCap;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M<br>\n  Cash: $";
  stack1 = 2;
  foundHelper = helpers.team;
  stack2 = foundHelper || depth0.team;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.cash);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M (used for buying out players)</p>\n";
  return buffer;}

function program11(depth0,data) {
  
  
  return "\n  <p>Drag and drop row handles to move players between the starting lineup (<span class=\"roster_gs\">&#9632;</span>) and the bench (<span class=\"roster_bench\">&#9632;</span>).</p>\n  <p><button class=\"btn\" id=\"auto_sort_roster\">Auto sort roster</button></p>\n";}

function program13(depth0,data) {
  
  
  return "<th></th>";}

function program15(depth0,data) {
  
  
  return "<th>Contract</th>";}

function program17(depth0,data) {
  
  
  return "<th>Release</th><th>Buy out</th>";}

function program19(depth0,data) {
  
  
  return "<th>Trade For</th>";}

function program21(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n    <tr id=\"roster_";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.separator;
  stack1 = foundHelper || depth0.separator;
  stack2 = helpers['if'];
  tmp1 = self.program(22, program22, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth1.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(24, program24, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  tmp1 = self.program(26, program26, data);
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
  tmp1 = self.program(28, program28, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  foundHelper = helpers.showTradeFor;
  stack1 = foundHelper || depth1.showTradeFor;
  stack2 = helpers['if'];
  tmp1 = self.programWithDepth(program33, data, depth0, depth1);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</tr>\n  ";
  return buffer;}
function program22(depth0,data) {
  
  
  return " class=\"separator\"";}

function program24(depth0,data) {
  
  
  return "<td class=\"roster_handle\"></td>";}

function program26(depth0,data) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "<td>$";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  stack1 = foundHelper || depth0.contractExp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contractExp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</td>";
  return buffer;}

function program28(depth0,data) {
  
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
  foundHelper = helpers.contractExp;
  stack1 = foundHelper || depth0.contractExp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contractExp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.canRelease;
  stack1 = foundHelper || depth0.canRelease;
  stack2 = helpers.unless;
  tmp1 = self.program(29, program29, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Release</button></td><td><button class=\"btn btn-mini\" data-action=\"buyOut\" data-player-id=\"";
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
  stack1 = 2;
  foundHelper = helpers.cashOwed;
  stack2 = foundHelper || depth0.cashOwed;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.canBuyOut;
  stack1 = foundHelper || depth0.canBuyOut;
  stack2 = helpers.unless;
  tmp1 = self.program(31, program31, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Buy out</button></td>";
  return buffer;}
function program29(depth0,data) {
  
  
  return " disabled=\"disabled\"";}

function program31(depth0,data) {
  
  
  return " disabled=\"disabled\"";}

function program33(depth0,data,depth1,depth2) {
  
  var buffer = "", stack1;
  buffer += "<td><form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\" style=\"margin: 0\"><input type=\"hidden\" name=\"pid\" value=\"";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth1.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><button type=\"submit\" class=\"btn btn-mini\">Trade For</button></form></td>";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    ui.dropdown($('#roster_select_team'), $('#roster_select_season'));\n\n    ";
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
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
  foundHelper = helpers.currentSeason;
  stack1 = foundHelper || depth0.currentSeason;
  stack2 = helpers['if'];
  tmp1 = self.program(9, program9, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth0.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(11, program11, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<p>\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster\">\n<thead>\n  <tr>";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth0.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(13, program13, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th>";
  foundHelper = helpers.currentSeason;
  stack1 = foundHelper || depth0.currentSeason;
  stack2 = helpers['if'];
  tmp1 = self.program(15, program15, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "<th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th>";
  foundHelper = helpers.sortable;
  stack1 = foundHelper || depth0.sortable;
  stack2 = helpers['if'];
  tmp1 = self.program(17, program17, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  foundHelper = helpers.showTradeFor;
  stack1 = foundHelper || depth0.showTradeFor;
  stack2 = helpers['if'];
  tmp1 = self.program(19, program19, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</tr>\n</thead>\n<tbody>\n  ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program21, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</tbody>\n</table>\n</p>\n";
  return buffer;});
templates['playerRatings'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n      ['<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth1.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.hgt;
  stack1 = foundHelper || depth0.hgt;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "hgt", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.stre;
  stack1 = foundHelper || depth0.stre;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "stre", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.spd;
  stack1 = foundHelper || depth0.spd;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "spd", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.jmp;
  stack1 = foundHelper || depth0.jmp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "jmp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.endu;
  stack1 = foundHelper || depth0.endu;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "endu", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ins;
  stack1 = foundHelper || depth0.ins;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ins", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.dnk;
  stack1 = foundHelper || depth0.dnk;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "dnk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ft;
  stack1 = foundHelper || depth0.ft;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ft", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.fg;
  stack1 = foundHelper || depth0.fg;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "fg", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.tp;
  stack1 = foundHelper || depth0.tp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.blk;
  stack1 = foundHelper || depth0.blk;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "blk", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.stl;
  stack1 = foundHelper || depth0.stl;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "stl", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.drb;
  stack1 = foundHelper || depth0.drb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "drb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pss;
  stack1 = foundHelper || depth0.pss;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pss", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.reb;
  stack1 = foundHelper || depth0.reb;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "reb", { hash: {} }); }
  buffer += escapeExpression(stack1) + "'],\n    ";
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

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.dropdown($('#player_ratings_select_season'));\n\n  ui.datatable($('#player_ratings'), 4, [\n    ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player_ratings\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"player_ratings_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Player Ratings</h1>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"player_ratings\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Height\">Hgt</th><th title=\"Strength\">Str</th><th title=\"Speed\">Spd</th><th title=\"Jumping\">Jmp</th><th title=\"Endurance\">End</th><th title=\"Inside Scoring\">Ins</th><th title=\"Dunks/Layups\">Dnk</th><th title=\"Free Throw Shooting\">FT</th><th title=\"Two-Point Shooting\">2Pt</th><th title=\"Three-Point Shooting\">3Pt</th><th title=\"Blocks\">Blk</th><th title=\"Steals\">Stl</th><th title=\"Dribbling\">Drb</th><th title=\"Passing\">Pss</th><th title=\"Rebounding\">Reb</th></tr>\n</thead>\n</table>\n</p>\n";
  return buffer;});
templates['freeAgents'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n	    [ '<a href=\"#\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a></a>', '";
  foundHelper = helpers.pos;
  stack1 = foundHelper || depth0.pos;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pos", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  stack1 = foundHelper || depth0.contractExp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contractExp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/negotiation/";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" method=\"POST\" style=\"margin: 0\"><input type=\"hidden\" name=\"new\" value=\"1\"><button type=\"submit\" class=\"btn btn-mini btn-primary\">Negotiate</button></form>' ],\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.datatable($('#free_agents'), 4, [\n    ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n} );\n</script>\n\n<h1>Free Agents</h1>\n\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"free_agents\">\n<thead>\n  <tr><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall\">Ovr</th><th title=\"Potential\">Pot</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th><th>Asking for</th><th>Negotiate</th></tr>\n</thead>\n</table>\n";
  return buffer;});
templates['leagueLayout'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<div id=\"contentwrapper\">\n  <div id=\"league_content\">\n  </div>\n</div>\n\n<div id=\"league_menu\" data-lid=\"";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n  <div class=\"well sidebar-nav\">\n    <ul class=\"nav nav-list\" id=\"league_sidebar\">\n      <li id=\"nav_league_dashboard\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">Dashboard</a></li>\n      <li class=\"nav-header\">League</li>\n      <li id=\"nav_standings\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/standings\">Standings</a></li>\n      <li id=\"nav_playoffs\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/playoffs\">Playoffs</a></li>\n      <li id=\"nav_finances\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/finances\">Finances</a></li>\n      <li id=\"nav_history\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/history\">History</a></li>\n      <li class=\"nav-header\">Team</li>\n      <li id=\"nav_roster\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster\">Roster</a></li>\n      <li id=\"nav_schedule\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/schedule\">Schedule</a></li>\n      <li id=\"nav_history\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/team_history\">History</a></li>\n      <li class=\"nav-header\">Players</li>\n      <li id=\"nav_free_agents\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/free_agents\">Free Agents</a></li>\n      <li id=\"nav_trade\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade\">Trade</a></li>\n      <li id=\"nav_draft\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/draft\">Draft</a></li>\n      <li class=\"nav-header\">Stats</li>\n      <li id=\"nav_game_log\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log\">Game Log</a></li>\n      <li id=\"nav_leaders\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/leaders\">League Leaders</a></li>\n      <li id=\"nav_player_ratings\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player_ratings\">Player Ratings</a></li>\n      <li id=\"nav_player_stats\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player_stats\">Player Stats</a></li>\n      <li id=\"nav_team_stats\"><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/team_stats\">Team Stats</a></li>\n    </ul>\n  </div>\n</div>\n";
  return buffer;});
templates['deleteLeague'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<h1>Delete League ";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "?</h1>\n\n<p>Are you <em>absolutely</em> sure you want to delete League ";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "? You will <em>permanently</em> lose any record of all ";
  foundHelper = helpers.numSeasons;
  stack1 = foundHelper || depth0.numSeasons;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "numSeasons", { hash: {} }); }
  buffer += escapeExpression(stack1) + " seasons, ";
  foundHelper = helpers.numPlayers;
  stack1 = foundHelper || depth0.numPlayers;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "numPlayers", { hash: {} }); }
  buffer += escapeExpression(stack1) + " players, and ";
  foundHelper = helpers.numGames;
  stack1 = foundHelper || depth0.numGames;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "numGames", { hash: {} }); }
  buffer += escapeExpression(stack1) + " games from this league (well... unless you have backup somewhere).</p>\n\n<form action=\"/delete_league\" method=\"post\" style=\"float: left; margin-right: 1em\">\n  <input type=\"hidden\" name=\"lid\" value=\"";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n  <input type=\"hidden\" name=\"confirm\" value=\"1\">\n  <button class=\"btn btn-danger\">Yes, I am sure! Delete League ";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + ".</button>\n</form>\n<form action=\"/\" method=\"get\">\n  <button class=\"btn\">Cancel</button>\n</form>";
  return buffer;});
templates['trade'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n      [ '<input name=\"user_pids\" type=\"checkbox\" value=\"";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
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
  buffer += ">', '<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  stack1 = foundHelper || depth0.contractExp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contractExp", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "' ],\n    ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " checked=\"checked\"";}

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n      [ '<input name=\"other_pids\" type=\"checkbox\" value=\"";
  foundHelper = helpers.pid;
  stack1 = foundHelper || depth0.pid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pid", { hash: {} }); }
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
  buffer += ">', '<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.pot;
  stack1 = foundHelper || depth0.pot;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '$";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M thru ";
  foundHelper = helpers.contractExp;
  stack1 = foundHelper || depth0.contractExp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "contractExp", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "' ],\n    ";
  return buffer;}
function program5(depth0,data) {
  
  
  return " checked=\"checked\"";}

function program7(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n          <option value=\"";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"";
  foundHelper = helpers.selected;
  stack1 = foundHelper || depth0.selected;
  stack2 = helpers['if'];
  tmp1 = self.program(8, program8, data);
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
  buffer += escapeExpression(stack1) + "</option>\n        ";
  return buffer;}
function program8(depth0,data) {
  
  
  return " selected=\"selected\"";}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  var roster_checkboxes_other, roster_checkboxes_user;\n\n  // Don't use the dropdown function because this needs to be a POST\n  $('#trade_select_team').change(function(event) {\n    Davis.location.replace(new Davis.Request({\n      abbrev: $('#trade_select_team').val(),\n      fullPath: \"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade\",\n      method: \"post\"\n    }));\n  });\n\n  ui.datatableSinglePage($('#roster_user'), 5, [\n    ";
  foundHelper = helpers.userRoster;
  stack1 = foundHelper || depth0.userRoster;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n\n  ui.datatableSinglePage($('#roster_other'), 5, [\n    ";
  foundHelper = helpers.otherRoster;
  stack1 = foundHelper || depth0.otherRoster;
  tmp1 = self.programWithDepth(program4, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n\n  roster_checkboxes_user = $('#roster_user input');\n  roster_checkboxes_other = $('#roster_other input');\n\n  $('#rosters input[type=\"checkbox\"]').click(function(event) {\n    var otherPids, serialized, userPids;\n\n    serialized = $('#rosters').serializeArray();\n    userPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === \"user_pids\"; }), \"value\"), Math.floor);\n    otherPids = _.map(_.pluck(_.filter(serialized, function (o) { return o.name === \"other_pids\"; }), \"value\"), Math.floor);\n\n    $('#propose_trade button').attr('disabled', 'disabled'); // Will be reenabled, if appropriate, when the summary is loaded\n    api.tradeUpdate(userPids, otherPids, function (summary, userPids, otherPids) {\n      var found, i, j;\n\n      $(\"#trade_summary\").html(summary);\n      for (i = 0; i < roster_checkboxes_user.length; i++) {\n        found = false;\n        for (j = 0; j < userPids.length; j++) {\n          if (Math.floor(roster_checkboxes_user[i].value) === userPids[j]) {\n            roster_checkboxes_user[i].checked = true;\n            found = true;\n            break;\n          }\n        }\n        if (!found) {\n          roster_checkboxes_user[i].checked = false;\n        }\n      }\n      for (i = 0; i < roster_checkboxes_other.length; i++) {\n        found = false;\n        for (j = 0; j < otherPids.length; j++) {\n          if (Math.floor(roster_checkboxes_other[i].value) === otherPids[j]) {\n            roster_checkboxes_other[i].checked = true;\n            found = true;\n            break;\n          }\n        }\n        if (!found) {\n          roster_checkboxes_other[i].checked = false;\n        }\n      }\n    });\n  });\n\n  $('#propose_trade button').click(function(event) {\n    $('#propose_trade button').attr('disabled', 'disabled');\n  });\n});\n</script>\n\n<h1>Trade</h1>\n\n<div class=\"row-fluid\">\n  <div class=\"span7\">\n    <form id=\"rosters\">\n      <p><select id=\"trade_select_team\" name=\"team\" class=\"team form-inline\">\n        ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.program(7, program7, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </select>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster_other\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th></tr>\n      </thead>\n      </table>\n      </p>\n\n      <h2>";
  foundHelper = helpers.userTeamName;
  stack1 = foundHelper || depth0.userTeamName;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "userTeamName", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h2>\n      <p>\n      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"roster_user\">\n      <thead>\n        <tr><th></th><th>Name</th><th title=\"Position\">Pos</th><th>Age</th><th title=\"Overall Rating\">Ovr</th><th title=\"Potential Rating\">Pot</th><th>Contract</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">Pts</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th></tr>\n      </thead>\n      </table>\n      </p>\n    </form>\n  </div>\n  <div class=\"span5\" id=\"trade_summary\">\n    ";
  foundHelper = helpers.tradeSummary;
  stack1 = foundHelper || depth0.tradeSummary;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "tradeSummary", { hash: {} }); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>";
  return buffer;});
templates['history'] = template(function (Handlebars,depth0,helpers,partials,data) {
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

function program4(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n      <b>";
  foundHelper = helpers.title;
  stack1 = foundHelper || depth0.title;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "title", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</b><br>\n      ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program5, data, depth1);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program5(depth0,data,depth2) {
  
  var buffer = "", stack1;
  buffer += "\n        <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a> (<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth2.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>)<br>\n      ";
  return buffer;}

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n      <b>";
  foundHelper = helpers.title;
  stack1 = foundHelper || depth0.title;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "title", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</b><br>\n      ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program8, data, depth1);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;}
function program8(depth0,data,depth2) {
  
  var buffer = "", stack1;
  buffer += "\n        <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a> (<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth2.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth2.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "......season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>)<br>\n      ";
  return buffer;}

function program10(depth0,data,depth1) {
  
  var buffer = "", stack1;
  buffer += "\n      <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a> (<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth1.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth0.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>) ";
  foundHelper = helpers.ovr;
  stack1 = foundHelper || depth0.ovr;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.age;
  stack1 = foundHelper || depth0.age;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "age", { hash: {} }); }
  buffer += escapeExpression(stack1) + "<br>\n    ";
  return buffer;}

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.dropdown($('#history_select_season'));\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/history\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"history_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Season Summary</h1>\n\n<p></p>\n<div class=\"row-fluid\">\n  <div class=\"span4\">\n    <h4>League Champions</h4>\n    <p><strong><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.champ;
  stack1 = foundHelper || depth0.champ;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "champ.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.champ;
  stack1 = foundHelper || depth0.champ;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "champ.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.champ;
  stack1 = foundHelper || depth0.champ;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "champ.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></strong><br>\n    <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/playoffs/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">Playoffs Bracket</a></p>\n    <h4>Best Record</h4>\n    <p>East: <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.bre;
  stack1 = foundHelper || depth0.bre;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "bre.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.bre);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.bre.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.bre);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.bre.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> (";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.bre);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.won);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.bre.won", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.bre);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lost);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.bre.lost", { hash: {} }); }
  buffer += escapeExpression(stack1) + ")<br>\n    West: <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.brw;
  stack1 = foundHelper || depth0.brw;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "brw.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.brw);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.region);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.brw.region", { hash: {} }); }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.brw);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.brw.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> (";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.brw);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.won);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.brw.won", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.brw);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.lost);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.brw.lost", { hash: {} }); }
  buffer += escapeExpression(stack1) + ")<br></p>\n    <h4>Most Valueable Player</h4>\n    <p><strong><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.mvp);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.mvp.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.mvp);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.mvp.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.mvp);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.mvp.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.mvp);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.mvp.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.mvp);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.pts);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " pts, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.mvp);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.trb);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.mvp);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.ast);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " ast</p>\n    <h4>Defensive Player of the Year</h4>\n    <p><strong><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.dpoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.dpoy.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.dpoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.dpoy.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.dpoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.dpoy.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.dpoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.dpoy.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.dpoy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.trb);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.dpoy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.blk);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " blk, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.dpoy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.stl);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " stl</p>\n    <h4>Sixth Man of the Year</h4>\n    <p><strong><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.smoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.smoy.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.smoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.smoy.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.smoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.smoy.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.smoy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.smoy.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.smoy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.pts);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " pts, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.smoy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.trb);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.smoy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.ast);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " ast</p>\n    <h4>Rookie of the Year</h4>\n    <p><strong><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.roy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.roy.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.roy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.roy.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></strong> (<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.roy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.roy.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth0.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.roy);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.abbrev);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "awards.roy.abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>)<br>\n    ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.roy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.pts);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " pts, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.roy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.trb);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " reb, ";
  stack1 = 1;
  foundHelper = helpers.awards;
  stack2 = foundHelper || depth0.awards;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.roy);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.ast);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + " ast</p>\n  </div>\n  <div class=\"span4\">\n    <h4>All-League Teams</h4>\n    ";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.allLeague);
  tmp1 = self.programWithDepth(program4, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n  <div class=\"span4\">\n    <h4>All-Defensive Teams</h4>\n    ";
  foundHelper = helpers.awards;
  stack1 = foundHelper || depth0.awards;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.allDefensive);
  tmp1 = self.programWithDepth(program7, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>\n<div class=\"row-fluid\">\n  <div class=\"span12\">\n    <h4>Retired Players</h4>\n    ";
  foundHelper = helpers.retiredPlayers;
  stack1 = foundHelper || depth0.retiredPlayers;
  tmp1 = self.programWithDepth(program10, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>";
  return buffer;});
templates['gameLog'] = template(function (Handlebars,depth0,helpers,partials,data) {
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

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function () {\n  ui.dropdown($(\"#game_log_select_team\"), $(\"#game_log_select_season\"), \"";
  foundHelper = helpers.gid;
  stack1 = foundHelper || depth0.gid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\");\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"game_log_select_team\" name=\"team\" class=\"team\">\n    ";
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
  buffer += "\n  </select>\n</form>\n\n<h1>Game Log</h1>\n\n<p>\n<div class=\"row-fluid\">\n  <div class=\"span9\">\n    ";
  foundHelper = helpers.boxScore;
  stack1 = foundHelper || depth0.boxScore;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "boxScore", { hash: {} }); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n\n  <div class=\"span3\">\n    ";
  foundHelper = helpers.gameLogList;
  stack1 = foundHelper || depth0.gameLogList;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gameLogList", { hash: {} }); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>\n</p>\n";
  return buffer;});
templates['teamStats'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n	    ['<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a>', '";
  foundHelper = helpers.gp;
  stack1 = foundHelper || depth0.gp;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gp", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.won;
  stack1 = foundHelper || depth0.won;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "won", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  foundHelper = helpers.lost;
  stack1 = foundHelper || depth0.lost;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lost", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.fg;
  stack2 = foundHelper || depth0.fg;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.fga;
  stack2 = foundHelper || depth0.fga;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.fgp;
  stack2 = foundHelper || depth0.fgp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tp;
  stack2 = foundHelper || depth0.tp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tpa;
  stack2 = foundHelper || depth0.tpa;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tpp;
  stack2 = foundHelper || depth0.tpp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.ft;
  stack2 = foundHelper || depth0.ft;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.fta;
  stack2 = foundHelper || depth0.fta;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.ftp;
  stack2 = foundHelper || depth0.ftp;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.orb;
  stack2 = foundHelper || depth0.orb;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.drb;
  stack2 = foundHelper || depth0.drb;
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
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.tov;
  stack2 = foundHelper || depth0.tov;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.stl;
  stack2 = foundHelper || depth0.stl;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.blk;
  stack2 = foundHelper || depth0.blk;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "', '";
  stack1 = 1;
  foundHelper = helpers.pf;
  stack2 = foundHelper || depth0.pf;
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
  foundHelper = helpers.oppPts;
  stack2 = foundHelper || depth0.oppPts;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "'],\n    ";
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

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n  ui.dropdown($('#team_stats_select_season'));\n\n  ui.datatableSinglePage($('#team_stats'), 2, [\n    ";
  foundHelper = helpers.teams;
  stack1 = foundHelper || depth0.teams;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ]);\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/team_stats\" method=\"GET\" class=\"form-inline pull-right\">\n  <select id=\"team_stats_select_season\" name=\"season\" class=\"season\">\n    ";
  foundHelper = helpers.seasons;
  stack1 = foundHelper || depth0.seasons;
  tmp1 = self.program(3, program3, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </select>\n</form>\n\n<h1>Team Stats</h1>\n\n<p class=\"clearfix\">\n<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"team_stats\">\n<thead>\n  <tr><th colspan=\"4\"></th><th colspan=\"3\" style=\"text-align: center\" title=\"Field Goals\">FG</th><th colspan=\"3\" style=\"text-align: center\" title=\"Three-Pointers\">3PT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Free Throws\">FT</th><th colspan=\"3\" style=\"text-align: center\" title=\"Rebounds\">Reb</th><th colspan=\"7\"></th></tr>\n  <tr><th>Team</th><th title=\"Games Played\">GP</th><th title=\"Won\">W</th><th title=\"Lost\">L</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Made\">M</th><th title=\"Attempted\">A</th><th title=\"Percentage\">%</th><th title=\"Offensive\">Off</th><th title=\"Defensive\">Def</th><th title=\"Total\">Tot</th><th title=\"Assists\">Ast</th><th title=\"Turnovers\">TO</th><th title=\"Steals\">Stl</th><th title=\"Blocks\">Blk</th><th title=\"Personal Fouls\">PF</th><th title=\"Points\">Pts</th><th title=\"Opponent's Points\">OPts</th></tr>\n</thead>\n</table>\n</p>";
  return buffer;});
templates['negotiation'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, stack3, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <p>You are allowed to go over the salary cap to make this deal because you are resigning <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> to a contract extension. <strong>If you do not come to an agreement here, <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> will become a free agent.</strong> He will then be able to sign with any team, and you won't be able to go over the salary cap to sign him.</p>\n";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <p>You are not allowed to go over the salary cap to make this deal because <a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a> is a free agent.</p>\n";
  return buffer;}

  buffer += "<h1>Contract negotiation</h1>\n\n";
  foundHelper = helpers.resigning;
  stack1 = foundHelper || depth0.resigning;
  stack2 = helpers['if'];
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(3, program3, data);
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h2>";
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
  buffer += escapeExpression(stack1) + "</h2>\n    <p>Current Payroll: $";
  stack1 = 2;
  foundHelper = helpers.payroll;
  stack2 = foundHelper || depth0.payroll;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M</p>\n    <p>Salary Cap: $";
  stack1 = 2;
  foundHelper = helpers.salaryCap;
  stack2 = foundHelper || depth0.salaryCap;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M</p>\n    <h2>Your Proposal</h2>\n    <form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/negotiation/";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"text\" name=\"teamYears\" id=\"teamYears\" class=\"span1\" value=\"";
  foundHelper = helpers.negotiation;
  stack1 = foundHelper || depth0.negotiation;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teamYears);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "negotiation.teamYears", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"> years\n      <p><div class=\"input-prepend input-append\">\n        <span class=\"add-on\">$</span><input type=\"text\" name=\"teamAmount\" id=\"teamAmount\" class=\"span5\" value=\"";
  foundHelper = helpers.negotiation;
  stack1 = foundHelper || depth0.negotiation;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teamAmount);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "negotiation.teamAmount", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"><span class=\"add-on\">M</span> per year\n      </div></p>\n      <button type=\"submit\" class=\"btn btn-large btn-primary\">Submit Proposal</button>  \n    </form>\n\n    <form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/negotiation/";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"cancel\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-danger\">Can't reach a deal? End negotiation</button>\n    </form>\n\n  </div>\n  <div class=\"span6\">\n    <h2><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/player/";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></h2>\n    <p>Overal: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.ovr);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.ovr", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</p>\n    <p>Potential: ";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pot);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pot", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</p>\n    <h2>Player Proposal</h2>\n    <p>";
  foundHelper = helpers.negotiation;
  stack1 = foundHelper || depth0.negotiation;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.playerYears);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "negotiation.playerYears", { hash: {} }); }
  buffer += escapeExpression(stack1) + " years (through ";
  foundHelper = helpers.negotiation;
  stack1 = foundHelper || depth0.negotiation;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.playerExpiration);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "negotiation.playerExpiration", { hash: {} }); }
  buffer += escapeExpression(stack1) + ")</p>\n    <p>$";
  stack1 = 3;
  foundHelper = helpers.negotiation;
  stack2 = foundHelper || depth0.negotiation;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.playerAmount);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M per year</p>\n    <form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/negotiation/";
  foundHelper = helpers.player;
  stack1 = foundHelper || depth0.player;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.pid);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "player.pid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" class=\"form-horizontal\" method=\"POST\">\n      <input type=\"hidden\" name=\"accept\" value=\"1\">\n      <button type=\"submit\" class=\"btn btn-large btn-primary\" id=\"accept\">Accept Player Proposal</button>\n    </form>\n  </div>\n</div>\n";
  return buffer;});
templates['tradeSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, stack2, stack3, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n        <li><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program3(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n        <li><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program5(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n        <li><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program7(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n        <li><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  buffer += escapeExpression(stack1) + "</a> ($";
  stack1 = 2;
  foundHelper = helpers.contractAmount;
  stack2 = foundHelper || depth0.contractAmount;
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M)</li>\n      ";
  return buffer;}

function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<p class=\"alert alert-error\"><strong>Warning!</strong> ";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.warning);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "summary.warning", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</p>";
  return buffer;}

function program11(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<p class=\"alert alert-info\">";
  foundHelper = helpers.message;
  stack1 = foundHelper || depth0.message;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "message", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</p>\n";
  return buffer;}

function program13(depth0,data) {
  
  
  return " disabled=\"disabled\"";}

  buffer += "<h3>Trade Summary</h3>\n<div class=\"row-fluid\">\n  <div class=\"span6\">\n    <h4>";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teams);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[0]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "summary.teams.0.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h4>\n    <h5>Trade Away:</h5>\n    <ul>\n      ";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teams);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[0]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trade);
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.teams);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2[0]);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.total);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Receive:</h5>\n    <ul>\n      ";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teams);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[1]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trade);
  tmp1 = self.programWithDepth(program3, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.teams);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2[1]);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.total);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Payroll after trade: $";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.teams);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2[0]);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.payrollAfterTrade);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M</h5>\n    <h5>Salary cap: $";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.salaryCap);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M</h5>\n  </div>\n  <div class=\"span6\">\n    <h4>";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teams);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[1]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "summary.teams.1.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</h4>\n    <h5>Trade Away:</h5>\n    <ul>\n      ";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teams);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[1]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trade);
  tmp1 = self.programWithDepth(program5, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.teams);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2[1]);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.total);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Receive:</h5>\n    <ul>\n      ";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.teams);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1[0]);
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.trade);
  tmp1 = self.programWithDepth(program7, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      <li>$";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.teams);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2[0]);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.total);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M Total</li>\n    </ul>\n    <h5>Payroll after trade: $";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.teams);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2[1]);
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.payrollAfterTrade);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M</h5>\n    <h5>Salary cap: $";
  stack1 = 2;
  foundHelper = helpers.summary;
  stack2 = foundHelper || depth0.summary;
  stack2 = (stack2 === null || stack2 === undefined || stack2 === false ? stack2 : stack2.salaryCap);
  foundHelper = helpers.round;
  stack3 = foundHelper || depth0.round;
  if(typeof stack3 === functionType) { stack1 = stack3.call(depth0, stack2, stack1, { hash: {} }); }
  else if(stack3=== undef) { stack1 = helperMissing.call(depth0, "round", stack2, stack1, { hash: {} }); }
  else { stack1 = stack3; }
  buffer += escapeExpression(stack1) + "M</h5>\n  </div>\n</div>\n\n<br>\n";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.warning);
  stack2 = helpers['if'];
  tmp1 = self.program(9, program9, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  foundHelper = helpers.message;
  stack1 = foundHelper || depth0.message;
  stack2 = helpers['if'];
  tmp1 = self.program(11, program11, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<center>\n  <form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\" id=\"propose_trade\">\n    <input type=\"hidden\" name=\"propose\" value=\"1\">\n    <button type=\"submit\" class=\"btn btn-large btn-primary\"";
  foundHelper = helpers.summary;
  stack1 = foundHelper || depth0.summary;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.disablePropose);
  stack2 = helpers['if'];
  tmp1 = self.program(13, program13, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">Propose Trade</button>\n  </form>\n\n  <form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/trade\" method=\"POST\" id=\"clear_trade\">\n    <input type=\"hidden\" name=\"clear\" value=\"1\">\n    <button type=\"submit\" class=\"btn\">Clear Trade</button>\n  </form>\n</center>\n";
  return buffer;});
templates['draftSummary'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, stack3;
  buffer += "\n	          ['";
  foundHelper = helpers.rnd;
  stack1 = foundHelper || depth0.rnd;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rnd", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.pick;
  stack1 = foundHelper || depth0.pick;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pick", { hash: {} }); }
  buffer += escapeExpression(stack1) + "', '<a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
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
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/roster/";
  foundHelper = helpers.currentAbbrev;
  stack1 = foundHelper || depth0.currentAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.currentAbbrev;
  stack1 = foundHelper || depth0.currentAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "currentAbbrev", { hash: {} }); }
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
  stack1 = 0;
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

  buffer += "<script type=\"text/javascript\">\n$(document).ready(function() {\n    ui.dropdown($('#draft_select_season'));\n\n    ui.datatableSinglePage($('#draft_results'), 0, [\n        ";
  foundHelper = helpers.players;
  stack1 = foundHelper || depth0.players;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ]);\n});\n</script>\n\n<form action=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth0.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "lid", { hash: {} }); }
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
  buffer += "\n  </select>\n</form>\n\n<h1>Draft Summary</h1>\n<p>\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\" id=\"draft_results\">\n  <thead>\n    <tr><th colspan=\"3\"></th><th colspan=\"4\" style=\"text-align: center\">At Draft</th><th colspan=\"4\" style=\"text-align: center\">Current</th><th colspan=\"5\" style=\"text-align: center\">Career Stats</th></tr>\n    <tr><th>Pick</th><th>Name</th><th title=\"Position\">Pos</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th>Team</th><th>Age</th><th title=\"Overall rating\">Ovr</th><th title=\"Potential rating\">Pot</th><th title=\"Games Played\">GP</th><th title=\"Minutes Per Game\">Min</th><th title=\"Points Per Game\">PPG</th><th title=\"Rebounds Per Game\">Reb</th><th title=\"Assists Per Game\">Ast</th></tr>\n  </thead>\n  </table>\n</p>\n";
  return buffer;});
templates['gameLogList'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n    <tr";
  foundHelper = helpers.selected;
  stack1 = foundHelper || depth0.selected;
  stack2 = helpers['if'];
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth1.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth1.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.gid;
  stack1 = foundHelper || depth0.gid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.home;
  stack1 = foundHelper || depth0.home;
  stack2 = helpers.unless;
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  foundHelper = helpers.oppAbbrev;
  stack1 = foundHelper || depth0.oppAbbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppAbbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth1.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth1.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.gid;
  stack1 = foundHelper || depth0.gid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.won;
  stack1 = foundHelper || depth0.won;
  stack2 = helpers['if'];
  tmp1 = self.program(6, program6, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(8, program8, data);
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</a></td><td><a href=\"/l/";
  foundHelper = helpers.lid;
  stack1 = foundHelper || depth1.lid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...lid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/game_log/";
  foundHelper = helpers.abbrev;
  stack1 = foundHelper || depth1.abbrev;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...abbrev", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.season;
  stack1 = foundHelper || depth1.season;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "...season", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.gid;
  stack1 = foundHelper || depth0.gid;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "gid", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.pts;
  stack1 = foundHelper || depth0.pts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "pts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "-";
  foundHelper = helpers.oppPts;
  stack1 = foundHelper || depth0.oppPts;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "oppPts", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a></td></tr>\n  ";
  return buffer;}
function program2(depth0,data) {
  
  
  return " class=\"alert-info\"";}

function program4(depth0,data) {
  
  
  return "@";}

function program6(depth0,data) {
  
  
  return "W";}

function program8(depth0,data) {
  
  
  return "L";}

  buffer += "<table id=\"game_log_list\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"table table-striped table-bordered table-condensed\">\n<thead>\n  <tr><th>Opp</th><th>W/L</th><th>Score</th></tr>\n</thead>\n<tbody>\n  ";
  foundHelper = helpers.games;
  stack1 = foundHelper || depth0.games;
  tmp1 = self.programWithDepth(program1, data, depth0);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</tbody>\n</table>\n";
  return buffer;});
})();