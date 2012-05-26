import random

from flask import g

from bbgm import app
import const as c

def request_context_globals(league_id):
    """Call this within an app.test_request_context() to set other globals."""
    app.preprocess_request()  # So that g is available
    g.league_id = league_id
    # The following two lines are copied from bbgm.util.decorators.global_game_attributes
    r = g.dbex('SELECT team_id, season, phase, version FROM game_attributes LIMIT 1')
    g.user_team_id, g.season, g.phase, g.version = r.fetchone()

def get_payroll(team_id):
    """Get the total payroll for a team.

    This includes players who have been released but are still owed money from
    their old contracts.

    Returns an integer containing the payroll in thousands of dollars.
    """
    r = g.dbex('SELECT SUM(contract_amount) FROM player_attributes WHERE team_id = :team_id AND contract_expiration >= :contract_expiration', team_id=team_id, contract_expiration=g.season)
    payroll, = r.fetchone()

    r = g.dbex('SELECT SUM(contract_amount) FROM released_players_salaries WHERE team_id = :team_id', team_id=team_id)
    released_players_salaries, = r.fetchone()

    if released_players_salaries:
        payroll += released_players_salaries

    return int(payroll)

def roster_auto_sort(team_id):
    """Sort the roster (i.e. pick the starters) of team_id based on overall
    rating.
    """
    # Get roster
    players = []
    r = g.dbex('SELECT pa.player_id, pr.overall, pr.endurance FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = :team_id AND pr.season = :season', team_id=team_id, season=g.season)
    for row in r.fetchall():
        players.append([int(i) for i in list(row)])

    # Sort by rating
    players.sort(cmp=lambda x, y: y[1] - x[1])

    # Update positions
    roster_position = 1
    for player in players:
        g.dbex('UPDATE player_attributes SET roster_position = :roster_position WHERE player_id = :player_id', roster_position=roster_position, player_id=player[0])
        roster_position += 1

def free_agents_auto_sign():
    """AI teams sign free agents."""
    # Build free_agents containing player ids and desired contracts
    r = g.dbex('SELECT COUNT(*)/30 FROM team_stats WHERE season = :season', season=g.season)
    num_days_played, = r.fetchone()
    free_agents = []
    r = g.dbex('SELECT pa.player_id, pa.contract_amount, pa.contract_expiration FROM player_attributes as pa, player_ratings as pr WHERE pa.team_id = :team_id AND pa.player_id = pr.player_id AND pr.season = :season ORDER BY pr.overall + 2*pr.potential DESC', team_id=c.PLAYER_FREE_AGENT, season=g.season)
    for player_id, amount, expiration in r.fetchall():
        free_agents.append([player_id, amount, expiration, False])

    # Randomly order teams and let them sign free agents
    team_ids = list(xrange(30))
    random.shuffle(team_ids)
    for i in xrange(30):
        team_id = team_ids[i]

        if team_id == g.user_team_id:
            continue  # Skip the user's team

        r = g.dbex('SELECT count(*) FROM player_attributes WHERE team_id = :team_id', team_id=team_id)
        num_players, = r.fetchone()
        payroll = get_payroll(team_id)
        while payroll < g.salary_cap and num_players < 15:
            j = 0
            new_player = False
            for player_id, amount, expiration, signed in free_agents:
                if amount + payroll <= g.salary_cap and not signed and num_players < 15:
                    g.dbex('UPDATE player_attributes SET team_id = :team_id, contract_amount = :contract_amount, contract_expiration = :contract_expiration WHERE player_id = :player_id', team_id=team_id, contract_amount=amount, contract_expiration=expiration, player_id=player_id)
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
    r = g.dbex('SELECT player_id, contract_amount, contract_expiration FROM player_attributes WHERE team_id = :team_id AND contract_amount > 500', team_id=c.PLAYER_FREE_AGENT)
    for player_id, amount, expiration in r.fetchall():
        amount -= 50
        if amount < 500:
            amount = 500
        if amount < 2000:
            expiration = g.season + 1
        if amount < 1000:
            expiration = g.season
        g.dbex('UPDATE player_attributes SET contract_amount = :contract_amount, contract_expiration = :contract_expiration WHERE player_id = :player_id', contract_amount=amount, contract_expiration=expiration, player_id=player_id)

    # Free agents' resistance to previous signing attempts by player decays
    # Decay by 0.1 per game, for 82 games in the regular season
    g.dbex('UPDATE player_attributes SET free_agent_times_asked = free_agent_times_asked - 0.1 WHERE team_id = :team_id', team_id=c.PLAYER_FREE_AGENT)
    g.dbex('UPDATE player_attributes SET free_agent_times_asked = 0 WHERE team_id = :team_id AND free_agent_times_asked < 0', team_id=c.PLAYER_FREE_AGENT)

def get_seasons():
    """Returns a list of all the seasons, past and present."""
    seasons = []
    r = g.dbex('SELECT season FROM team_attributes GROUP BY season ORDER BY season DESC')
    for season, in r.fetchall():
        seasons.append(season)
    return seasons
