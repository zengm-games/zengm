import random

from flask import session, g

import bbgm
from bbgm import app
from bbgm.core import play_menu, player, season
from bbgm.util import roster_auto_sort
import bbgm.util.const as c

def new(team_id):
    # Add to main record
    g.db.execute('INSERT INTO leagues (user_id) VALUES (%s)', (session['user_id'],))

    g.db.execute('SELECT league_id FROM leagues WHERE user_id = %s ORDER BY league_id DESC LIMIT 1', (session['user_id'],))
    g.league_id, = g.db.fetchone()

    # Create new database
    g.db.execute('CREATE DATABASE bbgm_%s', (g.league_id,))
    g.db.execute('GRANT ALL ON bbgm_%s.* TO %s@localhost IDENTIFIED BY \'%s\'' % (g.league_id, app.config['DB_USERNAME'], app.config['DB_PASSWORD']))
    g.db.execute('USE bbgm_%s', (g.league_id,))

    # Copy team attributes table
    g.db.execute('CREATE TABLE team_attributes SELECT * FROM bbgm.teams')

    # Create other new tables
    f = app.open_resource('data/league.sql')
    bbgm.bulk_execute(f)

    # Generate new players
    profiles = ['Point', 'Wing', 'Big', '']
    gp = player.GeneratePlayer()
    player_id = 1
    sql_insert_attributes = []
    sql_insert_ratings = []
    for t in range(-1, 30):
        good_neutral_bad = random.randrange(-1, 2)  # Determines if this will be a good team or not

        base_ratings = [30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 19, 19]
        potentials = [70, 60, 50, 50, 55, 45, 65, 35, 50, 45, 55, 55, 40, 40]
        random.shuffle(potentials)
        for p in range(14):
            i = random.randrange(len(profiles))
            profile = profiles[i]

            aging_years = random.randint(0, 16)

            draft_year = g.starting_season - 1 - aging_years

            gp.new(player_id, t, 19, profile, base_ratings[p], potentials[p], draft_year)
            gp.develop(aging_years)
            if p < 5:
                gp.bonus(good_neutral_bad * random.randint(0, 20))
            if t == -1:  # Free agents
                gp.bonus(-15)

            # Update contract based on development
            if t >= 0:
                randomize_expiration = True  # Players on teams already get randomized contracts
            else:
                randomize_expiration = False
            amount, expiration = gp.contract(randomize_expiration=randomize_expiration)
            gp.attribute['contract_amount'], gp.attribute['contract_expiration'] = amount, expiration

            sql_insert_ratings.append(gp.sql_insert_ratings())
            sql_insert_attributes.append(gp.sql_insert_attributes())

            player_id += 1
    g.db.executemany(gp.sql_insert_attributes_query(), sql_insert_attributes)
    g.db.executemany(gp.sql_insert_ratings_query(), sql_insert_ratings)

    # Set and get global game attributes
    g.db.execute('UPDATE game_attributes SET team_id = %s', (team_id,))
    g.db.execute('SELECT team_id, season, phase, version FROM game_attributes LIMIT 1')
    g.user_team_id, g.season, g.phase, g.version = g.db.fetchone()

    # Make schedule, start season
    season.new_phase(c.PHASE_REGULAR_SEASON)
    play_menu.set_status('Idle')

    # Auto sort player's roster (other teams will be done in season.new_phase(c.PHASE_REGULAR_SEASON))
    roster_auto_sort(g.user_team_id)

    # Default trade settings
    if g.user_team_id == 0:
        trade_team_id = 1
    else:
        trade_team_id = 0
    g.db.execute('INSERT INTO trade (team_id) VALUES (%s)', (trade_team_id,))

    # Switch back to the default non-league database
    g.db.execute('USE bbgm')

    return g.league_id

def delete(league_id):
    g.db.execute('DROP DATABASE bbgm_%s' % (league_id,))
    g.db.execute('DELETE FROM leagues WHERE league_id = %s', (league_id,))
