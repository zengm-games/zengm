CREATE TABLE league_conferences (
conference_id INTEGER PRIMARY KEY,
name TEXT);

CREATE TABLE league_divisions (
division_id INTEGER PRIMARY KEY,
conference_id INTEGER,
name TEXT);

CREATE TABLE game_attributes (
team_id INTEGER,
season INTEGER,
phase INTEGER,
schedule TEXT);
INSERT INTO "game_attributes" (team_id, season, phase) VALUES(3, 2008, 0);

CREATE TABLE player_attributes (
player_id INTEGER PRIMARY KEY,
name TEXT,
team_id INTEGER,
position TEXT,
height INTEGER, -- inches
weight INTEGER, -- pounds
born_date TEXT, -- YYYY-MM-DD for birthday
born_location TEXT, -- City, State/Country
college TEXT, -- or HS or country, if applicable
draft_year INTEGER,
draft_round INTEGER,
draft_pick INTEGER,
draft_team_id INTEGER,
contract_amount INTEGER,
contract_expiration INTEGER);

CREATE TABLE player_ratings (
player_id INTEGER PRIMARY KEY,
roster_position INTEGER,
average_playing_time INTEGER DEFAULT 0,
overall INTEGER,
height INTEGER,
strength INTEGER,
speed INTEGER,
jumping INTEGER,
endurance INTEGER,
shooting_inside INTEGER,
shooting_layups INTEGER,
shooting_free_throws INTEGER,
shooting_two_pointers INTEGER,
shooting_three_pointers INTEGER,
blocks INTEGER,
steals INTEGER,
dribbling INTEGER,
passing INTEGER,
rebounding INTEGER,
potential INTEGER);

CREATE TABLE player_stats (
player_id INTEGER,
team_id INTEGER,
game_id INTEGER,
season INTEGER,
starter INTEGER,
minutes INTEGER,
field_goals_made INTEGER,
field_goals_attempted INTEGER,
three_pointers_made INTEGER,
three_pointers_attempted INTEGER,
free_throws_made INTEGER,
free_throws_attempted INTEGER,
offensive_rebounds INTEGER,
defensive_rebounds INTEGER,
assists INTEGER,
turnovers INTEGER,
steals INTEGER,
blocks INTEGER,
personal_fouls INTEGER,
points INTEGER);

CREATE TABLE team_attributes (
ind INTEGER PRIMARY KEY,
team_id INTEGER,
division_id INTEGER,
region TEXT,
name TEXT,
abbreviation TEXT,
season INTEGER,
won REAL DEFAULT 0,
lost REAL DEFAULT 0,
won_div INTEGER DEFAULT 0,
lost_div INTEGER DEFAULT 0,
won_conf INTEGER DEFAULT 0,
lost_conf INTEGER DEFAULT 0,
cash INTEGER DEFAULT 0);

CREATE TABLE team_stats (
team_id INTEGER,
opponent_team_id INTEGER,
game_id INTEGER,
season INTEGER,
won INTEGER,
minutes INTEGER,
field_goals_made INTEGER,
field_goals_attempted INTEGER,
three_pointers_made INTEGER,
three_pointers_attempted INTEGER,
free_throws_made INTEGER,
free_throws_attempted INTEGER,
offensive_rebounds INTEGER,
defensive_rebounds INTEGER,
assists INTEGER,
turnovers INTEGER,
steals INTEGER,
blocks INTEGER,
personal_fouls INTEGER,
points INTEGER,
opponent_points INTEGER,
attendance INTEGER,
cost INTEGER);

CREATE TABLE enum_w_l (
key INTEGER,
val TEXT);
INSERT INTO "enum_w_l" VALUES(0,'L');
INSERT INTO "enum_w_l" VALUES(1,'W');

CREATE TABLE active_playoff_series (
series_id INTEGER,
series_round INTEGER,
team_id_home INTEGER,
team_id_away INTEGER,
seed_home INTEGER,
seed_away INTEGER,
won_home INTEGER,
won_away INTEGER);
