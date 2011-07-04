rm test.sqlite
sqlite3 -init tables.sql test.sqlite
sqlite3 -init league.sql test.sqlite
sqlite3 -init players.sql test.sqlite
sqlite3 -init teams.sql test.sqlite
