import cPickle as pickle
import random

from flask import session, g

import bbgm
from bbgm import app
from bbgm.core import contract_negotiation, play_menu, player
from bbgm.util import free_agents_auto_sign, lock, roster_auto_sort
import bbgm.util.const as c

def new_phase(phase):
    """Set a new phase of the game.

    This function is called to do all the crap that must be done during
    transitions between phases of the game, such as moving from the regular
    season to the playoffs. Phases are defined as:
        0: Preseason
        1: Regular season, before trade deadline
        2: Regular season, after trade deadline (NOTE: not implemented yet)
        3: Playoffs
        4: Offseason, before draft
        5: Draft
        6: Offseason, after draft
        7: Offseason, resign players
        8: Offseason, free agency

    Returns:
        False if everything went well, or a string containing an error message
        to be sent to the client.
    """

    # Prevent code running twice
    if phase == g.phase:
        return

    # Preseason
    if phase == c.PHASE_PRESEASON:
        g.season += 1
        g.dbex('UPDATE game_attributes SET season = season + 1')
        phase_text = '%s preseason' % (g.season,)

        # Create new rows in team_attributes
        r = g.dbex('SELECT tid, did, region, name, abbrev, cash FROM team_attributes WHERE season = :season', season=g.season - 1)
        for row in r.fetchall():
            g.dbex('INSERT INTO team_attributes (tid, did, region, name, abbrev, cash, season) VALUES (:tid, :did, :region, :name, :abbrev, :cash, :season)', season=g.season, **row)

        # Create new rows in player_ratings, only for active players
        r = g.dbex('SELECT pr.pid, season + 1 AS season, overall, pr.height, strength, speed, jumping, end, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blk, stl, dribbling, passing, rebounding, potential FROM player_ratings AS pr, player_attributes AS pa WHERE pa.pid = pr.pid AND pr.season = :season AND pa.tid != :tid', season=g.season - 1, tid=c.PLAYER_RETIRED)
        for row in r.fetchall():
            g.dbex('INSERT INTO player_ratings (pid, season, overall, height, strength, speed, jumping, end, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blk, stl, dribbling, passing, rebounding, potential) VALUES (:pid, :season, :overall, :height, :strength, :speed, :jumping, :end, :shooting_inside, :shooting_layups, :shooting_free_throws, :shooting_two_pointers, :shooting_three_pointers, :blk, :stl, :dribbling, :passing, :rebounding, :potential)', **row)

        # Age players
        pids = []
        r = g.dbex('SELECT pid FROM player_attributes WHERE tid != :tid', tid=c.PLAYER_RETIRED)
        for pid, in r.fetchall():
            pids.append(pid)
        up = player.Player()
        for pid in pids:
            up.load(pid)
            up.develop()
            up.save()

        # AI teams sign free agents
        free_agents_auto_sign()

    # Regular season, before trade deadline
    elif phase == c.PHASE_REGULAR_SEASON:
        phase_text = '%s regular season' % (g.season,)
        # First, make sure teams are all within the roster limits
        # CPU teams
        r = g.dbex('SELECT ta.tid, COUNT(*) FROM team_attributes as ta, player_attributes as pa WHERE ta.tid = pa.tid AND ta.season = :season GROUP BY pa.tid', season=g.season)
        teams = r.fetchall()
        for tid, num_players_on_roster in teams:
            if num_players_on_roster > 15:
                if tid == g.user_tid:
                    return 'Your team currently has more than the maximum number of players (15). You must release or buy out players (from the Roster page) before the season starts.'
                else:
                    # Automatically drop lowest potential players until we reach 15
                    r = g.dbex('SELECT pa.pid FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pa.tid = :tid AND pr.season = :season ORDER BY pr.potential ASC LIMIT :n_excess_players', tid=tid, season=g.season, n_excess_players=num_players_on_roster-15)
                    for pid, in r.fetchall():
                        # Release player.
                        p = player.Player()
                        p.load(pid)
                        p.release()
            elif num_players_on_roster < 5:
                if tid == g.user_tid:
                    return 'Your team currently has less than the minimum number of players (5). You must add players (through free agency or trades) before the season starts.'
                else:
                    # Should auto-add players
                    pass

        new_schedule()

        # Auto sort rosters (except player's team)
        for t in range(30):
            if t != g.user_tid:
                roster_auto_sort(t)

    # Regular season, after trade deadline
    elif phase == c.PHASE_AFTER_TRADE_DEADLINE:
        phase_text = '%s regular season, after trade deadline' % (g.season,)
        pass

    # Playoffs
    elif phase == c.PHASE_PLAYOFFS:
        phase_text = '%s playoffs' % (g.season,)

        # Select winners of the season's awards
        awards()

        # Set playoff matchups
        for cid in range(2):
            teams = []
            r = g.dbex('SELECT ta.tid FROM team_attributes as ta, divisions as ld WHERE ld.did = ta.did AND ld.cid = :cid AND ta.season = :season ORDER BY 1.0*ta.won/(ta.won + ta.lost) DESC LIMIT 8', cid=cid, season=g.season)
            tids = [tid for tid, in r.fetchall()]
            g.dbex('UPDATE team_attributes SET playoffs = 1 WHERE season = :season AND tid IN :tids', season=g.season, tids=tids)

            params = [dict(season=g.season, tid_home=tids[0], tid_away=tids[7], seed_home=1, seed_away=8),
                      dict(season=g.season, tid_home=tids[3], tid_away=tids[4], seed_home=4, seed_away=5),
                      dict(season=g.season, tid_home=tids[2], tid_away=tids[5], seed_home=3, seed_away=6),
                      dict(season=g.season, tid_home=tids[1], tid_away=tids[6], seed_home=2, seed_away=7)]
            g.dbexmany('INSERT INTO playoff_series (series_round, season, tid_home, tid_away, seed_home, seed_away, won_home, won_away) VALUES (1, :season, :tid_home, :tid_away, :seed_home, :seed_away, 0, 0)', params)

    # Offseason, before draft
    elif phase == c.PHASE_BEFORE_DRAFT:
        phase_text = '%s before draft' % (g.season,)
        # Remove released players' salaries from payrolls
        g.dbex('DELETE FROM released_players_salaries WHERE contract_expiration <= :season', season=g.season)

        # Add a year to the free agents
        g.dbex('UPDATE player_attributes SET contract_expiration = contract_expiration + 1 WHERE tid = :tid', tid=c.PLAYER_FREE_AGENT)

    # Draft
    elif phase == c.PHASE_DRAFT:
        phase_text = '%s draft' % (g.season,)

    # Offseason, after draft
    elif phase == c.PHASE_AFTER_DRAFT:
        phase_text = '%s after draft' % (g.season,)

    # Offseason, resign players
    elif phase == c.PHASE_RESIGN_PLAYERS:
        phase_text = '%s resign players' % (g.season,)

        # Check for retiring players
        # Call the contructor each season because that's where the code to check for retirement is
#        rpw = retired_players_window.RetiredPlayersWindow(self)  # Do the retired player check
#        rpw.retired_players_window.run()
#        rpw.retired_players_window.destroy()

        # Resign players
        r = g.dbex('SELECT pid, tid, name FROM player_attributes WHERE contract_expiration = :season AND tid >= 0', season=g.season)
        for pid, tid, name in r.fetchall():
            if tid != g.user_tid:
                # Automatically negotiate with teams
                resign = random.choice([True, False])
                p = player.Player()
                p.load(pid)
                if resign:
                    amount, expiration = p.contract()
                    g.dbex('UPDATE player_attributes SET contract_amount = :contract_amount, contract_expiration = :contract_expiration WHERE pid = :pid', contract_amount=amount, contract_expiration=expiration, pid=pid)
                else:
                    p.add_to_free_agents(phase)
            else:
                # Add to free agents first, to generate a contract demand
                p = player.Player()
                p.load(pid)
                p.add_to_free_agents(phase)

                # Open negotiations with player
                error = contract_negotiation.new(pid, resigning=True)
                if error:
                    app.logger.debug(error)

    # Offseason, free agency
    elif phase == c.PHASE_FREE_AGENCY:
        phase_text = '%s free agency' % (g.season,)

        # Delete all current negotiations to resign players
        contract_negotiation.cancel_all()

        # Reset contract demands of current free agents
        r = g.dbex('SELECT pid FROM player_attributes WHERE tid = :tid', tid=c.PLAYER_FREE_AGENT)
        for pid, in r.fetchall():
            p = player.Player()
            p.load(pid)
            p.add_to_free_agents(phase)

        # Move undrafted players to free agent pool
        r = g.dbex('SELECT pid FROM player_attributes WHERE tid = :tid', tid=c.PLAYER_UNDRAFTED)
        for pid, in r.fetchall():
            g.dbex('UPDATE player_attributes SET draft_year = -1, draft_round = -1, draft_pick = -1, draft_tid = -1 WHERE pid = :pid', pid=pid)
            p = player.Player()
            p.load(pid)
            p.add_to_free_agents(phase)

    old_phase = g.phase
    g.phase = phase

    g.dbex('UPDATE game_attributes SET phase = :phase', phase=g.phase)

    play_menu.set_phase(phase_text)
    play_menu.refresh_options()

    return False

def new_schedule():
    """Creates a new regular season schedule with appropriate division and
    conference matchup distributions.
    """
    teams = []
    r = g.dbex('SELECT tid, did, (SELECT cid FROM divisions as ld WHERE ld.did = ta.did) FROM team_attributes as ta WHERE season = :season', season=g.season)
    for row in r.fetchall():
        teams.append({'tid': row[0], 'did': row[1], 'cid': row[2], 'home_games': 0, 'away_games': 0})
    tids = []  # tid_home, tid_away

    for i in range(len(teams)):
        for j in range(len(teams)):
            if teams[i]['tid'] != teams[j]['tid']:
                game = [teams[i]['tid'], teams[j]['tid']]

                # Constraint: 1 home game vs. each team in other conference
                if teams[i]['cid'] != teams[j]['cid']:
                    tids.append(game)
                    teams[i]['home_games'] += 1
                    teams[j]['away_games'] += 1

                # Constraint: 2 home schedule vs. each team in same division
                if teams[i]['did'] == teams[j]['did']:
                    tids.append(game)
                    tids.append(game)
                    teams[i]['home_games'] += 2
                    teams[j]['away_games'] += 2

                # Constraint: 1-2 home schedule vs. each team in same conference and different division
                # Only do 1 now
                if (teams[i]['cid'] == teams[j]['cid'] and
                    teams[i]['did'] != teams[j]['did']):
                    tids.append(game)
                    teams[i]['home_games'] += 1
                    teams[j]['away_games'] += 1

    # Constraint: 1-2 home schedule vs. each team in same conference and different division
    # Constraint: We need 8 more of these games per home team!
    tids_by_conference = [[], []]
    dids = [[], []]
    for i in range(len(teams)):
        tids_by_conference[teams[i]['cid']].append(i)
        dids[teams[i]['cid']].append(teams[i]['did'])
    for d in range(2):
        matchups = []
        matchups.append(range(15))
        games = 0
        while games < 8:
            new_matchup = []
            n = 0
            while n <= 14:  # 14 = num teams in conference - 1
                iters = 0
                while True:
                    try_n = random.randint(0, 14)
                    # Pick try_n such that it is in a different division than n and has not been picked before
                    if dids[d][try_n] != dids[d][n] and try_n not in new_matchup:
                        good = True
                        # Check for duplicate games
                        for matchup in matchups:
                            if matchup[n] == try_n:
                                good = False
                                break
                        if good:
                            new_matchup.append(try_n)
                            break
                    iters += 1
                    # Sometimes this gets stuck (for example, first 14 teams in fine but 15th team must play itself)
                    # So, catch these situations and reset the new_matchup
                    if iters > 50:
                        new_matchup = []
                        n = -1
                        break
                n += 1
            matchups.append(new_matchup)
            games += 1
        matchups.pop(0)  # Remove the first row in matchups
        for matchup in matchups:
            for t in matchup:
                i = tids_by_conference[d][t]
                j = tids_by_conference[d][matchup[t]]
                game = [teams[i]['tid'], teams[j]['tid']]
                tids.append(game)
                teams[i]['home_games'] += 1
                teams[j]['away_games'] += 1

    random.shuffle(tids)
    set_schedule(tids)

def new_schedule_playoffs_day():
    """Creates a single day's schedule for an in-progress playoffs."""
    num_active_teams = 0

    # Make today's  playoff schedule
    tids = []
    active_series = False
    # Round: 1, 2, 3, or 4
    r = g.dbex('SELECT MAX(series_round) FROM playoff_series WHERE season = :season', season=g.season)
    current_round, = r.fetchone()

    r = g.dbex('SELECT tid_home, tid_away FROM playoff_series WHERE won_home < 4 AND won_away < 4 AND series_round = :series_round AND season = :season', series_round=current_round, season=g.season)
    for tid_home, tid_away in r.fetchall():
        tids.append([tid_home, tid_away])
        active_series = True
        num_active_teams += 2
    if len(tids) > 0:
        set_schedule(tids)
    if not active_series:
        # The previous round is over

        # Who won?
        winners = {}
        r = g.dbex('SELECT sid, tid_home, tid_away, seed_home, seed_away, won_home, won_away FROM playoff_series WHERE series_round = :series_round AND season = :season ORDER BY sid ASC', series_round=current_round, season=g.season)
        for row in r.fetchall():
            sid, tid_home, tid_away, seed_home, seed_away, won_home, won_away = row
            if won_home == 4:
                winners[sid] = [tid_home, seed_home]
            else:
                winners[sid] = [tid_away, seed_away]
            # Record user's team as conference and league champion
            if current_round == 3:
                g.dbex('UPDATE team_attributes SET won_conference = 1 WHERE season = :season AND tid = :tid', season=g.season, tid=winners[sid][0])
            elif current_round == 4:
                g.dbex('UPDATE team_attributes SET won_championship = 1 WHERE season = :season AND tid = :tid', season=g.season, tid=winners[sid][0])

        # Are the whole playoffs over?
        if current_round == 4:
            new_phase(c.PHASE_BEFORE_DRAFT)

        # Add a new round to the database
        current_round += 1
        query = ('INSERT INTO playoff_series (series_round, season, tid_home, tid_away, seed_home, seed_away, won_home, won_away) VALUES (:series_round, :season, :tid_home, :tid_away, :seed_home, :seed_away, 0, 0)')
        sids = winners.keys()
        for i in range(min(sids), max(sids), 2):  # Go through winners by 2
            if winners[i][1] < winners[i + 1][1]:  # Which team is the home team?
                g.dbex(query, series_round=current_round, season=g.season, tid_home=winners[i][0], tid_away=winners[i + 1][0], seed_home=winners[i][1], seed_away=winners[i + 1][1])
            else:
                g.dbex(query, series_round=current_round, season=g.season, tid_home=winners[i + 1][0], tid_away=winners[i][0], seed_home=winners[i + 1][1], seed_away=winners[i][1])

    return num_active_teams

def awards():
    """Computes the awards at the end of a season."""
    # Cache averages
    g.dbex('CREATE TEMPORARY TABLE awards_avg (pid INTEGER PRIMARY KEY, name VARCHAR(255), tid INTEGER, abbrev VARCHAR(3), draft_year INTEGER, games_played INTEGER, games_started INTEGER, min FLOAT, pts FLOAT, trb FLOAT, ast FLOAT, blk FLOAT, stl FLOAT)')
    g.dbex('INSERT INTO awards_avg (pid, name, tid, abbrev, draft_year, games_played, games_started, min, pts, trb, ast, blk, stl) (SELECT pa.pid, pa.name, pa.tid, ta.abbrev, pa.draft_year, SUM(ps.min>0) AS games_played, SUM(ps.gs) AS games_started, AVG(ps.min) AS min, AVG(ps.pts) AS pts, AVG(ps.orb+ps.drb) AS trb, AVG(ps.ast) AS ast, AVG(ps.blk) AS blk, AVG(ps.stl) AS stl FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.pid = ps.pid AND ps.season = :season AND ps.playoffs = 0 AND ta.tid = pa.tid AND ta.season = ps.season GROUP BY ps.pid)', season=g.season)

    r = g.dbex('SELECT tid, abbrev, region, name, won, lost FROM team_attributes AS ta WHERE season = :season AND (SELECT cid FROM divisions AS ld WHERE ld.did = ta.did) = 0 ORDER BY 1.0*won/(won + lost) DESC', season=g.season)
    bre = r.fetchone()
    r = g.dbex('SELECT tid, abbrev, region, name, won, lost FROM team_attributes AS ta WHERE season = :season AND (SELECT cid FROM divisions AS ld WHERE ld.did = ta.did) = 1 ORDER BY 1.0*won/(won + lost) DESC', season=g.season)
    brw = r.fetchone()

    r = g.dbex('SELECT pid, name, tid, abbrev, pts, trb, ast FROM awards_avg ORDER BY (0.75 * pts) + ast + trb DESC')
    mvp =  r.fetchone()
    r = g.dbex('SELECT pid, name, tid, abbrev, trb, blk, stl FROM awards_avg ORDER BY trb + 5 * blk + 5 * stl DESC')
    dpoy = r.fetchone()
    r = g.dbex('SELECT pid, name, tid, abbrev, pts, trb, ast FROM awards_avg WHERE games_played/(games_started+1) > 2 ORDER BY (0.75 * pts) + ast + trb DESC')
    smoy = r.fetchone()
    r = g.dbex('SELECT pid, name, tid, abbrev, pts, trb, ast FROM awards_avg WHERE draft_year = :season - 1 ORDER BY (0.75 * pts) + ast + trb DESC', season=g.season)
    roy = r.fetchone()

    g.dbex('INSERT INTO awards (season, bre_tid, bre_abbrev, bre_region, bre_name, bre_won, bre_lost, brw_tid, brw_abbrev, brw_region, brw_name, brw_won, brw_lost, mvp_pid, mvp_name, mvp_tid, mvp_abbrev, mvp_pts, mvp_trb, mvp_ast, dpoy_pid, dpoy_name, dpoy_tid, dpoy_abbrev, dpoy_trb, dpoy_blk, dpoy_stl, smoy_pid, smoy_name, smoy_tid, smoy_abbrev, smoy_pts, smoy_trb, smoy_ast, roy_pid, roy_name, roy_tid, roy_abbrev, roy_pts, roy_trb, roy_ast) VALUES (:season, :bre_tid, :bre_abbrev, :bre_region, :bre_name, :bre_won, :bre_lost, :brw_tid, :brw_abbrev, :brw_region, :brw_name, :brw_won, :brw_lost, :mvp_pid, :mvp_name, :mvp_tid, :mvp_abbrev, :mvp_pts, :mvp_trb, :mvp_ast, :dpoy_pid, :dpoy_name, :dpoy_tid, :dpoy_abbrev, :dpoy_trb, :dpoy_blk, :dpoy_stl, :smoy_pid, :smoy_name, :smoy_tid, :smoy_abbrev, :smoy_pts, :smoy_trb, :smoy_ast, :roy_pid, :roy_name, :roy_tid, :roy_abbrev, :roy_pts, :roy_trb, :roy_ast)', season=g.season, bre_tid=bre['tid'], bre_abbrev=bre['abbrev'], bre_region=bre['region'], bre_name=bre['name'], bre_won=bre['won'], bre_lost=bre['lost'], brw_tid=brw['tid'], brw_abbrev=brw['abbrev'], brw_region=brw['region'], brw_name=brw['name'], brw_won=brw['won'], brw_lost=brw['lost'], mvp_pid=mvp['pid'], mvp_name=mvp['name'], mvp_tid=mvp['tid'], mvp_abbrev=mvp['abbrev'], mvp_pts=mvp['pts'], mvp_trb=mvp['trb'], mvp_ast=mvp['ast'], dpoy_pid=dpoy['pid'], dpoy_name=dpoy['name'], dpoy_tid=dpoy['tid'], dpoy_abbrev=dpoy['abbrev'], dpoy_trb=dpoy['trb'], dpoy_blk=dpoy['blk'], dpoy_stl=dpoy['stl'], smoy_pid=smoy['pid'], smoy_name=smoy['name'], smoy_tid=smoy['tid'], smoy_abbrev=smoy['abbrev'], smoy_pts=smoy['pts'], smoy_trb=smoy['trb'], smoy_ast=smoy['ast'], roy_pid=roy['pid'], roy_name=roy['name'], roy_tid=roy['tid'], roy_abbrev=roy['abbrev'], roy_pts=roy['pts'], roy_trb=roy['trb'], roy_ast=roy['ast'])

    g.dbex('INSERT INTO awards_all_league (season, team_type, pid, name, abbrev, pts, trb, ast, blk, stl) (SELECT :season, \'league\', pid, name, abbrev, pts, trb, ast, blk, stl FROM awards_avg ORDER BY (0.75 * pts) + ast + trb DESC LIMIT 15)', season=g.season)
    g.dbex('INSERT INTO awards_all_league (season, team_type, pid, name, abbrev, pts, trb, ast, blk, stl) (SELECT :season, \'defensive\', pid, name, abbrev, pts, trb, ast, blk, stl FROM awards_avg ORDER BY trb + 5 * blk + 5 * stl DESC LIMIT 15)', season=g.season)

    g.dbex('DROP TABLE awards_avg')

def set_schedule(tids):
    """Save the schedule to the database, overwriting what's currently there.

    Args:
        tids: A list of lists, each containing the team IDs of the home and
            away teams, respectively, for every game in the season.
    """
    g.dbex('DELETE FROM schedule')
    params = []
    for home_tid, away_tid in tids:
        params.append({'home_tid': home_tid, 'away_tid': away_tid})
    g.dbexmany('INSERT INTO schedule (home_tid, away_tid) VALUES (:home_tid, :away_tid)', params)

def get_schedule(n_games=0):
    """Returns a list of n_games games, or all games in the schedule if n_games
    is 0 (default). Each element in the list is a dict with keys 'gid',
    'home_tid', and 'away_tid'.
    """
    if n_games > 0:
        r = g.dbex('SELECT gid, home_tid, away_tid FROM schedule ORDER BY gid ASC LIMIT :n_games', n_games=n_games)
    else:
        r = g.dbex('SELECT gid, home_tid, away_tid FROM schedule ORDER BY gid ASC')
    return [dict(row) for row in r.fetchall()]
