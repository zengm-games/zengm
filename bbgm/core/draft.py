import random

from flask import session, g

import bbgm
from bbgm import app
from bbgm.core import player, season
import bbgm.util.const as c

def generate_players():
    profiles = ['Point', 'Wing', 'Big', 'Big', '']
    gp = player.GeneratePlayer()
    r = g.dbex('SELECT MAX(player_id) + 1 FROM player_attributes')
    player_id, = r.fetchone()
    player_attributes = []
    player_ratings = []
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

        gp.new(player_id, c.PLAYER_UNDRAFTED, 19, profile, base_rating, potential, draft_year)
        gp.develop(aging_years)

        player_attributes.append(gp.get_attributes())
        player_ratings.append(gp.get_ratings())

        player_id += 1
    g.dbexmany('INSERT INTO player_attributes (%s) VALUES (%s)' % (', '.join(player_attributes[0].keys()), ', '.join([':' + key for key in player_attributes[0].keys()])), player_attributes)
    g.dbexmany('INSERT INTO player_ratings (%s) VALUES (%s)' % (', '.join(player_ratings[0].keys()), ', '.join([':' + key for key in player_ratings[0].keys()])), player_ratings)

    # Update roster positions (so next/prev buttons work in player dialog)
    roster_position = 1
    r = g.dbex('SELECT pr.player_id FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = :team_id AND pr.season = :season ORDER BY pr.overall + 2*pr.potential DESC', team_id=c.PLAYER_UNDRAFTED, season=g.season)
    for player_id, in r.fetchall():
        g.dbex('UPDATE player_attributes SET roster_position = :roster_position WHERE player_id = :player_id', roster_position=roster_position, player_id=player_id)
        roster_position += 1

def set_order():
    """Sets draft order based on winning percentage (no lottery)."""
    for draft_round in xrange(1, 3):
        pick = 1
        r = g.dbex('SELECT team_id, abbreviation FROM team_attributes WHERE season = :season ORDER BY 1.0*won/(won + lost) ASC', season=g.season)
        for team_id, abbreviation in r.fetchall():
            g.dbex('INSERT INTO draft_results (season, draft_round, pick, team_id, abbreviation, player_id, name, position) VALUES (:season, :draft_round, :pick, :team_id, :abbreviation, 0, \'\', \'\')', season=g.season, draft_round=draft_round, pick=pick, team_id=team_id, abbreviation=abbreviation)
            pick += 1

def until_user_or_end():
    """Simulate draft picks until it's the user's turn or the draft is over.

    Returns:
        A list of player IDs who were drafted.
    """
    player_ids = []

    r = g.dbex('SELECT team_id, draft_round, pick FROM draft_results WHERE season = :season AND player_id = 0 ORDER BY draft_round, pick ASC', season=g.season)
    for team_id, draft_round, pick in r.fetchall():
        if team_id == g.user_team_id:
            return player_ids
        team_pick = abs(int(random.gauss(0, 3)))  # 0=best prospect, 1=next best prospect, etc.
        r = g.dbex('SELECT pr.player_id FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = :team_id AND pr.season = :season ORDER BY pr.overall + 2*pr.potential DESC LIMIT :pick, 1', team_id=c.PLAYER_UNDRAFTED, season=g.season, pick=team_pick)
        player_id,= r.fetchone()
        pick_player(team_id, player_id)
        player_ids.append(player_id)

    return player_ids


def pick_player(team_id, player_id):
    # Validate that team_id should be picking now
    r = g.dbex('SELECT team_id, draft_round, pick FROM draft_results WHERE season = :season AND player_id = 0 ORDER BY draft_round, pick ASC LIMIT 1', season=g.season)
    team_id_next, draft_round, pick = r.fetchone()

    if team_id_next != team_id:
        app.logger.debug('WARNING: Team %d tried to draft out of order' % (team_id,))
        return

    # Draft player, update roster potision
    r = g.dbex('SELECT pa.name, pa.position, pa.born_date, pr.overall, pr.potential FROM player_attributes AS pa, player_ratings AS pr WHERE pa.player_id = pr.player_id AND pa.team_id = :team_id AND pr.player_id = :player_id AND pr.season = :season', team_id=c.PLAYER_UNDRAFTED, player_id=player_id, season=g.season)
    name, position, born_date, overall, potential = r.fetchone()
    r = g.dbex('SELECT MAX(roster_position) + 1 FROM player_attributes WHERE team_id = :team_id', team_id=team_id)
    roster_position, = r.fetchone()

    g.dbex('UPDATE player_attributes SET team_id = :team_id, draft_year = :draft_year, draft_round = :draft_round, draft_pick = :draft_pick, draft_team_id = :team_id, roster_position = :roster_position WHERE player_id = :player_id', team_id=team_id, draft_year=g.season, draft_round=draft_round, draft_pick=pick, draft_team_id=team_id, roster_position=roster_position, player_id=player_id)
    g.dbex('UPDATE draft_results SET player_id = :player_id, name = :name, position = :position, born_date = :born_date, overall = :overall, potential = :potential WHERE season = :season AND draft_round = :draft_round AND pick = :pick', player_id=player_id, name=name, position=position, born_date=born_date, overall=overall, potential=potential, season=g.season, draft_round=draft_round, pick=pick)

    # Contract
    rookie_salaries = (5000, 4500, 4000, 3500, 3000, 2750, 2500, 2250, 2000, 1900, 1800, 1700, 1600, 1500,
                       1400, 1300, 1200, 1100, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
                       1000, 1000, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
                       500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500)
    i = pick - 1 + 30 * (draft_round - 1)
    contract_amount = rookie_salaries[i]
    years = 4 - draft_round  # 2 years for 2nd round, 3 years for 1st round
    contract_expiration = g.season + years
    g.dbex('UPDATE player_attributes SET contract_amount = :contract_amount, contract_expiration = :contract_expiration WHERE player_id = :player_id', contract_amount=contract_amount, contract_expiration=contract_expiration, player_id=player_id)

    # Is draft over?
    r = g.dbex('SELECT 1 FROM draft_results WHERE season = :season AND player_id = 0', season=g.season)
    if r.rowcount == 0:
        season.new_phase(c.PHASE_AFTER_DRAFT)

    return player_id
