INSERT INTO conferences (cid,name) VALUES(0,'Eastern Conference');
INSERT INTO conferences (cid,name) VALUES(1,'Western Conference');

INSERT INTO divisions (did,cid,name) VALUES(0,0,'Atlantic');
INSERT INTO divisions (did,cid,name) VALUES(1,0,'Central');
INSERT INTO divisions (did,cid,name) VALUES(2,0,'Southeast');
INSERT INTO divisions (did,cid,name) VALUES(3,1,'Southwest');
INSERT INTO divisions (did,cid,name) VALUES(4,1,'Northwest');
INSERT INTO divisions (did,cid,name) VALUES(5,1,'Pacific');

INSERT INTO game_attributes (tid, season, phase, version) VALUES(3, 2012, 0, '2.0.0alpha');

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

