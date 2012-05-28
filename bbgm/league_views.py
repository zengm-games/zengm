from jinja2.utils import concat
import json
import random
import time

from flask import jsonify, render_template, url_for, request, session, redirect, g
from flask.globals import _request_ctx_stack

from bbgm import app
from bbgm.core import draft, game, contract_negotiation, play_menu, player, season, trade
from bbgm.util import get_payroll, get_seasons, lock, roster_auto_sort
from bbgm.util.decorators import league_crap, league_crap_ajax
import bbgm.util.const as c


# All the views in here are for within a league.

@app.url_defaults
def add_league_id(endpoint, values):
    if 'league_id' in values or not g.league_id:
        return
    if app.url_map.is_endpoint_expecting(endpoint, 'league_id'):
        values['league_id'] = g.league_id


@app.url_value_preprocessor
def pull_league_id(endpoint, values):
    g.league_id = values.pop('league_id', None)
    if g.league_id is not None:
        g.league_id = int(g.league_id)


@app.route('/<int:league_id>')
@league_crap
def league_dashboard():
    return render_all_or_json('league_dashboard.html')


@app.route('/<int:league_id>/leaders')
@app.route('/<int:league_id>/leaders/<int:view_season>')
@league_crap
def leaders(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    categories = []
    categories.append({'name': 'Points', 'stat': 'Pts',
                       'title': 'Points Per Game', 'data': []})
    categories.append({'name': 'Rebounds', 'stat': 'Reb',
                       'title': 'Rebounds Per Game', 'data': []})
    categories.append({'name': 'Assists', 'stat': 'Ast',
                       'title': 'Assists Per Game', 'data': []})
    categories.append({'name': 'Field Goal Percentage', 'stat': 'FG%',
                       'title': 'Field Goal Percentage', 'data': []})
    categories.append({'name': 'Blocks', 'stat': 'Blk',
                       'title': 'Blocks Per Game', 'data': []})
    categories.append({'name': 'Steals', 'stat': 'Stl',
                       'title': 'Steals Per Game', 'data': []})

    cols = ['ps.pts', 'ps.orb+ps.drb',
            'ps.ast', '100*ps.fg/ps.fga',
            'ps.blk', 'ps.stl']
    for i in xrange(len(cols)):
        # I have to insert the cateogry using string formatting because
        # otherwise it mangles the syntax. But it's okay, cols is defined just a
        # few lines up. Nothing malicious there.
        r = g.dbex('SELECT pa.pid, pa.name, ta.abbrev, AVG(%s) as stat FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.pid = ps.pid AND ps.season = :season AND ps.playoffs = 0 AND ta.tid = ps.tid AND ta.season = ps.season GROUP BY ps.pid ORDER BY AVG(%s) DESC LIMIT 10' % (cols[i], cols[i]), season=view_season)
        categories[i]['data'] = r.fetchall()

    r = g.dbex('SELECT abbrev FROM team_attributes WHERE tid = :tid AND season = :season', tid=g.user_tid, season=view_season)
    user_abbrev, = r.fetchone()

    return render_all_or_json('leaders.html', {'categories': categories, 'user_abbrev': user_abbrev, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/player_ratings')
@app.route('/<int:league_id>/player_ratings/<int:view_season>')
@league_crap
def player_ratings(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    r = g.dbex('SELECT pa.pid, pa.tid, pa.name, (SELECT abbrev FROM team_attributes WHERE tid = pa.tid AND season = :season) as abbrev, pa.pos, :season - pa.born_year as age, pr.overall, pr.potential, pr.height, pr.strength, pr.speed, pr.jumping, pr.endurance, pr.shooting_inside, pr.shooting_layups, pr.shooting_free_throws, pr.shooting_two_pointers, pr.shooting_three_pointers, pr.blk, pr.stl, pr.dribbling, pr.passing, pr.rebounding FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pr.season = :season', season=view_season)
    players = r.fetchall()

    return render_all_or_json('player_ratings.html', {'players': players, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/player_stats')
@app.route('/<int:league_id>/player_stats/<int:view_season>')
@league_crap
def player_stats(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    r = g.dbex('SELECT pa.pid, pa.tid, pa.name, ta.abbrev, pa.pos, SUM(ps.min>0) AS games_played, SUM(ps.gs) AS games_started, AVG(ps.min) AS min, AVG(ps.fg) AS fg, AVG(ps.fga) AS fga, 100*AVG(ps.fg/ps.fga) AS field_goal_percentage, AVG(ps.tp) AS tp, AVG(ps.tpa) AS tpa, 100*AVG(ps.tp/ps.tpa) AS three_point_percentage, AVG(ps.ft) AS ft, AVG(ps.fta) AS fta, 100*AVG(ps.ft/ps.fta) AS free_throw_percentage, AVG(ps.orb) AS orb, AVG(ps.drb) AS drb, AVG(ps.orb+ps.drb) AS rebounds, AVG(ps.ast) AS ast, AVG(ps.tov) AS tov, AVG(ps.stl) AS stl, AVG(ps.blk) AS blk, AVG(ps.pf) AS pf, AVG(ps.pts) AS pts FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.pid = ps.pid AND ps.season = :season AND ps.playoffs = 0 AND ta.tid = ps.tid AND ta.season = ps.season GROUP BY ps.pid', season=view_season)
    players = r.fetchall()

    # Don't pass blank values where floats are expected by the template
#    for i in xrange(len(players)):
#        for key in players[i].keys():
#            if not players[i][key]:
#                players[i][key] = 0

    return render_all_or_json('player_stats.html', {'players': players, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/play/<amount>', methods=['POST'])
@league_crap_ajax
def play(amount):
    """This is kind of a hodgepodge that handles every request from the play
    button and returns the appropriate response in JSON.
    """
    error = None
    url = None
    schedule = None
    teams = None
    playoffs_continue = None
    try:
        num_days = int(amount)
    except ValueError:
        num_days = -1

    if num_days >= 0:
        # Continue playing games
        teams, schedule, playoffs_continue, url = game.play(num_days)
    elif amount in ['day', 'week', 'month', 'until_playoffs', 'through_playoffs']:
        # Start playing games
        start = True

        if amount == 'day':
            num_days = 1
        elif amount == 'week':
            num_days = 7
        elif amount == 'month':
            num_days = 30
        elif amount == 'until_playoffs':
            r = g.dbex('SELECT COUNT(*)/:num_teams FROM team_stats WHERE season = :season', num_teams=g.num_teams, season=g.season)
            row = r.fetchone()
            num_days = int(g.season_length - row[0])  # Number of days remaining
        elif amount == 'through_playoffs':
            num_days = 100  # There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end

        teams, schedule, playoffs_continue, url = game.play(num_days, start)
    elif amount == 'stop':
        g.dbex('UPDATE game_attributes SET stop_games = 1 WHERE season = :season', season=g.season)
        g.dbex('UPDATE schedule SET in_progress_timestamp = 0')

        # This is needed because we can't be sure if bbgm.core.game.play will be called again
        play_menu.set_status('Idle')
        lock.set_games_in_progress(False)
        play_menu.refresh_options()
    elif amount == 'until_draft':
        if g.phase == c.PHASE_BEFORE_DRAFT:
            season.new_phase(c.PHASE_DRAFT)
            draft.generate_players()
            draft.set_order()
        url = url_for('draft_', league_id=g.league_id)
    elif amount == 'until_resign_players':
        if g.phase == c.PHASE_AFTER_DRAFT:
            season.new_phase(c.PHASE_RESIGN_PLAYERS)
        url = url_for('negotiation_list', league_id=g.league_id)
    elif amount == 'until_free_agency':
        if g.phase == c.PHASE_RESIGN_PLAYERS:
            season.new_phase(c.PHASE_FREE_AGENCY)
            play_menu.set_status('Idle')
        url = url_for('free_agents', league_id=g.league_id)
    elif amount == 'until_preseason':
        if g.phase == c.PHASE_FREE_AGENCY:
            season.new_phase(c.PHASE_PRESEASON)
    elif amount == 'until_regular_season':
        if g.phase == c.PHASE_PRESEASON:
            error = season.new_phase(c.PHASE_REGULAR_SEASON)

    return jsonify(url=url, error=error, num_days=num_days, schedule=schedule, teams=teams, playoffs_continue=playoffs_continue)


@app.route('/<int:league_id>/save_results', methods=['POST'])
@league_crap_ajax
def save_results():
    """Record a day's game simulations."""
    results = json.loads(request.form['results'])
    for result in results:
        game.save_results(result, g.phase == c.PHASE_PLAYOFFS)
    return 'fuck'


@app.route('/<int:league_id>/schedule')
@league_crap
def schedule():
    schedule_ = season.get_schedule()
    games = []

    for game in schedule_:
        tids = [game['home_tid'], game['away_tid']]
        if g.user_tid in tids:
            games.append([])
            for tid in tids:
                r = g.dbex('SELECT tid, abbrev, region, name FROM team_attributes WHERE tid = :tid', tid=tid)
                row = r.fetchone()
                games[-1].append(row)

    return render_all_or_json('schedule.html', {'games': games})


@app.route('/<int:league_id>/standings')
@app.route('/<int:league_id>/standings/<int:view_season>')
@league_crap
def standings(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    conferences = []
    r = g.dbex('SELECT cid, name FROM conferences ORDER BY cid ASC')
    for cid, conference_name in r.fetchall():
        conferences.append({'id': cid, 'name': conference_name, 'divisions': [], 'standings': ''})

        r = g.dbex('SELECT ld.did FROM divisions as ld WHERE ld.cid = :cid', cid=cid)
        divisions = ', '.join([str(division) for division, in r.fetchall()])
        r = g.dbex('SELECT * FROM team_attributes as ta WHERE ta.did IN (%s) AND season = :season ORDER BY won/(won+lost) DESC' % (divisions,), season=view_season)
        conferences[-1]['teams'] = r.fetchall()

        r = g.dbex('SELECT did, name FROM divisions WHERE cid = :cid ORDER BY name ASC', cid=cid)
        for did, division_name in r.fetchall():
            r = g.dbex('SELECT * FROM team_attributes WHERE did = :did AND season = :season ORDER BY won/(won+lost) DESC', did=did, season=view_season)
            conferences[-1]['divisions'].append({'name': division_name})
            conferences[-1]['divisions'][-1]['teams'] = r.fetchall()

    return render_all_or_json('standings.html', {'conferences': conferences, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/playoffs')
@app.route('/<int:league_id>/playoffs/<int:view_season>')
@league_crap
def playoffs(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    series = [[], [], [], []]  # First round, second round, third round, fourth round

    # In the current season, before playoffs start, display projected matchups
    if view_season == g.season and g.phase < c.PHASE_PLAYOFFS:
        for cid in range(2):
            teams = []
            r = g.dbex('SELECT ta.name FROM team_attributes as ta, divisions as ld WHERE ld.did = ta.did AND ld.cid = :cid AND ta.season = :season ORDER BY 1.0*ta.won/(ta.won + ta.lost) DESC LIMIT 8', cid=cid, season=g.season)
            for team_name, in r.fetchall():
                teams.append(team_name)
            series[0].append({'seed_home': 1, 'seed_away': 8, 'name_home': teams[0], 'name_away': teams[7]})
            series[0].append({'seed_home': 2, 'seed_away': 7, 'name_home': teams[1], 'name_away': teams[6]})
            series[0].append({'seed_home': 3, 'seed_away': 6, 'name_home': teams[2], 'name_away': teams[5]})
            series[0].append({'seed_home': 4, 'seed_away': 5, 'name_home': teams[3], 'name_away': teams[4]})

    # Display the current or archived playoffs
    else:
        r = g.dbex('SELECT sid, series_round, (SELECT name FROM team_attributes WHERE tid = aps.tid_home AND season = :season) as name_home, (SELECT name FROM team_attributes WHERE tid = aps.tid_away AND season = :season) as name_away, seed_home, seed_away, won_home, won_away FROM playoff_series as aps WHERE season = :season ORDER BY series_round, sid ASC', season=view_season)
        for s in r.fetchall():
            series[s['series_round'] - 1].append(s)

    return render_all_or_json('playoffs.html', {'series': series, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/finances')
@league_crap
def finances():
    r = g.dbex('SELECT ta.tid, ta.region, ta.name, ta.abbrev, AVG(ts.att) AS att, SUM(ts.att)*:ticket_price / 1000000 AS revenue, (SUM(ts.att)*:ticket_price - SUM(ts.cost)) / 1000000 AS profit, ta.cash / 1000000 as cash, ((SELECT SUM(contract_amount) FROM player_attributes as pa WHERE pa.tid = ta.tid) + (SELECT IFNULL(SUM(contract_amount),0) FROM released_players_salaries as rps WHERE rps.tid = ta.tid)) / 1000 AS payroll FROM team_attributes as ta LEFT OUTER JOIN team_stats as ts ON ta.season = ts.season AND ta.tid = ts.tid WHERE ta.season = :season GROUP BY ta.tid', ticket_price=g.ticket_price, season=g.season)

    teams = r.fetchall()

    return render_all_or_json('finances.html', {'salary_cap': g.salary_cap / 1000, 'teams': teams})


@app.route('/<int:league_id>/free_agents')
@league_crap
def free_agents():
    if g.phase >= c.PHASE_AFTER_TRADE_DEADLINE and g.phase <= c.PHASE_RESIGN_PLAYERS:
        error = "You're not allowed to sign free agents now."
        return render_all_or_json('league_error.html', {'error': error})

    r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year as age, pr.overall, pr.potential, AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as rebounds, AVG(ps.ast) as ast, pa.contract_amount/1000.0*(1+pa.free_agent_times_asked/10) as contract_amount, pa.contract_expiration FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = 0 AND pa.pid = ps.pid WHERE pa.tid = :tid GROUP BY pa.pid', season=g.season, tid=c.PLAYER_FREE_AGENT)

    players = r.fetchall()

    return render_all_or_json('free_agents.html', {'players': players})


@app.route('/<int:league_id>/trade', methods=['GET', 'POST'])
@league_crap
def trade_():
    if g.phase >= c.PHASE_AFTER_TRADE_DEADLINE and g.phase <= c.PHASE_PLAYOFFS:
        error = "You're not allowed to make trades now."
        return render_all_or_json('league_error.html', {'error': error})

    extra_json = {}

    pid = request.form.get('pid', None, type=int)
    abbrev = request.form.get('abbrev', None)
    if abbrev is not None:
        new_tid_other, abbrev = validate_abbrev(abbrev)
    else:
        new_tid_other = None

    # Clear trade
    if request.method == 'POST' and 'clear' in request.form:
        trade.clear()
        pids_user, pids_other = trade.get_players()
    # Propose trade
    elif request.method == 'POST' and 'propose' in request.form:
        # Validate that player IDs correspond with team IDs
        pids_user, pids_other = trade.get_players()
        pids_user, pids_other = trade.update_players(pids_user, pids_other)

        r = g.dbex('SELECT tid FROM trade')
        tid_other, = r.fetchone()

        accepted, message = trade.propose(tid_other, pids_user, pids_other)
        extra_json = {'message': message}
        pids_user, pids_other = trade.get_players()
    else:
        # Start new trade with team or for player
        if request.method == 'POST' and (new_tid_other is not None or pid is not None):
            trade.new(tid=new_tid_other, pid=pid)

        # Validate that player IDs correspond with team IDs
        pids_user, pids_other = trade.get_players()
        pids_user, pids_other = trade.update_players(pids_user, pids_other)

    r = g.dbex('SELECT tid FROM trade')
    tid_other, = r.fetchone()

    # Load info needed to display trade
    r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year AS age, pr.overall, pr.potential, pa.contract_amount / 1000 AS contract_amount, pa.contract_expiration, AVG(ps.min) AS min, AVG(ps.pts) AS pts, AVG(ps.orb + ps.drb) AS reb, AVG(ps.ast) AS ast FROM player_attributes AS pa LEFT OUTER JOIN player_ratings AS pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats AS ps ON ps.season = :season AND ps.playoffs = 0 AND pa.pid = ps.pid WHERE pa.tid = :tid GROUP BY pa.pid ORDER BY pa.roster_pos ASC', season=g.season, tid=g.user_tid)
    roster_user = r.fetchall()

    r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year AS age, pr.overall, pr.potential, pa.contract_amount / 1000 AS contract_amount, pa.contract_expiration, AVG(ps.min) AS min, AVG(ps.pts) AS pts, AVG(ps.orb + ps.drb) AS reb, AVG(ps.ast) AS ast FROM player_attributes AS pa LEFT OUTER JOIN player_ratings AS pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats AS ps ON ps.season = :season AND ps.playoffs = 0 AND pa.pid = ps.pid WHERE pa.tid = :tid GROUP BY pa.pid ORDER BY pa.roster_pos ASC', season=g.season, tid=tid_other)
    roster_other = r.fetchall()

    summary = trade.summary(tid_other, pids_user, pids_other)

    r = g.dbex('SELECT tid, abbrev, region, name FROM team_attributes WHERE season = :season AND tid != :tid ORDER BY tid ASC', season=g.season, tid=g.user_tid)
    teams = r.fetchall()

    return render_all_or_json('trade.html', {'roster_user': roster_user, 'roster_other': roster_other, 'pids_user': pids_user, 'pids_other': pids_other, 'summary': summary, 'teams': teams, 'tid_other': tid_other}, extra_json)


@app.route('/<int:league_id>/draft')
@app.route('/<int:league_id>/draft/<int:view_season>')
@league_crap
def draft_(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    # Draft hasn't happened yet this year
    if g.phase < c.PHASE_DRAFT:
        # View last season by default
        if view_season == g.season:
            view_season -= 1
        seasons.remove(g.season)  # Don't show this season as an option

    if g.phase < c.PHASE_DRAFT and view_season < g.starting_season:
        error = "There is no draft history yet. Check back after the season."
        return render_all_or_json('league_error.html', {'error': error})

    # Active draft
    if g.phase == c.PHASE_DRAFT and view_season == g.season:
        r = g.dbex('SELECT pa.pid, pa.pos, pa.name, :season - pa.born_year as age, pr.overall, pr.potential FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pa.tid = :tid AND pr.season = :season ORDER BY pr.overall + 2*pr.potential DESC', season=g.season, tid=c.PLAYER_UNDRAFTED)
        undrafted = r.fetchall()

        r = g.dbex('SELECT draft_round, pick, abbrev, pid, name, :season - born_year as age, pos, overall, potential FROM draft_results WHERE season = :season ORDER BY draft_round, pick ASC', season=g.season)
        drafted = r.fetchall()

        return render_all_or_json('draft.html', {'undrafted': undrafted, 'drafted': drafted})

    # Show a summary of an old draft
    r = g.dbex('SELECT dr.draft_round, dr.pick, dr.abbrev, dr.pid, dr.name, :view_season - dr.born_year AS age, dr.pos, dr.overall, dr.potential, ta.abbrev AS current_abbrev, :season - dr.born_year AS current_age, pr.overall AS current_overall, pr.potential AS current_potential, SUM(ps.min>0) AS gp, AVG(ps.min) as mpg, AVG(ps.pts) AS ppg, AVG(ps.orb + ps.drb) AS rpg, AVG(ps.ast) AS apg FROM draft_results AS dr LEFT OUTER JOIN player_ratings AS pr ON pr.season = :season AND dr.pid = pr.pid LEFT OUTER JOIN player_stats AS ps ON ps.playoffs = 0 AND dr.pid = ps.pid LEFT OUTER JOIN player_attributes AS pa ON dr.pid = pa.pid LEFT OUTER JOIN team_attributes AS ta ON pa.tid = ta.tid AND ta.season = :season WHERE dr.season = :view_season GROUP BY dr.pid', view_season=view_season, season=g.season)
    players = r.fetchall()
    return render_all_or_json('draft_summary.html', {'players': players, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/history')
@app.route('/<int:league_id>/history/<int:view_season>')
@league_crap
def history(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    # If this season isn't over...
    if g.phase < c.PHASE_PLAYOFFS:
        # View last season by default
        if view_season == g.season:
            view_season -= 1
        seasons.remove(g.season)  # Don't show this season as an option

    r = g.dbex('SELECT bre_tid, bre_abbrev, bre_region, bre_name, bre_won, bre_lost, brw_tid, brw_abbrev, brw_region, brw_name, brw_won, brw_lost, mvp_pid, mvp_name, mvp_tid, mvp_abbrev, mvp_ppg, mvp_rpg, mvp_apg, dpoy_pid, dpoy_name, dpoy_tid, dpoy_abbrev, dpoy_rpg, dpoy_bpg, dpoy_spg, smoy_pid, smoy_name, smoy_tid, smoy_abbrev, smoy_ppg, smoy_rpg, smoy_apg, roy_pid, roy_name, roy_tid, roy_abbrev, roy_ppg, roy_rpg, roy_apg FROM awards WHERE season = :season', season=view_season)
    if r.rowcount == 0:
        error = "You have to play through a season before there is any league history to view."
        return render_all_or_json('league_error.html', {'error': error})
    awards = r.fetchone()

    r = g.dbex('SELECT pid, name, abbrev, ppg, rpg, apg, bpg, spg FROM awards_all_league WHERE season = :season AND team_type = \'league\' ORDER BY player_rank', season=view_season)
    all_league = r.fetchall()

    r = g.dbex('SELECT pid, name, abbrev, ppg, rpg, apg, bpg, spg FROM awards_all_league WHERE season = :season AND team_type = \'defensive\' ORDER BY player_rank', season=view_season)
    all_defensive = r.fetchall()

    r = g.dbex('SELECT abbrev, region, name FROM team_attributes WHERE won_championship = 1 AND season = :season', season=view_season)
    champ = r.fetchone()

    return render_all_or_json('history.html', {'awards': awards, 'all_league': all_league, 'all_defensive': all_defensive, 'champ': champ, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/roster')
@app.route('/<int:league_id>/roster/<abbrev>')
@app.route('/<int:league_id>/roster/<abbrev>/<int:view_season>')
@league_crap
def roster(abbrev=None, view_season=None):
    tid, abbrev = validate_abbrev(abbrev)
    view_season = validate_season(view_season)
    seasons = get_seasons()

    if view_season == g.season:
        # Show players even if they don't have any stats
        if tid == g.user_tid:
            r = g.dbex('SELECT COUNT(*) FROM team_stats WHERE tid = :tid AND season = :season AND playoffs = 0', tid=g.user_tid, season=g.season)
            n_games_remaining, = r.fetchone()
        else:
            n_games_remaining = 0  # Dummy value because only players on the user's team can be bought out
        r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year as age, pr.overall, pr.potential, pa.contract_amount / 1000 as contract_amount, pa.contract_expiration, AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as rebounds, AVG(ps.ast) as ast, ((1 + pa.contract_expiration - :season) * pa.contract_amount - :n_games_remaining / 82 * pa.contract_amount) / 1000 AS cash_owed FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = 0 AND pa.pid = ps.pid WHERE pa.tid = :tid GROUP BY pa.pid ORDER BY pa.roster_pos ASC', season=view_season, n_games_remaining=n_games_remaining, tid=tid)
    else:
        # Only show players with stats, as that's where the team history is recorded
        r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year as age, pr.overall, pr.potential, pa.contract_amount / 1000 as contract_amount,  pa.contract_expiration, AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as rebounds, AVG(ps.ast) as ast FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = 0 AND pa.pid = ps.pid WHERE ps.tid = :tid GROUP BY pa.pid ORDER BY pa.roster_pos ASC', season=view_season, tid=tid)
    players = r.fetchall()

    r = g.dbex('SELECT tid, abbrev, region, name FROM team_attributes WHERE season = :season ORDER BY tid ASC', season=view_season)
    teams = r.fetchall()

    r = g.dbex('SELECT CONCAT(region, " ", name), cash / 1000000 FROM team_attributes WHERE tid = :tid AND season = :season', tid=tid, season=view_season)
    team_name, cash = r.fetchone()

    return render_all_or_json('roster.html', {'players': players, 'num_roster_spots': 15 - len(players), 'teams': teams, 'tid': tid, 'team_name': team_name, 'cash': cash, 'view_season': view_season, 'seasons': seasons})


@app.route('/<int:league_id>/roster/auto_sort', methods=['POST'])
@league_crap
def auto_sort_roster():
    roster_auto_sort(g.user_tid)

    return redirect_or_json('roster')


@app.route('/<int:league_id>/game_log')
@app.route('/<int:league_id>/game_log/<int:view_season>')
@app.route('/<int:league_id>/game_log/<int:view_season>/<abbrev>')
@league_crap
def game_log(view_season=None, abbrev=None):
    view_season = validate_season(view_season)
    tid, abbrev = validate_abbrev(abbrev)

    r = g.dbex('SELECT tid, abbrev, region, name FROM team_attributes WHERE season = :season ORDER BY tid ASC', season=view_season)
    teams = r.fetchall()

    seasons = []
    r = g.dbex('SELECT season FROM team_attributes GROUP BY season ORDER BY season DESC')
    for season, in r.fetchall():
        seasons.append(season)

    return render_all_or_json('game_log.html', {'abbrev': abbrev, 'teams': teams, 'tid': tid, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/player/<int:pid>')
@league_crap
def player_(pid):
    # Info
    r = g.dbex('SELECT name, pos, (SELECT CONCAT(region, " ", name) FROM team_attributes AS ta WHERE pa.tid = ta.tid AND ta.season = :season) as team, height, weight, :season - born_year as age, born_year, born_location, college, draft_year, draft_round, draft_pick, (SELECT CONCAT(region, " ", name) FROM team_attributes as ta WHERE ta.tid = pa.draft_tid AND ta.season = :season) AS draft_team, contract_amount / 1000 AS contract_amount, contract_expiration FROM player_attributes AS pa WHERE pid = :pid', season=g.season, pid=pid)
    info = r.fetchone()

    # Current ratings
    r = g.dbex('SELECT overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blk, stl, dribbling, passing, rebounding, potential FROM player_ratings WHERE season = :season AND pid = :pid', season=g.season, pid=pid)
    ratings = r.fetchone()

    # Season stats and ratings
    r = g.dbex('SELECT ps.season, ta.abbrev, SUM(ps.min>0) AS games_played, SUM(ps.gs) AS games_started, AVG(ps.min) AS min, AVG(ps.fg) AS fg, AVG(ps.fga) AS fga, 100*AVG(ps.fg/ps.fga) AS field_goal_percentage, AVG(ps.tp) AS tp, AVG(ps.tpa) AS tpa, 100*AVG(ps.tp/ps.tpa) AS three_point_percentage, AVG(ps.ft) AS ft, AVG(ps.fta) AS fta, 100*AVG(ps.ft/ps.fta) AS free_throw_percentage, AVG(ps.orb) AS orb, AVG(ps.drb) AS drb, AVG(ps.orb+ps.drb) AS rebounds, AVG(ps.ast) AS ast, AVG(ps.tov) AS tov, AVG(ps.stl) AS stl, AVG(ps.blk) AS blk, AVG(ps.pf) AS pf, AVG(ps.pts) AS pts, ps.season - pa.born_year AS age, pr.overall, pr.potential, pr.height, pr.strength, pr.speed, pr.jumping, pr.endurance, pr.shooting_inside, pr.shooting_layups, pr.shooting_free_throws, pr.shooting_two_pointers, pr.shooting_three_pointers, pr.blk AS rating_blk, pr.stl AS rating_stl, pr.dribbling, pr.passing, pr.rebounding FROM player_attributes AS pa LEFT JOIN player_stats as ps ON pa.pid = ps.pid LEFT JOIN player_ratings AS pr ON pr.pid = pa.pid AND pr.season = ps.season LEFT OUTER JOIN team_attributes AS ta ON ps.tid = ta.tid AND ta.season = ps.season AND ta.season = pr.season WHERE pa.pid = :pid AND ps.playoffs = 0 GROUP BY ps.season ORDER BY ps.season ASC', pid=pid)
    seasons = r.fetchall()

    return render_all_or_json('player.html', {'info': info, 'ratings': ratings, 'seasons': seasons})


@app.route('/<int:league_id>/negotiation')
@league_crap
def negotiation_list(pid=None):
    # If there is only one active negotiation with a free agent, go to it
    r = g.dbex('SELECT pid FROM negotiation WHERE resigning = 0')
    if r.rowcount == 1:
        pid, = r.fetchone()
        return redirect_or_json('negotiation', {'pid': pid})

    if g.phase != c.PHASE_RESIGN_PLAYERS:
        error = "Something bad happened."
        return render_all_or_json('league_error.html', {'error': error})

    r = g.dbex('SELECT pa.pid, pa.name, pa.pos, :season - pa.born_year as age, pr.overall, pr.potential, AVG(ps.min) as min, AVG(ps.pts) as pts, AVG(ps.orb + ps.drb) as rebounds, AVG(ps.ast) as ast, pa.contract_amount/1000.0*(1+pa.free_agent_times_asked/10) as contract_amount, pa.contract_expiration FROM player_attributes as pa LEFT OUTER JOIN negotiation as n ON pa.pid = n.pid LEFT OUTER JOIN player_ratings as pr ON pr.season = :season AND pa.pid = pr.pid LEFT OUTER JOIN player_stats as ps ON ps.season = :season AND ps.playoffs = 0 AND pa.pid = ps.pid WHERE pa.tid = :tid AND n.resigning = 1 GROUP BY pa.pid', season=g.season, tid=c.PLAYER_FREE_AGENT)

    players = r.fetchall()

    return render_all_or_json('negotiation_list.html', {'players': players})


@app.route('/<int:league_id>/negotiation/<int:pid>', methods=['GET', 'POST'])
@league_crap
def negotiation(pid):
    # Any action requires a POST. GET will just view the status of the
    # negotiation, if it exists
    if request.method == 'POST':
        if 'cancel' in request.form:
            contract_negotiation.cancel(pid)
            return redirect_or_json('league_dashboard')
        elif 'accept' in request.form:
            error = contract_negotiation.accept(pid)
            if error:
                return render_all_or_json('league_error.html', {'error': error})
            return redirect_or_json('roster')
        elif 'new' in request.form:
            # If there is no active negotiation with this pid, create it
            r = g.dbex('SELECT 1 FROM negotiation WHERE pid = :pid', pid=pid)
            if not r.rowcount:
                error = contract_negotiation.new(pid)
                if error:
                    return render_all_or_json('league_error.html', {'error': error})
        else:
            # Make an offer to the player
            team_amount_new = int(float(request.form['team_amount']) * 1000)
            team_years_new = int(request.form['team_years'])
            contract_negotiation.offer(pid, team_amount_new, team_years_new)

    r = g.dbex('SELECT team_amount, team_years, player_amount, player_years, resigning FROM negotiation WHERE pid = :pid', pid=pid)
    if r.rowcount == 0:
        return render_all_or_json('league_error.html', {'error': 'No negotiation with player %d in progress.' % (pid,)})
    team_amount, team_years, player_amount, player_years, resigning = r.fetchone()

    player_amount /= 1000.0
    team_amount /= 1000.0
    player_expiration = player_years + g.season
    # Adjust to account for in-season signings
    if g.phase <= c.PHASE_AFTER_TRADE_DEADLINE:
        player_expiration -= 1

    r = g.dbex('SELECT pa.pid, pa.name, pr.overall, pr.potential FROM player_attributes as pa, player_ratings as pr WHERE pa.pid = pr.pid AND pa.pid = :pid AND pr.season = :season', pid=pid, season=g.season)
    player = r.fetchone()

    salary_cap = g.salary_cap / 1000.0
    r = g.dbex('SELECT CONCAT(region, " ", name) FROM team_attributes WHERE tid = :tid AND season = :season', tid=g.user_tid, season=g.season)
    team_name, = r.fetchone()

    payroll = get_payroll(g.user_tid)
    payroll /= 1000.0

    return render_all_or_json('negotiation.html', {'team_amount': team_amount, 'team_years': team_years, 'player_amount': player_amount, 'player_years': player_years, 'player_expiration': player_expiration, 'resigning': resigning, 'player': player, 'salary_cap': salary_cap, 'team_name': team_name, 'payroll': payroll})


# Utility views

@app.route('/<int:league_id>/box_score')
@app.route('/<int:league_id>/box_score/<int:gid>')
@league_crap_ajax
def box_score(gid=0):
    teams = []
    r = g.dbex('SELECT * FROM team_stats WHERE gid = :gid', gid=gid)
    for row in r.fetchall():
        teams.append(dict(row))

        r = g.dbex('SELECT region, name, abbrev FROM team_attributes WHERE tid = :tid', tid=teams[-1]['tid'])
        teams[-1]['region'], teams[-1]['name'], teams[-1]['abbrev'] = r.fetchone()

        r = g.dbex('SELECT pa.pid, name, pos, min, fg, fga, tp, tpa, ft, fta, orb, drb, orb + drb AS rebounds, ast, tov, stl, blk, pf, pts FROM player_attributes as pa, player_stats as ps WHERE pa.pid = ps.pid AND ps.gid = :gid AND pa.tid = :tid ORDER BY gs DESC, min DESC', gid=gid, tid=teams[-1]['tid'])
        teams[-1]['players'] = r.fetchall()

        # Total rebounds
        teams[-1]['rebounds'] = teams[-1]['orb'] + teams[-1]['drb']

    # Who won?
    if teams[0]['pts'] > teams[1]['pts']:
        won_lost = {'won_pts': teams[0]['pts'], 'won_region': teams[0]['region'], 'won_name': teams[0]['name'], 'won_abbrev': teams[0]['abbrev'], 'lost_pts': teams[1]['pts'], 'lost_region': teams[1]['region'], 'lost_name': teams[1]['name'], 'lost_abbrev': teams[1]['abbrev']}
    else:
        won_lost = {'won_pts': teams[1]['pts'], 'won_region': teams[1]['region'], 'won_name': teams[1]['name'], 'won_abbrev': teams[1]['abbrev'], 'lost_pts': teams[0]['pts'], 'lost_region': teams[0]['region'], 'lost_name': teams[0]['name'], 'lost_abbrev': teams[0]['abbrev']}

    return render_template('box_score.html', teams=teams, view_season=teams[0]['season'], **won_lost)


@app.route('/<int:league_id>/game_log_list')
@league_crap_ajax
def game_log_list():
    season = request.args.get('season', None, type=int)
    abbrev = request.args.get('abbrev', None, type=str)

    season = validate_season(season)
    tid, abbrev = validate_abbrev(abbrev)

    r = g.dbex('SELECT gid, home, (SELECT abbrev FROM team_attributes WHERE tid = opp_tid AND season = :season) as opponent_abbrev, won, pts, opp_pts FROM team_stats WHERE tid = :tid AND season = :season', season=season, tid=tid)
    games = r.fetchall()

    return render_template('game_log_list.html', games=games)


@app.route('/<int:league_id>/push_play_menu')
@league_crap_ajax
def push_play_menu():
    """This should only be called on initial page load. Further updates are
    done through bbgm.core.play_menu.set_status and
    bbgm.core.play_menu.refresh_options, which push updates to the client.
    """
    play_menu.set_status()
    play_menu.set_phase()
    play_menu.refresh_options()

    return 'fuck'


@app.route('/<int:league_id>/trade/update', methods=['POST'])
@league_crap_ajax
def trade_update():
    pids_user = map(int, request.form.getlist('pids_user'))
    pids_other = map(int, request.form.getlist('pids_other'))
    pids_user, pids_other = trade.update_players(pids_user, pids_other)

    r = g.dbex('SELECT tid FROM trade')
    tid_other, = r.fetchone()
    summary = trade.summary(tid_other, pids_user, pids_other)
    trade_summary = render_template('trade_summary.html', summary=summary)
    return jsonify(summary=trade_summary, pids_user=pids_user, pids_other=pids_other)


@app.route('/<int:league_id>/draft/until_user_or_end', methods=['POST'])
@league_crap_ajax
def draft_until_user_or_end():
    play_menu.set_status('Draft in progress...')
    pids = draft.until_user_or_end()

    done = False
    if g.phase == c.PHASE_AFTER_DRAFT:
        done = True
        play_menu.set_status('Idle')

    return jsonify(pids=pids, done=done)


@app.route('/<int:league_id>/draft/user', methods=['POST'])
@league_crap_ajax
def draft_user():
    pid = int(request.form['pid'])
    pid = draft.pick_player(g.user_tid, pid)

    return jsonify(pids=[pid])


@app.route('/<int:league_id>/roster/reorder', methods=['POST'])
@league_crap_ajax
def roster_reorder():
    roster_pos = 1
    for pid in request.form.getlist('roster[]'):
        pid = int(pid)
        r = g.dbex('SELECT tid FROM player_attributes WHERE pid = :pid', pid=pid)
        tid, = r.fetchone()
        if tid == g.user_tid:  # Don't let the user update CPU-controlled rosters
            g.dbex('UPDATE player_attributes SET roster_pos = :roster_pos WHERE pid = :pid', roster_pos=roster_pos, pid=pid)
            roster_pos += 1

    return 'fuck'


@app.route('/<int:league_id>/roster/release', methods=['POST'])
@league_crap_ajax
def roster_release():
    error = None

    r = g.dbex('SELECT COUNT(*) FROM player_attributes WHERE tid = :tid', tid=g.user_tid)
    num_players_on_roster, = r.fetchone()
    if num_players_on_roster <= 5:
        error = 'You must keep at least 5 players on your roster.'
    else:
        pid = int(request.form['pid'])
        r = g.dbex('SELECT tid FROM player_attributes WHERE pid = :pid', pid=pid)
        tid, = r.fetchone()
        if tid == g.user_tid:  # Don't let the user update CPU-controlled rosters
            p = player.Player()
            p.load(pid)
            p.release()
        else:
            error = 'You aren\'t allowed to do this.'

    return jsonify(error=error)


@app.route('/<int:league_id>/roster/buy_out', methods=['POST'])
@league_crap_ajax
def roster_buy_out():
    error = None

    r = g.dbex('SELECT COUNT(*) FROM player_attributes WHERE tid = :tid', tid=g.user_tid)
    num_players_on_roster, = r.fetchone()
    if num_players_on_roster <= 5:
        error = 'You must keep at least 5 players on your roster.'
    else:
        pid = int(request.form['pid'])
        r = g.dbex('SELECT tid FROM player_attributes WHERE pid = :pid', pid=pid)
        tid, = r.fetchone()
        if tid == g.user_tid:  # Don't let the user update CPU-controlled rosters
            r = g.dbex('SELECT cash / 1000000 FROM team_attributes WHERE tid = :tid AND season = :season', tid=g.user_tid, season=g.season)
            cash, = r.fetchone()
            r = g.dbex('SELECT COUNT(*) FROM team_stats WHERE tid = :tid AND season = :season AND playoffs = 0', tid=g.user_tid, season=g.season)
            n_games_remaining, = r.fetchone()
            r = g.dbex('SELECT ((1 + pa.contract_expiration - :season) * pa.contract_amount - :n_games_remaining / 82 * pa.contract_amount) / 1000 FROM player_attributes AS pa WHERE pid = :pid', season=g.season, n_games_remaining=n_games_remaining, pid=pid)
            cash_owed, = r.fetchone()
            if cash_owed < cash:
                # Pay the cash
                g.dbex('UPDATE team_attributes SET cash = cash - :cash_owed WHERE tid = :tid AND season = :season', cash_owed=cash_owed * 1000000, tid=g.user_tid, season=g.season)
                # Set to FA in database
                p = player.Player()
                p.load(pid)
                p.add_to_free_agents()
            else:
                error = 'Not enough cash.'
        else:
            error = 'You aren\'t allowed to do this.'

    return jsonify(error=error)


def validate_abbrev(abbrev):
    """Validate that the given abbreviation corresponds to a valid team.

    If an invalid abbreviation is passed, the user's team will be used.

    Args:
        abbrev: Three-letter all-caps string containing a team's
            abbreviation.
    Returns:
        A two element list of the validated team ID and abbreviation.
    """
    tid = None

    # Try to use the supplied abbrev
    if abbrev:
        r = g.dbex('SELECT tid FROM team_attributes WHERE season = :season AND abbrev = :abbrev', season=g.season, abbrev=abbrev)
        if r.rowcount == 1:
            tid, = r.fetchone()

    # If no valid abbrev was given, default to the user's team
    if not tid:
        tid = g.user_tid
        r = g.dbex('SELECT abbrev FROM team_attributes WHERE season = :season AND tid = :tid', season=g.season, tid=tid)
        abbrev, = r.fetchone()

    return tid, abbrev


def validate_season(season):
    """Validate that the given season is valid.

    A valid season is the current season or one of the past seasons. If an
    invalid season is passed, the current will be used.

    Args:
        season: An integer containing the year of the season.
    Returns:
        An integer containing the argument, if valid, or the year of the current
        season.
    """
    if not season:
        season = g.season
    else:
        # Make sure there is an entry for the supplied season in the DB somewhere
        pass

    return season


def render_all_or_json(template_file, template_args={}, extra_json={}):
    """Return rendered template, or JSON containing rendered blk.
    
    Anything passed to extra_json will be sent to the client along with the
    template blk.
    """
    if request.args.get('json', 0, type=int) or request.form.get('json', 0, type=int):
        ctx = _request_ctx_stack.top  # Not sure what this does
        ctx.app.update_template_context(template_args)  # Not sure what this does
        template = ctx.app.jinja_env.get_template(template_file)
        context = template.new_context(template_args)
        d = {}
        for key, blockfun in template.blocks.iteritems():
            d[key] = concat(blockfun(context))
        if len(extra_json) > 0:
            d = dict(d.items() + extra_json.items())
        return jsonify(d)
    else:
        return render_template(template_file, **template_args)


def redirect_or_json(f, args={}):
    """Redirect to function's URL, or return a JSON response containing rendered
    blk from a function's template.

    This kind of sucks because it currently doesn't pass the URL, so there's no
    way to update it with pushState on the client side.
    """
    if request.args.get('json', 0, type=int) or request.form.get('json', 0, type=int):
        return globals()[f](**args)
    else:
        args['league_id'] = g.league_id
        return redirect(url_for(f, **args))
