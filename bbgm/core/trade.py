import cPickle as pickle

from flask import session, g

from bbgm.util import get_payroll, roster_auto_sort
import bbgm.util.const as c

def new(tid=None, pid=None):
    """Start a new trade with a team.

    One of tid or pid can be set. If both are set, then tid is
    ignored. If neither are set, a tid of 0 is used.

    Args: 
        tid: An optional integer representing the team ID of the team the
            user wants to trade with.
        pid: An optional integer representing the ID of a player to be
            automatically added to the trade. Then, a trade will be initiated
            with that player's team, regardless of what tid is set to.
    """
    # Convert pid to tid
    if pid is None:
        pids_other = []
    else:
        pids_other = [int(pid)]

    # Make sure tid is set and corresponds to pid, if set
    if tid is None or pid is not None:
        r = g.dbex('SELECT tid FROM player_attributes WHERE pid = :pid', pid=pid)
        tid, = r.fetchone()

    # Start a new trade with tid and, if set, pid
    g.dbex('UPDATE trade SET tid = :tid, pids_other = :pids_other', tid=tid, pids_other=pickle.dumps(pids_other))


def update_players(pids_user, pids_other):
    """Validates that players are allowed to be traded and then updates the
    trade in the database.

    If any of the player IDs submitted do not correspond with the two teams that
    are trading, they will be ignored.

    Args:
        pids_user: A list of integer player IDs from the user's team that
            are in the trade.
        pids_other: Same as pids_user but for the other team.

    Returns:
        A tuple containing the same lists as in the input, but with any invalid
        IDs removed.
    """
    pids = [pids_user, pids_other]

    # Ignore any invalid player IDs    
    r = g.dbex('SELECT tid FROM trade')
    tid_other, = r.fetchone()
    tids = (g.user_tid, tid_other)
    for i in xrange(len(tids)):
        r = g.dbex('SELECT pid FROM player_attributes WHERE tid = :tid', tid=tids[i])
        all_pids = [pid for pid, in r.fetchall()]
        pids[i] = [pid for pid in pids[i] if pid in all_pids]

    # Save to database
    pids_user, pids_other = pids
    g.dbex('UPDATE trade SET pids_user = :pids_user, pids_other = :pids_other', pids_user=pickle.dumps(pids_user), pids_other=pickle.dumps(pids_other))

    return (pids_user, pids_other)


def get_players():
    """Return two lists of integers, representing the player IDs who are added
    to the trade for the user's team and the other team, respectively.
    """
    pids_user = []
    pids_other = []

    r = g.dbex('SELECT pids_user, pids_other FROM trade')
    row = r.fetchone()

    if row[0] is not None:
        pids_user = pickle.loads(row[0])
    if row[1] is not None:
        pids_other = pickle.loads(row[1])
    return (pids_user, pids_other)


def summary(tid_other, pids_user, pids_other):
    """Return all the content needed to summarize the trade."""
    tids = [g.user_tid, tid_other]
    pids = [pids_user, pids_other]

    s = {'trade': [[], []], 'total': [0, 0], 'payroll_after_trade': [0, 0], 'team_names': ['', ''], 'warning': ''}

    # Calculate properties of the trade
    for i in xrange(2):
        if len(pids[i]) > 0:
            pids_sql = ', '.join([str(pid) for pid in pids[i]])
            r = g.dbex('SELECT pid, name, contract_amount / 1000 AS contract_amount FROM player_attributes WHERE pid IN (%s)' % (pids_sql,))
            s['trade'][i] = r.fetchall()
            r = g.dbex('SELECT SUM(contract_amount / 1000) FROM player_attributes WHERE pid IN (%s)' % (pids_sql,))
            s['total'][i], = r.fetchone()

    # Test if any warnings need to be displayed
    over_cap = [False, False]
    over_roster_limit = [False, False]
    ratios = [0.0, 0.0]

    for i in xrange(2):
        if i == 0:
            j = 1
        elif i == 1:
            j = 0

        s['payroll_after_trade'][i] = float(get_payroll(tids[i])) / 1000 + float(s['total'][j]) - float(s['total'][i])

        r = g.dbex('SELECT CONCAT(region, " ", name) FROM team_attributes WHERE tid = :tid AND season = :season', tid=tids[i], season=g.season)
        s['team_names'][i], = r.fetchone()
        r = g.dbex('SELECT COUNT(*) FROM player_attributes WHERE tid = :tid', tid=tids[i])
        num_players_on_roster, = r.fetchone() 

        if s['payroll_after_trade'][i] > float(g.salary_cap) / 1000:
            over_cap[i] = True
        if num_players_on_roster - len(pids[i]) + len(pids[j]) > 15:
            over_roster_limit[i] = True
        if s['total'][i] > 0:
            ratios[i] = int((100.0 * float(s['total'][j])) / float(s['total'][i]))
        elif s['total'][j] > 0:
            ratios[i] = float('inf')
        else:
            ratios[i] = 1

    if True in over_roster_limit:
        # Which team is at fault?
        if over_roster_limit[0] == True:
            team_name = s['team_names'][0]
        else:
            team_name = s['team_names'][1]
        s['warning'] = 'This trade would put the %s over the maximum roster size limit of 15 players.' % (team_name,)
    elif (ratios[0] > 125 and over_cap[0] == True) or (ratios[1] > 125 and over_cap[1] == True):
        # Which team is at fault?
        if ratios[0] > 125:
            team_name = s['team_names'][0]
            ratio = ratios[0]
        else:
            team_name = s['team_names'][1]
            ratio = ratios[1]
        s['warning'] = 'The %s are over the salary cap, so the players it receives must have a combined salary less than 125%% of the players it trades.  Currently, that value is %s%%.' % (team_name, ratio)

    return s


def clear():
    """Removes all players currently added to the trade."""
    g.dbex('UPDATE trade SET pids_user = :pids_user, pids_other = :pids_other', pids_user=pickle.dumps([]), other=pickle.dumps([]))


def propose(tid_other, pids_user, pids_other):
    """Proposes the current trade in the database.

    Returns:
        A tuple containing a boolean representing whether the trade was accepted
        (True) or not (False), and a string containing a message to be pushed to
        the user.
    """
    tids = [g.user_tid, tid_other]
    pids = [pids_user, pids_other]

    if g.phase >= c.PHASE_AFTER_TRADE_DEADLINE and g.phase <= c.PHASE_PLAYOFFS:
        return (False, "Error! You're not allowed to make trades now.")

    # The summary will return a warning if there is a problem. In that case,
    # that warning will already be pushed to the user so there is no need to
    # return a redundant message here.
    r = g.dbex('SELECT tid FROM trade')
    tid_other, = r.fetchone()
    s = summary(tid_other, pids_user, pids_other)
    if len(s['warning']) > 0:
        return (False, '')

    value = [0.0, 0.0]  # "Value" of the players offered by each team
    for i in xrange(2):
        if len(pids[i]) > 0:
            pids_sql = ', '.join([str(pid) for pid in pids[i]])
            r = g.dbex('SELECT pa.pid, pa.contract_amount / 1000 AS contract_amount, :season - pa.born_year AS age, pr.overall, pr.potential FROM player_attributes AS pa, player_ratings AS pr WHERE pa.pid IN (%s) AND pr.pid = pa.pid AND pr.season = :season' % (pids_sql,), season=g.season)
            for p in r.fetchall():
                value[i] += 10 ** (float(p['potential']) / 10.0 + float(p['overall']) / 20.0 - float(p['age']) / 10.0 - float(p['contract_amount']) / 100000.0)

    if value[0] > value[1] * 0.9:
        # Trade players
        for i in xrange(2):
            if i == 0:
                j = 1
            elif i == 1:
                j = 0
            for pid in pids[i]:
                g.dbex('UPDATE player_attributes SET tid = :tid WHERE pid = :pid', tid=tids[j], pid=pid)

        # Auto-sort CPU team roster
        roster_auto_sort(tids[1])

        clear()

        return (True, 'Trade accepted! "Nice doing business with you!"')
    else:
        return (False, 'Trade rejected! "What, are you crazy?"')
