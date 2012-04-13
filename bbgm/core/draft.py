import random

from flask import session, g

import bbgm
from bbgm.core import player, season

def generate_players():
    profiles = ['Point', 'Wing', 'Big', 'Big', '']
    gp = player.GeneratePlayer()
    sql = ''
    g.db.execute('SELECT MAX(player_id) + 1 FROM %s_player_attributes', (g.league_id,))
    player_id, = g.db.fetchone()
    team_id = -2  # -2 is the team_id for players generated for the draft
    for p in xrange(70):
        base_rating = random.randrange(0, 20)
        potential = int(random.gauss(45, 20))
        if potential < base_rating:
            potential = base_rating
        if potential > 90:
            potential = 90

        i = random.randrange(len(profiles))
        profile = profiles[i]

        aging_years = random.randrange(4)
        draft_year = g.season

        gp.new(player_id, team_id, 19, profile, base_rating, potential, draft_year)
        gp.develop(aging_years)

        sql += gp.sql_insert(g.league_id)

        player_id += 1
    bbgm.bulk_execute(sql)

    # Update roster positions (so next/prev buttons work in player dialog)
    roster_position = 1
    g.db.execute('SELECT pr.player_id FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = -2 ORDER BY pr.overall + 2*pr.potential DESC', (g.league_id, g.league_id))
    for player_id, in g.db.fetchall():
        g.db.execute('UPDATE %s_player_ratings SET roster_position = %s WHERE player_id = %s', (g.league_id, roster_position, player_id))
        roster_position += 1

def set_order():
    """Sets draft order based on winning percentage (no lottery)."""
    for draft_round in xrange(1, 3):
        pick = 1
        g.db.execute('SELECT team_id, abbreviation FROM %s_team_attributes WHERE season =  %s ORDER BY 1.0*won/(won + lost) ASC', (g.league_id, g.season))
        for team_id, abbreviation in g.db.fetchall():
            g.db.execute('INSERT INTO %s_draft_results (season, draft_round, pick, team_id, abbreviation, player_id, name, position) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)', (g.league_id, g.season, draft_round, pick, team_id, abbreviation, 0, '', ''))
            pick += 1

def until_user_or_end():
    """Simulate draft picks until it's the user's turn or the draft is over.
    Returns:
        A list of player IDs who were drafted.
    """
    player_ids = []

    g.db.execute('SELECT team_id, draft_round, pick FROM %s_draft_results WHERE season =  %s AND player_id = 0 ORDER BY draft_round, pick ASC', (g.league_id, g.season))
    for team_id, draft_round, pick in g.db.fetchall():
        if team_id == g.user_team_id:
            return player_ids
        team_pick = abs(int(random.gauss(0, 3)))  # 0=best prospect, 1=next best prospect, etc.
        g.db.execute('SELECT pr.player_id FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = -2 ORDER BY pr.overall + 2*pr.potential DESC LIMIT %s, 1', (g.league_id, g.league_id, team_pick))
        player_id,= g.db.fetchone()
        pick_player(team_id, player_id)
        player_ids.append(player_id)

    return player_ids


def pick_player(team_id, player_id):
    # Validate that team_id should be picking now
    g.db.execute('SELECT team_id, draft_round, pick FROM %s_draft_results WHERE season =  %s AND player_id = 0 ORDER BY draft_round, pick ASC LIMIT 1', (g.league_id, g.season))
    team_id_next, draft_round, pick = g.db.fetchone()

    if team_id_next != team_id:
        print 'WARNING: Team tried to draft out of order'
        return

    # Draft player, update roster potision
    g.db.execute('SELECT pa.name, pa.position, pa.born_date, pr.overall, pr.potential FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = -2 AND pr.player_id = %s', (g.league_id, g.league_id, player_id))
    name, position, born_date, overall, potential = g.db.fetchone()
    g.db.execute('SELECT MAX(pr.roster_position) + 1 FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = %s', (g.league_id, g.league_id, team_id))
    roster_position, = g.db.fetchone()

    g.db.execute('UPDATE %s_player_attributes SET team_id = %s, draft_year = %s, draft_round = %s, draft_pick = %s, draft_team_id = %s WHERE player_id = %s', (g.league_id, team_id, g.season, draft_round, pick, team_id, player_id))
    g.db.execute('UPDATE %s_draft_results SET player_id = %s, name = %s, position = %s, born_date = %s, overall = %s, potential = %s WHERE season = %s AND draft_round = %s AND pick = %s', (g.league_id, player_id, name, position, born_date, overall, potential, g.season, draft_round, pick))
    g.db.execute('UPDATE %s_player_ratings SET roster_position = %s WHERE player_id = %s', (g.league_id, roster_position, player_id))

    # Contract
    rookie_salaries = (5000, 4500, 4000, 3500, 3000, 2750, 2500, 2250, 2000, 1900, 1800, 1700, 1600, 1500,
                       1400, 1300, 1200, 1100, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
                       1000, 1000, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
                       500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500)
    i = pick - 1 + 30 * (draft_round - 1)
    contract_amount = rookie_salaries[i]
    years = 4 - draft_round  # 2 years for 2nd round, 3 years for 1st round
    contract_expiration = g.season + years
    g.db.execute('UPDATE %s_player_attributes SET contract_amount = %s, contract_expiration = %s WHERE player_id = %s', (g.league_id, contract_amount, contract_expiration, player_id))

    # Is draft over?
    g.db.execute('SELECT 1 FROM %s_draft_results WHERE season = %s AND player_id = 0', (g.league_id, g.season))
    if g.db.rowcount == 0:
        season.new_phase(6)

    return player_id
