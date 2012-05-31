CREATE TABLE conferences (
cid INTEGER,
name VARCHAR(255),
PRIMARY KEY (cid));
INSERT INTO conferences (cid,name) VALUES(0,'Eastern Conference');
INSERT INTO conferences (cid,name) VALUES(1,'Western Conference');

CREATE TABLE divisions (
did INTEGER,
cid INTEGER,
name VARCHAR(255),
PRIMARY KEY (did));
INSERT INTO divisions (did,cid,name) VALUES(0,0,'Atlantic');
INSERT INTO divisions (did,cid,name) VALUES(1,0,'Central');
INSERT INTO divisions (did,cid,name) VALUES(2,0,'Southeast');
INSERT INTO divisions (did,cid,name) VALUES(3,1,'Southwest');
INSERT INTO divisions (did,cid,name) VALUES(4,1,'Northwest');
INSERT INTO divisions (did,cid,name) VALUES(5,1,'Pacific');

CREATE TABLE game_attributes (
tid INTEGER,
season INTEGER,
phase INTEGER,
games_in_progress BOOLEAN DEFAULT 0,
negotiation_in_progress BOOLEAN DEFAULT 0,
stop_games BOOLEAN DEFAULT 0,
pm_status VARCHAR(255),
pm_phase VARCHAR(255),
version VARCHAR(255));
INSERT INTO game_attributes (tid, season, phase, version) VALUES(3, 2012, 0, '2.0.0alpha');

CREATE TABLE schedule (
gid INTEGER AUTO_INCREMENT,
home_tid INTEGER,
away_tid INTEGER,
in_progress_timestamp INTEGER DEFAULT 0,
PRIMARY KEY (gid));

CREATE TABLE player_attributes (
pid INTEGER AUTO_INCREMENT,
name VARCHAR(255),
tid INTEGER,
pos VARCHAR(2),
roster_order INTEGER,
hgt INTEGER, -- inches
weight INTEGER, -- pounds
born_year INTEGER, -- YYYY for birth year
born_loc VARCHAR(255), -- City, State/Country
college VARCHAR(255), -- or HS or country, if applicable
draft_year INTEGER,
round INTEGER,
draft_pick INTEGER,
draft_tid INTEGER,
contract_amount INTEGER,
contract_exp INTEGER,
free_agent_times_asked FLOAT DEFAULT 0.0,
years_free_agent INTEGER DEFAULT 0,
PRIMARY KEY (pid));

CREATE TABLE released_players_salaries (
pid INTEGER,
tid INTEGER,
contract_amount INTEGER,
contract_exp INTEGER);

CREATE TABLE player_ratings (
pid INTEGER,
season INTEGER,
ovr INTEGER,
hgt INTEGER,
stre INTEGER,
spd INTEGER,
jmp INTEGER,
end INTEGER,
ins INTEGER,
dnk INTEGER,
ft INTEGER,
fg INTEGER,
tp INTEGER,
blk INTEGER,
stl INTEGER,
drb INTEGER,
pss INTEGER,
reb INTEGER,
pot INTEGER,
PRIMARY KEY (pid, season));

CREATE TABLE player_stats (
pid INTEGER,
tid INTEGER,
gid INTEGER,
season INTEGER,
playoffs BOOLEAN,
gs INTEGER,
min INTEGER,
fg INTEGER,
fga INTEGER,
tp INTEGER,
tpa INTEGER,
ft INTEGER,
fta INTEGER,
orb INTEGER,
drb INTEGER,
ast INTEGER,
tov INTEGER,
stl INTEGER,
blk INTEGER,
pf INTEGER,
pts INTEGER,
PRIMARY KEY (pid, gid));

CREATE TABLE team_stats (
tid INTEGER,
opp_tid INTEGER,
gid INTEGER,
season INTEGER,
playoffs BOOLEAN,
won BOOLEAN,
home BOOLEAN,
min INTEGER,
fg INTEGER,
fga INTEGER,
tp INTEGER,
tpa INTEGER,
ft INTEGER,
fta INTEGER,
orb INTEGER,
drb INTEGER,
ast INTEGER,
tov INTEGER,
stl INTEGER,
blk INTEGER,
pf INTEGER,
pts INTEGER,
opp_pts INTEGER,
att INTEGER,
cost INTEGER,
PRIMARY KEY (tid, gid));

CREATE TABLE playoff_series (
sid INTEGER AUTO_INCREMENT,
round INTEGER,
season INTEGER,
tid_home INTEGER,
tid_away INTEGER,
seed_home INTEGER,
seed_away INTEGER,
won_home INTEGER,
won_away INTEGER,
PRIMARY KEY (sid));

CREATE TABLE draft_results (
season INTEGER,
round INTEGER,
pick INTEGER,
tid INTEGER,
abbrev VARCHAR(3),
pid INTEGER,
name VARCHAR(255),
pos VARCHAR(2),
born_year INTEGER, -- YYYY for birth year
ovr INTEGER,
pot INTEGER,
PRIMARY KEY (season, round, pick));

CREATE TABLE negotiations (
pid INTEGER,
team_amount INTEGER,
team_years INTEGER,
player_amount INTEGER,
player_years INTEGER,
num_offers_made INTEGER,
max_offers INTEGER,
resigning BOOLEAN DEFAULT 0,
PRIMARY KEY (pid));

CREATE TABLE trade (
tid INTEGER,
pids_user TEXT,
pids_other TEXT);

CREATE TABLE awards (
season INTEGER,
bre_tid INTEGER,
bre_abbrev VARCHAR(3),
bre_region VARCHAR(255),
bre_name VARCHAR(255),
bre_won INTEGER,
bre_lost INTEGER,
brw_tid INTEGER,
brw_abbrev VARCHAR(3),
brw_region VARCHAR(255),
brw_name VARCHAR(255),
brw_won INTEGER,
brw_lost INTEGER,
mvp_pid INTEGER,
mvp_name VARCHAR(255),
mvp_tid INTEGER,
mvp_abbrev VARCHAR(3),
mvp_pts FLOAT,
mvp_trb FLOAT,
mvp_ast FLOAT,
dpoy_pid INTEGER,
dpoy_name VARCHAR(255),
dpoy_tid INTEGER,
dpoy_abbrev VARCHAR(3),
dpoy_trb FLOAT,
dpoy_blk FLOAT,
dpoy_stl FLOAT,
smoy_pid INTEGER,
smoy_name VARCHAR(255),
smoy_tid INTEGER,
smoy_abbrev VARCHAR(3),
smoy_pts FLOAT,
smoy_trb FLOAT,
smoy_ast FLOAT,
roy_pid INTEGER,
roy_name VARCHAR(255),
roy_tid INTEGER,
roy_abbrev VARCHAR(3),
roy_pts FLOAT,
roy_trb FLOAT,
roy_ast FLOAT,
PRIMARY KEY (season));

CREATE TABLE awards_all_league(
rank INTEGER AUTO_INCREMENT,
season INTEGER,
team_type VARCHAR(9),
pid INTEGER,
name VARCHAR(255),
abbrev VARCHAR(3),
pts FLOAT,
trb FLOAT,
ast FLOAT,
blk FLOAT,
stl FLOAT,
PRIMARY KEY (rank));

CREATE INDEX a ON team_attributes(tid, season, did, region);
CREATE INDEX b ON player_stats(pid, season, playoffs);
CREATE INDEX c ON team_attributes(season, did, won, lost);
CREATE INDEX d ON player_stats(pid, gid, tid, gs, min);
CREATE INDEX e ON team_stats(tid, season);
CREATE INDEX f ON team_stats(gid, tid);
CREATE INDEX g ON player_ratings(pid, ovr);
CREATE INDEX h ON player_attributes(pid, tid);
CREATE INDEX i ON divisions(cid);
CREATE INDEX j ON playoff_series(sid, round);
CREATE INDEX k ON released_players_salaries(tid);
CREATE INDEX l ON player_ratings(pid, season);

