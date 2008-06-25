BEGIN TRANSACTION;
CREATE TABLE game_attributes (
team_id INTEGER,
season INTEGER);
INSERT INTO "game_attributes" VALUES(3, 2008);
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
draft_team_id INTEGER);
INSERT INTO "player_attributes" VALUES(1,'Kirk Hinrich',3,'G',75,190,'1981-01-02','Sioux City, Iowa','Kansas',2003,1,7,3);
INSERT INTO "player_attributes" VALUES(2,'Ben Gordon',3,'SG',75,200,'1983-04-04','London, England','Connecticut',2004,1,3,3);
INSERT INTO "player_attributes" VALUES(3,'Luol Deng',3,'GF',81,220,'1985-04-16','Wow, Sudan','Duke',2004,1,7,22);
INSERT INTO "player_attributes" VALUES(4,'Tyrus Thomas',3,'F',81,215,'1986-08-17','Baton Rouge, Louisiana','LSU',2006,1,4,23);
INSERT INTO "player_attributes" VALUES(5,'Joakim Noah',3,'FC',83,232,'1985-02-25','New York, New York','Florida',2007,1,9,3);
INSERT INTO "player_attributes" VALUES(6,'Thabo Sefolosha',3,'GF',79,215,'1984-05-02','Vevey, Switzerland','None',2006,1,13,21);
INSERT INTO "player_attributes" VALUES(7,'Drew Gooden',3,'PF',82,250,'1981-09-24','Oakland, California','Kansas',2002,1,4,13);
INSERT INTO "player_attributes" VALUES(8,'Andres Nocioni',3,'F',79,225,'1979-11-30','Santa Fe, Argentina','None',0,0,0,0);
INSERT INTO "player_attributes" VALUES(9,'Larry Hughes',3,'G',77,184,'1979-01-23','St. Louis, Missouri','Saint Louis',1998,1,8,21);
INSERT INTO "player_attributes" VALUES(10,'Aaron Gray',3,'C',84,270,'1984-12-07','Tarzana, California','Pittsburgh',2007,2,19,3);
INSERT INTO "player_attributes" VALUES(11,'Andre Miller',21,'PG',74,200,'1976-03-19','Los Angeles, California','Utah',1999,1,8,4);
INSERT INTO "player_attributes" VALUES(12,'Andre Iguodala',21,'SG',78,207,'1984-01-28','Springfield, Illinois','Arizona',2004,1,9,21);
INSERT INTO "player_attributes" VALUES(13,'Thaddeus Young',21,'SF',80,220,'1988-06-21','New Orleans, Louisiana','Georgia Tech',2007,1,12,21);
INSERT INTO "player_attributes" VALUES(14,'Reggie Evans',21,'PF',80,245,'1980-05-18','Pensacola, Florida','Iowa',0,0,0,0);
INSERT INTO "player_attributes" VALUES(15,'Samuel Dalembert',21,'C',83,250,'1981-05-10','Port-Au-Prince, Haiti','Seton Hall',2001,1,26,21);
INSERT INTO "player_attributes" VALUES(16,'Willie Green',21,'SG',76,201,'1981-07-28','Detroit, Michigan','Detroit',2003,2,12,26);
INSERT INTO "player_attributes" VALUES(17,'Louis Williams',21,'G',74,175,'1986-10-27','Lithonia, Georgia','None',2005,2,15,21);
INSERT INTO "player_attributes" VALUES(18,'Rodney Carney',21,'GF',78,204,'1984-04-05','Memphis, Tennessee','Memphis',2006,1,16,3);
INSERT INTO "player_attributes" VALUES(19,'Jason Smith',21,'FC',84,240,'1986-03-02','Greeley, Colorado','Colorado State',2007,1,20,14);
INSERT INTO "player_attributes" VALUES(20,'Mike Bibby',0,'PG',74,190,'1978-05-13','Cherry Hill, New Jersey','Arizona',1998,1,2,13);
INSERT INTO "player_attributes" VALUES(21,'Al Horford',0,'FC',82,245,'1986-06-03','Purto Plata, Dominican Republic','Florida',2007,1,3,0);
INSERT INTO "player_attributes" VALUES(22,'Joe Johnson',0,'G',79,235,'1981-06-29','Little Rock, Arkansas','Arkansas',2001,1,10,1);
INSERT INTO "player_attributes" VALUES(23,'Josh Smith',0,'F',81,235,'1985-12-05','College Park, Georgia','None',2004,1,17,0);
INSERT INTO "player_attributes" VALUES(24,'Marvin Williams',0,'GF',81,230,'1986-06-19','Bremerton, Washington','North Carolina',2005,1,2,0);
INSERT INTO "player_attributes" VALUES(25,'Josh Childress',0,'GF',80,210,'1983-06-20','Harbor City, California','Stanford',2004,1,6,0);
INSERT INTO "player_attributes" VALUES(26,'Acie Law',0,'G',75,195,'1985-01-25','Dallas, Texas','Texas A&M',2007,1,11,0);
INSERT INTO "player_attributes" VALUES(27,'Zaza Pachulia',0,'FC',83,280,'1984-02-10','Tbilisi, USSR','None',2003,2,13,20);
INSERT INTO "player_attributes" VALUES(28,'Ray Allen',1,'SG',77,205,'1975-07-20','Castle AFB, Merced, California','Connecticut',1996,1,5,16);
INSERT INTO "player_attributes" VALUES(29,'Kevin Garnett',1,'F',83,253,'1976-05-19','Mauldin, South Carolina','None',1995,1,5,16);
INSERT INTO "player_attributes" VALUES(30,'Kendrick Perkins',1,'C',82,280,'1984-10-10','Nederland, Texas','None',2003,1,27,13);
INSERT INTO "player_attributes" VALUES(31,'Paul Pierce',1,'GF',78,230,'1977-10-13','Oakland, California','Kansas',1998,1,10,1);
INSERT INTO "player_attributes" VALUES(32,'Rajon Rondo',1,'G',73,171,'1986-02-22','Louisville, Kentucky','Kentucky',2006,1,21,22);
INSERT INTO "player_attributes" VALUES(33,'Eddie House',1,'SG',73,175,'1978-05-14','Berkeley, California','Arizona State',2000,2,8,14);
INSERT INTO "player_attributes" VALUES(34,'James Posey',1,'GF',80,217,'1977-01-13','Cleveland, Ohio','Xavier',1999,1,18,6);
INSERT INTO "player_attributes" VALUES(35,'Leon Powe',1,'F',80,240,'1984-01-22','Oakland, California','California',2006,2,19,6);
INSERT INTO "player_attributes" VALUES(36,'Jason Richardson',2,'GF',78,225,'1981-01-20','Saginaw, Michigan','Michigan State',2001,1,5,8);
INSERT INTO "player_attributes" VALUES(37,'Gerald Wallace',2,'F',79,215,'1982-07-23','Sylacauga, Alabama','Alabama',2001,1,25,24);
INSERT INTO "player_attributes" VALUES(38,'Raymond Felton',2,'G',73,198,'1984-06-26','Marion, South Carolina','North Carolina',2005,1,5,2);
INSERT INTO "player_attributes" VALUES(39,'Emeka Okafor',2,'FC',82,252,'1982-09-28','Houston, Texas','Connecticut',2004,1,2,2);
INSERT INTO "player_attributes" VALUES(40,'Nazr Mohammed',2,'C',82,250,'1977-09-05','Chicago, Illinois','Kentucky',1998,1,29,28);
INSERT INTO "player_attributes" VALUES(41,'Matt Carroll',2,'GF',78,212,'1980-08-28','Pittsburgh, Pennsylvania','Notre Dame',0,0,0,0);
INSERT INTO "player_attributes" VALUES(42,'Jared Dudley',2,'F',79,225,'1985-07-10','San Diego, California','Boston College',2007,1,22,2);
INSERT INTO "player_attributes" VALUES(43,'LeBron James',4,'SF',80,240,'1984-12-30','Akron, Ohio','None',2003,1,1,4);
INSERT INTO "player_attributes" VALUES(44,'Zydrunas Ilgauskas',4,'C',87,260,'1975-06-05','Kaunas, USSR','None',1996,1,20,4);
INSERT INTO "player_attributes" VALUES(45,'Daniel Gibson',4,'G',74,190,'1986-02-27','Houston, Texas','Texas',2006,2,12,4);
INSERT INTO "player_attributes" VALUES(46,'Delonte West',4,'G',76,180,'1983-07-26','Washtington, District of Columbia','St. Joseph''s',2004,1,24,1);
INSERT INTO "player_attributes" VALUES(47,'Ben Wallace',4,'FC',81,240,'1974-09-10','White Hall, Alabama','Virginia Union',0,0,0,0);
INSERT INTO "player_attributes" VALUES(48,'Wally Szczerbiak',4,'GF',79,244,'1977-03-05','Madrid, Spain','Miami (OH)',1999,1,6,16);
INSERT INTO "player_attributes" VALUES(49,'Joe Smith',4,'PF',82,225,'1975-07-26','Norfolk, Virginia','Maryland',1995,1,1,8);
INSERT INTO "player_attributes" VALUES(50,'Sasha Pavlovic',4,'GF',79,210,'1983-11-15','Bar, Yugoslavia','None',2003,1,19,28);
INSERT INTO "player_attributes" VALUES(51,'Anderson Varejao',4,'FC',82,240,'1982-09-28','Santa Teresa, Brazil','None',2004,2,1,20);
--INSERT INTO "player_attributes" VALUES(,'',,'',,,'','','',,,,);


CREATE TABLE player_ratings (
player_id INTEGER PRIMARY KEY,
roster_position INTEGER,
average_playing_time INTEGER,
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
rebounding INTEGER);
INSERT INTO "player_ratings" VALUES(1,1,35,30,20,80,30,70,10,30,90,80,80,10,90,90,85,50);
INSERT INTO "player_ratings" VALUES(2,2,35,10,80,90,75,80,20,70,90,90,90,50,30,65,30,40);
INSERT INTO "player_ratings" VALUES(3,3,35,60,60,60,50,90,60,90,70,80,40,50,50,50,30,60);
INSERT INTO "player_ratings" VALUES(4,4,30,70,50,70,100,60,50,100,60,60,10,90,70,40,40,90);
INSERT INTO "player_ratings" VALUES(5,5,30,90,70,50,70,80,40,80,20,20,0,80,70,50,40,90);
INSERT INTO "player_ratings" VALUES(6,6,20,60,60,70,60,50,20,50,60,60,50,70,90,70,50,80);
INSERT INTO "player_ratings" VALUES(7,7,20,80,80,30,50,40,60,70,70,70,30,60,30,30,10,70);
INSERT INTO "player_ratings" VALUES(8,8,20,60,70,30,30,60,60,60,80,80,80,50,50,30,10,50);
INSERT INTO "player_ratings" VALUES(9,9,10,50,60,80,70,50,10,70,50,40,20,50,50,90,80,70);
INSERT INTO "player_ratings" VALUES(10,10,5,90,80,0,0,40,70,70,20,20,0,70,20,0,30,80);
INSERT INTO "player_ratings" VALUES(11,1,37,30,20,80,50,70,30,40,80,70,40,20,70,90,100,20);
INSERT INTO "player_ratings" VALUES(12,2,40,50,80,90,50,90,80,90,70,60,50,40,100,70,50,50);
INSERT INTO "player_ratings" VALUES(13,3,30,60,80,70,50,90,80,90,60,60,40,60,70,50,40,60);
INSERT INTO "player_ratings" VALUES(14,4,25,70,100,30,50,80,30,40,50,10,0,60,60,10,10,100);
INSERT INTO "player_ratings" VALUES(15,5,33,90,60,40,50,90,40,60,60,50,0,90,70,20,20,100);
INSERT INTO "player_ratings" VALUES(16,6,20,50,50,50,60,50,40,60,60,40,25,40,60,70,60,40);
INSERT INTO "player_ratings" VALUES(17,7,25,20,20,100,90,50,30,70,60,50,50,10,70,80,60,50);
INSERT INTO "player_ratings" VALUES(18,8,15,65,30,60,80,50,20,70,40,30,30,30,70,50,20,50);
INSERT INTO "player_ratings" VALUES(19,9,15,90,60,60,60,50,70,70,40,50,30,80,50,40,10,20);
INSERT INTO "player_ratings" VALUES(20,1,35,20,20,70,50,50,30,70,70,80,60,0,70,90,70,60);
INSERT INTO "player_ratings" VALUES(21,2,35,80,90,40,40,50,70,80,50,40,0,40,60,30,20,100);
INSERT INTO "player_ratings" VALUES(22,3,40,60,60,70,70,50,50,80,80,80,80,20,60,80,90,70);
INSERT INTO "player_ratings" VALUES(23,4,35,70,70,70,100,50,70,100,50,50,30,100,80,60,50,60);
INSERT INTO "player_ratings" VALUES(24,5,35,70,70,50,60,50,70,70,70,60,20,20,70,60,20,30);
INSERT INTO "player_ratings" VALUES(25,6,30,65,30,70,50,50,60,90,70,70,60,50,60,70,30,60);
INSERT INTO "player_ratings" VALUES(26,7,15,30,20,80,40,50,10,30,70,40,10,10,80,70,50,40);
INSERT INTO "player_ratings" VALUES(27,8,15,90,60,10,20,50,90,60,50,50,0,40,60,20,10,50);
INSERT INTO "player_ratings" VALUES(28,1,35,50,40,70,40,50,50,60,90,80,90,30,30,80,50,50);
INSERT INTO "player_ratings" VALUES(29,2,35,90,90,50,50,50,90,90,70,60,30,90,80,50,60,90);
INSERT INTO "player_ratings" VALUES(30,3,30,80,100,20,20,50,70,70,40,30,0,90,10,10,20,80);
INSERT INTO "player_ratings" VALUES(31,4,35,60,70,70,70,50,80,90,80,60,80,70,60,80,80,80);
INSERT INTO "player_ratings" VALUES(32,5,30,10,30,100,80,50,30,70,40,40,20,40,100,90,70,70);
INSERT INTO "player_ratings" VALUES(33,6,25,10,20,80,50,50,20,30,90,80,90,20,30,50,40,30);
INSERT INTO "player_ratings" VALUES(34,7,25,70,80,40,50,50,50,50,60,60,70,30,70,40,30,40);
INSERT INTO "player_ratings" VALUES(35,8,25,70,80,50,50,50,70,80,50,60,0,70,60,20,10,100);
INSERT INTO "player_ratings" VALUES(36,1,40,60,60,70,90,50,70,90,50,80,70,60,40,60,40,40);
INSERT INTO "player_ratings" VALUES(37,2,40,70,60,60,90,50,80,90,40,40,40,90,100,50,40,60);
INSERT INTO "player_ratings" VALUES(38,3,40,20,30,100,70,50,10,60,60,50,30,20,70,80,80,50);
INSERT INTO "player_ratings" VALUES(39,4,35,90,90,10,20,50,80,80,30,40,0,90,60,30,10,100);
INSERT INTO "player_ratings" VALUES(40,5,25,90,70,0,10,50,70,80,30,30,0,40,30,20,10,80);
INSERT INTO "player_ratings" VALUES(41,6,30,50,30,40,20,50,20,30,80,80,100,10,30,60,10,20);
INSERT INTO "player_ratings" VALUES(42,7,30,60,70,40,40,50,80,60,50,80,10,0,40,50,30,40);
INSERT INTO "player_ratings" VALUES(43,1,40,70,90,90,100,50,70,100,45,80,50,70,70,90,100,100);
INSERT INTO "player_ratings" VALUES(44,2,30,100,90,10,0,50,100,90,75,80,0,90,50,60,30,100);
INSERT INTO "player_ratings" VALUES(45,3,30,20,10,90,80,50,20,50,75,90,100,0,70,80,60,60);
INSERT INTO "player_ratings" VALUES(46,4,30,30,20,80,70,50,20,60,60,70,70,70,50,80,50,40);
INSERT INTO "player_ratings" VALUES(47,5,25,70,90,30,30,50,10,20,0,10,0,100,80,30,60,100);
INSERT INTO "player_ratings" VALUES(48,6,20,60,40,30,30,50,30,40,90,90,90,20,20,60,30,30);
INSERT INTO "player_ratings" VALUES(49,7,20,85,60,30,20,50,70,70,70,80,25,30,30,30,20,50);
INSERT INTO "player_ratings" VALUES(50,8,20,60,50,50,60,50,30,70,50,60,70,10,30,60,30,30);
INSERT INTO "player_ratings" VALUES(51,9,25,90,80,40,40,50,60,60,30,50,20,70,70,60,30,100);
CREATE TABLE player_stats (
player_id INTEGER,
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
region TEXT,
name TEXT,
abbreviation TEXT,
season INTEGER,
won REAL DEFAULT 0,
lost REAL DEFAULT 0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(0,'Atlanta','Hawks','ATL',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(1,'Boston','Celtics','BOS',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(2,'Charlotte','Bobcats','CHA',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(3,'Chicago','Bulls','CHI',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(4,'Cleveland','Cavaliers','CLE',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(5,'Dallas','Mavericks','DAL',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(6,'Denver','Nuggets','DEN',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(7,'Detroit','Pisonts','DET',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(8,'Golden State','Warriors','GSW',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(9,'Houston','Rockets','HOU',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(10,'Indiana','Pacers','IND',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(11,'Los Angeles','Clippers','LAC',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(12,'Los Angeles','Lakers','LAL',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(13,'Memphis','Grizzlies','MEM',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(14,'Miami','Heat','MIA',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(15,'Milwaukee','Bucks','MIL',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(16,'Minnesota','Timberwolves','MIN',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(17,'New Jersey','Nets','NJN',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(18,'New Orleans','Hornets','NOR',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(19,'New York','Knicks','NYK',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(20,'Orlando','Magic','ORL',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(21,'Philadelphia','76ers','PHI',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(22,'Phoenix','Suns','PHO',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(23,'Portland','Trail Blazers','POR',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(24,'Sacramento','Kings','SAC',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(25,'San Antonio','Spurs','SAS',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(26,'Seattle','SuperSonics','SEA',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(27,'Toronto','Raptors','TOR',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(28,'Utah','Jazz','UTA',2008,0.0,0.0);
INSERT INTO "team_attributes" (team_id,region,name,abbreviation,season,won,lost) VALUES(29,'Washington','Wizards','WAS',2008,0.0,0.0);
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
opponent_points INTEGER);
CREATE TABLE enum_w_l (
key INTEGER,
val TEXT);
INSERT INTO "enum_w_l" VALUES(0,'L');
INSERT INTO "enum_w_l" VALUES(1,'W');
COMMIT;
