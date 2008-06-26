gtk-builder-convert basketball_gm.glade basketball_gm.xml
rm -rf database.sqlite
rm -f box_scores/*
#sqlite3 -init schema.sql database.sqlite
sqlite3 -init data/players.sql database.sqlite
sqlite3 -init data/teams.sql database.sqlite
sqlite3 -init data/game.sql database.sqlite
