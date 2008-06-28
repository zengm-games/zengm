import generate_player
import operator
import random
import sqlite3

profiles = ['Point', 'Wing', 'Big', '']

player = generate_player.player()

ratings_sql = ''
attributes_sql = ''

player_id = 1
for t in range(30):
    roster_position = 1
    for p in range(7):
        i = random.randrange(len(profiles))
        profile = profiles[i]

        ratings = player.generate_ratings(player_id, roster_position, 48, profile, 40)
        attributes = player.generate_attributes(player_id, t, 2008, 22)

        ratings_sql += 'INSERT INTO "player_ratings" VALUES(%s);\n' % ', '.join(map(str, ratings))
        attributes_sql += 'INSERT INTO "player_attributes" VALUES(%s);\n' % ', '.join(map(str, attributes))

        roster_position += 1
        player_id += 1
        

f = open('data/players.sql', 'w')
f.write(ratings_sql + attributes_sql)
f.close()

def search_for_lebron():
    found = 0
    tried = 0

    player = generate_player.player()

    while found < 100:
        player.generate('Point', 20, 68)

        DB_CON = sqlite3.connect('database.sqlite')

        similarity = 'ABS(height - ?) + ABS(strength - ?) + ABS(speed - ?) + ABS(jumping - ?) + ABS(endurance - ?) + ABS(shooting_inside - ?) + ABS(shooting_layups - ?) + ABS(shooting_free_throws - ?) + ABS(shooting_two_pointers - ?) + ABS(shooting_three_pointers - ?) + ABS(blocks - ?) + ABS(steals - ?) + ABS(dribbling - ?) + ABS(passing - ?) + ABS(rebounding - ?)'
        query = 'SELECT player_id, (SELECT name FROM player_attributes WHERE player_attributes.player_id = player_ratings.player_id), %s FROM player_ratings ORDER BY %s ASC LIMIT 1' % (similarity, similarity)

        for row in DB_CON.execute(query, player.ratings + player.ratings):
            if row[2] < 150 and row[0] == 43:
                print 'Players generated:', tried
                print 'Average rating:', reduce(operator.add, player.ratings)/len(player.ratings)
                print player.ratings
                print row
                print '------------------'
                found += 1
        tried += 1
