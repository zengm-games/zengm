import random

from flask import g

from bbgm import app

def request_context_globals(league_id):
    """Call this within an app.test_request_context() to set other globals."""
    app.preprocess_request()  # So that g is available
    g.league_id = league_id
    # The following txwo lines are copied from bbgm.util.decorators.global_game_attributes
    g.db.execute('SELECT team_id, season, phase, version FROM %s_game_attributes LIMIT 1', (g.league_id,))
    g.user_team_id, g.season, g.phase, g.version = g.db.fetchone()

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

def free_agents_auto_sign():
    """AI teams sign free agents."""
    # Build free_agents containing player ids and desired contracts
    g.db.execute('SELECT COUNT(*)/30 FROM %s_team_stats WHERE season = %s', (g.league_id, g.season))
    num_days_played, = g.db.fetchone()
    free_agents = []
    g.db.execute('SELECT pa.player_id, pa.contract_amount, pa.contract_expiration FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.team_id = -1 AND pa.player_id = pr.player_id ORDER BY pr.overall + 2*pr.potential DESC', (g.league_id, g.league_id))
    for player_id, amount, expiration in g.db.fetchall():
        free_agents.append([player_id, amount, expiration, False])

    # Randomly order teams and let them sign free agents
    team_ids = list(xrange(30))
    random.shuffle(team_ids)
    for i in xrange(30):
        team_id = team_ids[i]

        if team_id == g.user_team_id:
            continue  # Skip the user's team

        g.db.execute('SELECT count(*) FROM %s_player_attributes WHERE team_id = %s', (g.league_id, team_id))
        num_players, = g.db.fetchone()
        payroll = get_payroll(team_id)
        while payroll < g.salary_cap and num_players < 15:
            j = 0
            new_player = False
            for player_id, amount, expiration, signed in free_agents:
                if amount + payroll <= g.salary_cap and not signed and num_players < 15:
                    g.db.execute('UPDATE %s_player_attributes SET team_id = %s, contract_amount = %s, contract_expiration = %s WHERE player_id = %s', (g.league_id, team_id, amount, expiration, player_id))
                    free_agents[j][-1] = True  # Mark player signed
                    new_player = True
                    num_players += 1
                    payroll += amount
                    roster_auto_sort(team_id)
                j += 1
            if not new_player:
                break

def free_agents_decrease_demands():
    # Decrease free agent demands
    g.db.execute('SELECT player_id, contract_amount, contract_expiration FROM %s_player_attributes WHERE team_id = -1 AND contract_amount > 500', (g.league_id,))
    for player_id, amount, expiration in g.db.fetchall():
        amount -= 50
        if amount < 500:
            amount = 500
        if amount < 2000:
            expiration = g.season + 1
        if amount < 1000:
            expiration = g.season
        g.db.execute('UPDATE %s_player_attributes SET contract_amount = %s, contract_expiration = %s WHERE player_id = %s', (g.league_id, amount, expiration, player_id))

    # Free agents' resistance to previous signing attempts by player decays
    # Decay by 0.1 per game, for 82 games in the regular season
    g.db.execute('UPDATE %s_player_attributes SET free_agent_times_asked = free_agent_times_asked - 0.1 WHERE team_id = -1', (g.league_id,))
    g.db.execute('UPDATE %s_player_attributes SET free_agent_times_asked = 0 WHERE team_id = -1 AND free_agent_times_asked < 0', (g.league_id,))

def get_seasons():
    """Returns a list of all the seasons, past and present."""
    seasons = []
    g.db.execute('SELECT season FROM %s_team_attributes GROUP BY season ORDER BY season DESC', (g.league_id))
    for season, in g.db.fetchall():
        seasons.append(season)
    return seasons
