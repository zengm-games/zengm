import random

from flask import g

from bbgm import app
import const as c

def request_context_globals(league_id):
    """Call this within an app.test_request_context() to set other globals."""
    app.preprocess_request()  # So that g is available
    g.league_id = league_id
    # The following two lines are copied from bbgm.util.decorators.global_game_attributes
    r = g.dbex('SELECT tid, season, phase, version FROM game_attributes LIMIT 1')
    g.user_tid, g.season, g.phase, g.version = r.fetchone()

def get_payroll(tid):
    """Get the total payroll for a team.

    This includes players who have been released but are still owed money from
    their old contracts.

    Returns an integer containing the payroll in thousands of dollars.
    """
    r = g.dbex('SELECT SUM(contract_amount) FROM player_attributes WHERE tid = :tid AND contract_expiration >= :contract_expiration', tid=tid, contract_expiration=g.season)
    payroll, = r.fetchone()

    r = g.dbex('SELECT SUM(contract_amount) FROM released_players_salaries WHERE tid = :tid', tid=tid)
    released_players_salaries, = r.fetchone()

    if released_players_salaries:
        payroll += released_players_salaries

    return int(payroll)

def roster_auto_sort(tid):
    """Sort the roster (i.e. pick the starters) of tid based on overall
    rating.
    """
    # Get roster
    players = []
    r = g.dbex('SELECT pa.pid, pr.overall, pr.end FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pa.tid = :tid AND pr.season = :season', tid=tid, season=g.season)
    for row in r.fetchall():
        players.append([int(i) for i in list(row)])

    # Sort by rating
    players.sort(cmp=lambda x, y: y[1] - x[1])

    # Update poss
    roster_order = 1
    for player in players:
        g.dbex('UPDATE player_attributes SET roster_order = :roster_order WHERE pid = :pid', roster_order=roster_order, pid=player[0])
        roster_order += 1

def free_agents_auto_sign():
    """AI teams sign free agents."""
    # Build free_agents containing player ids and desired contracts
    r = g.dbex('SELECT COUNT(*)/30 FROM team_stats WHERE season = :season', season=g.season)
    num_days_played, = r.fetchone()
    free_agents = []
    r = g.dbex('SELECT pa.pid, pa.contract_amount, pa.contract_expiration FROM player_attributes as pa, player_ratings as pr WHERE pa.tid = :tid AND pa.pid = pr.pid AND pr.season = :season ORDER BY pr.overall + 2*pr.pot DESC', tid=c.PLAYER_FREE_AGENT, season=g.season)
    for pid, amount, expiration in r.fetchall():
        free_agents.append([pid, amount, expiration, False])

    # Randomly order teams and let them sign free agents
    tids = list(xrange(30))
    random.shuffle(tids)
    for i in xrange(30):
        tid = tids[i]

        if tid == g.user_tid:
            continue  # Skip the user's team

        r = g.dbex('SELECT count(*) FROM player_attributes WHERE tid = :tid', tid=tid)
        num_players, = r.fetchone()
        payroll = get_payroll(tid)
        while payroll < g.salary_cap and num_players < 15:
            j = 0
            new_player = False
            for pid, amount, expiration, signed in free_agents:
                if amount + payroll <= g.salary_cap and not signed and num_players < 15:
                    g.dbex('UPDATE player_attributes SET tid = :tid, contract_amount = :contract_amount, contract_expiration = :contract_expiration WHERE pid = :pid', tid=tid, contract_amount=amount, contract_expiration=expiration, pid=pid)
                    free_agents[j][-1] = True  # Mark player signed
                    new_player = True
                    num_players += 1
                    payroll += amount
                    roster_auto_sort(tid)
                j += 1
            if not new_player:
                break

def free_agents_decrease_demands():
    # Decrease free agent demands
    r = g.dbex('SELECT pid, contract_amount, contract_expiration FROM player_attributes WHERE tid = :tid AND contract_amount > 500', tid=c.PLAYER_FREE_AGENT)
    for pid, amount, expiration in r.fetchall():
        amount -= 50
        if amount < 500:
            amount = 500
        if amount < 2000:
            expiration = g.season + 1
        if amount < 1000:
            expiration = g.season
        g.dbex('UPDATE player_attributes SET contract_amount = :contract_amount, contract_expiration = :contract_expiration WHERE pid = :pid', contract_amount=amount, contract_expiration=expiration, pid=pid)

    # Free agents' resistance to previous signing attempts by player decays
    # Decay by 0.1 per game, for 82 games in the regular season
    g.dbex('UPDATE player_attributes SET free_agent_times_asked = free_agent_times_asked - 0.1 WHERE tid = :tid', tid=c.PLAYER_FREE_AGENT)
    g.dbex('UPDATE player_attributes SET free_agent_times_asked = 0 WHERE tid = :tid AND free_agent_times_asked < 0', tid=c.PLAYER_FREE_AGENT)

def get_seasons():
    """Returns a list of all the seasons, past and present."""
    seasons = []
    r = g.dbex('SELECT season FROM team_attributes GROUP BY season ORDER BY season DESC')
    for season, in r.fetchall():
        seasons.append(season)
    return seasons
