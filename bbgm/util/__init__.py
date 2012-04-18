from flask import g

from bbgm import app

def request_context_globals(league_id):
    """Call this within an app.test_request_context() to set other globals."""
    app.preprocess_request()  # So that g is available
    g.league_id = league_id
    # The following txwo lines are copied from bbgm.util.decorators.global_game_attributes
    g.db.execute('SELECT team_id, season, phase, schedule, version FROM %s_game_attributes LIMIT 1', (g.league_id,))
    g.user_team_id, g.season, g.phase, g.schedule, g.version = g.db.fetchone()

def get_payroll(team_id):
    """Get the total payroll for a team.

    This includes players who have been released but are still owed money from
    their old contracts.

    Returns an integer containing the payroll in thousands of dollars.
    """
    g.db.execute('SELECT SUM(contract_amount) FROM %s_player_attributes WHERE team_id = %s AND contract_expiration >= %s', (g.league_id, team_id, g.season))
    payroll, = g.db.fetchone()

    g.db.execute('SELECT SUM(contract_amount) FROM %s_released_players_salaries WHERE team_id = %s', (g.league_id, team_id))
    released_players_salaries, = g.db.fetchone()

    if released_players_salaries:
        payroll += released_players_salaries

    return int(payroll)

def roster_auto_sort(team_id):
    """Sort the roster (i.e. pick the starters) of team_id based on overall
    rating.
    """
    # Get roster
    players = []
    g.db.execute('SELECT pa.player_id, pr.overall, pr.endurance FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = %s', (g.league_id, g.league_id, team_id))
    for row in g.db.fetchall():
        players.append([int(i) for i in list(row)])

    # Sort by rating
    players.sort(cmp=lambda x, y: y[1] - x[1])

    # Update positions
    roster_position = 1
    for player in players:
        g.db.execute('UPDATE %s_player_ratings SET roster_position = %s WHERE player_id = %s', (g.league_id, roster_position, player[0]))
        roster_position += 1
