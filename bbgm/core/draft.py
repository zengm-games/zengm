import random

from flask import session, g

import bbgm
from bbgm import app
from bbgm.core import player, season
import bbgm.util.const as c

def generate_players():
    profiles = ['Point', 'Wing', 'Big', 'Big', '']
    gp = player.GeneratePlayer()
    r = g.dbex('SELECT MAX(pid) + 1 FROM player_attributes')
    pid, = r.fetchone()
    player_attributes = []
    player_ratings = []
    for p in xrange(70):
        base_rating = random.randrange(0, 20)
        pot = int(random.gauss(45, 20))
        if pot < base_rating:
            pot = base_rating
        if pot > 90:
            pot = 90

        i = random.randrange(len(profiles))
        profile = profiles[i]

        aging_years = random.randrange(4)
        draft_year = g.season

        gp.new(pid, c.PLAYER_UNDRAFTED, 19, profile, base_rating, pot, draft_year)
        gp.develop(aging_years)

        player_attributes.append(gp.get_attributes())
        player_ratings.append(gp.get_ratings())

        pid += 1
    g.dbexmany('INSERT INTO player_attributes (%s) VALUES (%s)' % (', '.join(player_attributes[0].keys()), ', '.join([':' + key for key in player_attributes[0].keys()])), player_attributes)
    g.dbexmany('INSERT INTO player_ratings (%s) VALUES (%s)' % (', '.join(player_ratings[0].keys()), ', '.join([':' + key for key in player_ratings[0].keys()])), player_ratings)

    # Update roster positions (so next/prev buttons work in player dialog)
    roster_order = 1
    r = g.dbex('SELECT pr.pid FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pa.tid = :tid AND pr.season = :season ORDER BY pr.ovr + 2*pr.pot DESC', tid=c.PLAYER_UNDRAFTED, season=g.season)
    for pid, in r.fetchall():
        g.dbex('UPDATE player_attributes SET roster_order = :roster_order WHERE pid = :pid', roster_order=roster_order, pid=pid)
        roster_order += 1

def set_order():
    """Sets draft order based on winning percentage (no lottery)."""
    for round in xrange(1, 3):
        pick = 1
        r = g.dbex('SELECT tid, abbrev FROM team_attributes WHERE season = :season ORDER BY 1.0*won/(won + lost) ASC', season=g.season)
        for tid, abbrev in r.fetchall():
            g.dbex('INSERT INTO draft_results (season, round, pick, tid, abbrev, pid, name, pos) VALUES (:season, :round, :pick, :tid, :abbrev, 0, \'\', \'\')', season=g.season, round=round, pick=pick, tid=tid, abbrev=abbrev)
            pick += 1

def until_user_or_endu():
    """Simulate draft picks until it's the user's turn or the draft is over.

    Returns:
        A list of player IDs who were drafted.
    """
    pids = []

    r = g.dbex('SELECT tid, round, pick FROM draft_results WHERE season = :season AND pid = 0 ORDER BY round, pick ASC', season=g.season)
    for tid, round, pick in r.fetchall():
        if tid == g.user_tid:
            return pids
        team_pick = abs(int(random.gauss(0, 3)))  # 0=best prospect, 1=next best prospect, etc.
        r = g.dbex('SELECT pr.pid FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pa.tid = :tid AND pr.season = :season ORDER BY pr.ovr + 2*pr.pot DESC LIMIT :pick, 1', tid=c.PLAYER_UNDRAFTED, season=g.season, pick=team_pick)
        pid,= r.fetchone()
        pick_player(tid, pid)
        pids.append(pid)

    return pids


def pick_player(tid, pid):
    # Validate that tid should be picking now
    r = g.dbex('SELECT tid, round, pick FROM draft_results WHERE season = :season AND pid = 0 ORDER BY round, pick ASC LIMIT 1', season=g.season)
    tid_next, round, pick = r.fetchone()

    if tid_next != tid:
        app.logger.debug('WARNING: Team %d tried to draft out of order' % (tid,))
        return

    # Draft player, update roster potision
    r = g.dbex('SELECT pa.name, pa.pos, pa.born_year, pr.ovr, pr.pot FROM player_attributes AS pa, player_ratings AS pr WHERE pa.pid = pr.pid AND pa.tid = :tid AND pr.pid = :pid AND pr.season = :season', tid=c.PLAYER_UNDRAFTED, pid=pid, season=g.season)
    name, pos, born_year, ovr, pot = r.fetchone()
    r = g.dbex('SELECT MAX(roster_order) + 1 FROM player_attributes WHERE tid = :tid', tid=tid)
    roster_order, = r.fetchone()

    g.dbex('UPDATE player_attributes SET tid = :tid, draft_year = :draft_year, round = :round, draft_pick = :draft_pick, draft_tid = :tid, roster_order = :roster_order WHERE pid = :pid', tid=tid, draft_year=g.season, round=round, draft_pick=pick, draft_tid=tid, roster_order=roster_order, pid=pid)
    g.dbex('UPDATE draft_results SET pid = :pid, name = :name, pos = :pos, born_year = :born_year, ovr = :ovr, pot = :pot WHERE season = :season AND round = :round AND pick = :pick', pid=pid, name=name, pos=pos, born_year=born_year, ovr=ovr, pot=pot, season=g.season, round=round, pick=pick)

    # Contract
    rookie_salaries = (5000, 4500, 4000, 3500, 3000, 2750, 2500, 2250, 2000, 1900, 1800, 1700, 1600, 1500,
                       1400, 1300, 1200, 1100, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
                       1000, 1000, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
                       500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500)
    i = pick - 1 + 30 * (round - 1)
    contract_amount = rookie_salaries[i]
    years = 4 - round  # 2 years for 2nd round, 3 years for 1st round
    contract_exp = g.season + years
    g.dbex('UPDATE player_attributes SET contract_amount = :contract_amount, contract_exp = :contract_exp WHERE pid = :pid', contract_amount=contract_amount, contract_exp=contract_exp, pid=pid)

    # Is draft over?
    r = g.dbex('SELECT 1 FROM draft_results WHERE season = :season AND pid = 0', season=g.season)
    if r.rowcount == 0:
        season.new_phase(c.PHASE_AFTER_DRAFT)

    return pid
