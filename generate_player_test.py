import generate_player
import operator
import sqlite3

player = generate_player.player()

ratings = player.generate_ratings(1, 48, 1, 'Big', 40)
attributes = player.generate_attributes(2008, 22)

print attributes
print ratings

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
