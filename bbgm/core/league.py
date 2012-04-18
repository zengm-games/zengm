import random

from flask import session, g

import bbgm
from bbgm import app
from bbgm.core import play_menu, player, season
from bbgm.util import roster_auto_sort

def new(team_id):
    # Add to main record
    g.db.execute("INSERT INTO leagues (user_id, description) VALUES (%s, 'THIS SHOULD BE UPDATED SOMEWHERE')", (session['user_id'],))

    g.db.execute('SELECT league_id FROM leagues WHERE user_id = %s ORDER BY league_id DESC LIMIT 1', (session['user_id'],))
    g.league_id, = g.db.fetchone()

    # Copy team attributes table
    g.db.execute('CREATE TABLE %s_team_attributes SELECT * FROM teams', (g.league_id,))

    # Create other new tables
    f = app.open_resource('data/league.sql')
    sql = ''
    for line in f:
        sql += line

    sql = sql.replace('CREATE TABLE ', 'CREATE TABLE ' + str(g.league_id) + '_')
    sql = sql.replace('INSERT INTO ', 'INSERT INTO ' + str(g.league_id) + '_')
    sql = sql.replace(' ON ', ' ON ' + str(g.league_id) + '_')

    bbgm.bulk_execute(sql)

    # Generate new players
    profiles = ['Point', 'Wing', 'Big', '']
    gp = player.GeneratePlayer()
    sql = ''
    player_id = 1
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

            sql += gp.sql_insert(g.league_id)

            player_id += 1

    bbgm.bulk_execute(sql)

    # Set and get global game attributes
    g.db.execute('UPDATE %s_game_attributes SET team_id = %s', (g.league_id, team_id))
    g.db.execute('SELECT team_id, season, phase, schedule, version FROM %s_game_attributes LIMIT 1', (g.league_id,))
    g.user_team_id, g.season, g.phase, g.schedule, g.version = g.db.fetchone()

    # Make schedule, start season
    season.new_phase(1)
    play_menu.set_status('Idle')

    # Auto sort player's roster (other teams will be done in season.new_phase(1))
    roster_auto_sort(g.user_team_id)

    return g.league_id

def delete(league_id):
    g.db.execute("DELETE FROM leagues WHERE league_id = %s", (league_id,))
    tables = ['active_playoff_series', 'game_attributes', 'league_conferences', 'league_divisions', 'player_attributes', 'player_ratings', 'player_stats', 'released_players_salaries', 'team_attributes', 'team_stats', 'draft_results', 'negotiation', 'trade']
    for table in tables:
        g.db.execute("DROP TABLE %s_%s" % (league_id, table))

