gtk-builder-convert basketball_gm.glade basketball_gm.xml
rm -rf database.sqlite
sqlite3 -init data/tables.sql database.sqlite
sqlite3 -init data/players.sql database.sqlite
sqlite3 -init data/teams.sql database.sqlite
