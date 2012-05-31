CREATE TABLE users (
    uid INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);
INSERT INTO users (username, password) VALUES ('test', 'test');

CREATE TABLE leagues (
    lid INTEGER PRIMARY KEY AUTO_INCREMENT,
    uid INTEGER,
    FOREIGN KEY (uid) REFERENCES users(uid)
);

CREATE TABLE teams (
    tid INTEGER PRIMARY KEY,
    did INTEGER,
    region VARCHAR(255),
    name VARCHAR(255),
    abbrev VARCHAR(3),
    season INTEGER,
    won INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    won_div INTEGER DEFAULT 0,
    lost_div INTEGER DEFAULT 0,
    won_conf INTEGER DEFAULT 0,
    lost_conf INTEGER DEFAULT 0,
    cash INTEGER DEFAULT 0,
    playoffs BOOLEAN DEFAULT 0,
    won_conference BOOLEAN DEFAULT 0,
    won_championship BOOLEAN DEFAULT 0
);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(0,2,'Atlanta','Herons','ATL',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(1,0,'Boston','Clovers','BOS',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(2,2,'Charlotte','Bay Cats','CHA',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(3,1,'Chicago','Bullies','CHI',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(4,1,'Cleveland','Cobras','CLE',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(5,3,'Dallas','Mares','DAL',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(6,4,'Denver','Ninjas','DEN',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(7,1,'Detroit','Pumps','DET',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(8,5,'Golden State','War Machine','GSW',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(9,3,'Houston','Rock Throwers','HOU',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(10,1,'Indiana','Passers','IND',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(11,5,'Los Angeles','Cutters','LAC',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(12,5,'Los Angeles','Lagoons','LAL',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(13,3,'Memphis','Growls','MEM',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(14,2,'Miami','Heatwave','MIA',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(15,1,'Milwaukee','Buccaneers','MIL',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(16,4,'Minnesota','Trees','MIN',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(17,0,'New Jersey','Nests','NJN',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(18,3,'New Orleans','Honey Bees','NOR',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(19,0,'New York','Knights','NYK',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(20,2,'Orlando','Mystery','ORL',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(21,0,'Philadelphia','Steaks','PHI',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(22,5,'Phoenix','Stars','PHO',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(23,4,'Portland','Trailer Park','POR',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(24,5,'Sacramento','Killers','SAC',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(25,3,'San Antonio','Spurts','SAS',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(26,4,'Seattle','Sudoers','SEA',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(27,0,'Toronto','Ravens','TOR',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(28,4,'Utah','Jugglers','UTA',2012,0.0,0.0,10000000);
INSERT INTO teams (tid,did,region,name,abbrev,season,won,lost,cash) VALUES(29,2,'Washington','Witches','WAS',2012,0.0,0.0,10000000);
