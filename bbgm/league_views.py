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

    cols = ['ps.points', 'ps.offensive_rebounds+ps.defensive_rebounds',
            'ps.assists', '100*ps.field_goals_made/ps.field_goals_attempted',
            'ps.blocks', 'ps.steals']
    for i in xrange(len(cols)):
        # I have to insert the cateogry using string formatting because
        # otherwise it mangles the syntax. But it's okay, cols is defined just a
        # few lines up. Nothing malicious there.
        g.dbd.execute('SELECT pa.player_id, pa.name, ta.abbreviation, AVG(%s) as stat FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ps.season = %s AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.player_id ORDER BY AVG(%s) DESC LIMIT 10' % (cols[i], '%s', cols[i]), (view_season,))
        categories[i]['data'] = g.dbd.fetchall()

    g.db.execute('SELECT abbreviation FROM team_attributes WHERE team_id = %s AND season = %s', (g.user_team_id, view_season))
    user_abbreviation, = g.db.fetchone()

    return render_all_or_json('leaders.html', {'categories': categories, 'user_abbreviation': user_abbreviation, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/player_ratings')
@app.route('/<int:league_id>/player_ratings/<int:view_season>')
@league_crap
def player_ratings(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    g.dbd.execute('SELECT pa.player_id, pa.team_id, pa.name, (SELECT abbreviation FROM team_attributes WHERE team_id = pa.team_id AND season = %s) as abbreviation, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pr.height, pr.strength, pr.speed, pr.jumping, pr.endurance, pr.shooting_inside, pr.shooting_layups, pr.shooting_free_throws, pr.shooting_two_pointers, pr.shooting_three_pointers, pr.blocks, pr.steals, pr.dribbling, pr.passing, pr.rebounding FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pr.season = %s', (view_season, view_season, view_season))
    players = g.dbd.fetchall()

    return render_all_or_json('player_ratings.html', {'players': players, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/player_stats')
@app.route('/<int:league_id>/player_stats/<int:view_season>')
@league_crap
def player_stats(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    g.dbd.execute('SELECT pa.player_id, pa.team_id, pa.name, ta.abbreviation, pa.position, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS minutes, AVG(ps.field_goals_made) AS field_goals_made, AVG(ps.field_goals_attempted) AS field_goals_attempted, 100*AVG(ps.field_goals_made/ps.field_goals_attempted) AS field_goal_percentage, AVG(ps.three_pointers_made) AS three_pointers_made, AVG(ps.three_pointers_attempted) AS three_pointers_attempted, 100*AVG(ps.three_pointers_made/ps.three_pointers_attempted) AS three_point_percentage, AVG(ps.free_throws_made) AS free_throws_made, AVG(ps.free_throws_attempted) AS free_throws_attempted, 100*AVG(ps.free_throws_made/ps.free_throws_attempted) AS free_throw_percentage, AVG(ps.offensive_rebounds) AS offensive_rebounds, AVG(ps.defensive_rebounds) AS defensive_rebounds, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rebounds, AVG(ps.assists) AS assists, AVG(ps.turnovers) AS turnovers, AVG(ps.steals) AS steals, AVG(ps.blocks) AS blocks, AVG(ps.personal_fouls) AS personal_fouls, AVG(ps.points) AS points FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ps.season = %s AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.player_id', (view_season,))
    players = g.dbd.fetchall()

    # Don't pass blank values where floats are expected by the template
    for i in xrange(len(players)):
        for key in players[i].keys():
            if not players[i][key]:
                players[i][key] = 0

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
            g.db.execute('SELECT COUNT(*)/%s FROM team_stats WHERE season = %s', (g.num_teams, g.season))
            row = g.db.fetchone()
            num_days = int(g.season_length - row[0])  # Number of days remaining
        elif amount == 'through_playoffs':
            num_days = 100  # There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end

        teams, schedule, playoffs_continue, url = game.play(num_days, start)
    elif amount == 'stop':
        g.db.execute('UPDATE game_attributes SET stop_games = 1 WHERE season = %s', (g.season,))
        g.db.execute('UPDATE schedule SET in_progress_timestamp = 0')

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
        team_ids = [game['home_team_id'], game['away_team_id']]
        if g.user_team_id in team_ids:
            games.append([])
            for team_id in team_ids:
                g.dbd.execute('SELECT team_id, abbreviation, region, name FROM team_attributes WHERE team_id = %s', (team_id))
                row = g.dbd.fetchone()
                games[-1].append(row)

    return render_all_or_json('schedule.html', {'games': games})


@app.route('/<int:league_id>/standings')
@app.route('/<int:league_id>/standings/<int:view_season>')
@league_crap
def standings(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    conferences = []
    g.db.execute('SELECT conference_id, name FROM league_conferences ORDER BY conference_id ASC')
    for conference_id, conference_name in g.db.fetchall():
        conferences.append({'id': conference_id, 'name': conference_name, 'divisions': [], 'standings': ''})

        g.db.execute('SELECT ld.division_id FROM league_divisions as ld WHERE ld.conference_id = %s', (conference_id,))
        divisions = ', '.join([str(division) for division, in g.db.fetchall()])
        g.dbd.execute('SELECT * FROM team_attributes as ta WHERE ta.division_id IN (%s) AND season = %s ORDER BY won/(won+lost) DESC', (divisions, view_season))
        conferences[-1]['teams'] = g.dbd.fetchall()

        g.db.execute('SELECT division_id, name FROM league_divisions WHERE conference_id = %s ORDER BY name ASC', (conference_id,))
        for division_id, division_name in g.db.fetchall():
            g.dbd.execute('SELECT * FROM team_attributes WHERE division_id = %s AND season = %s ORDER BY won/(won+lost) DESC', (division_id, view_season))
            conferences[-1]['divisions'].append({'name': division_name})
            conferences[-1]['divisions'][-1]['teams'] = g.dbd.fetchall()

    return render_all_or_json('standings.html', {'conferences': conferences, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/playoffs')
@league_crap
def playoffs():
    g.dbd.execute('SELECT series_id, series_round, (SELECT name FROM team_attributes WHERE team_id = aps.team_id_home AND season = %s) as name_home, (SELECT name FROM team_attributes WHERE team_id = aps.team_id_away AND season = %s) as name_away, seed_home, seed_away, won_home, won_away FROM active_playoff_series as aps ORDER BY series_round, series_id ASC', (g.season, g.season))
    series = [[], [], [], []]  # First round, second round, third round, fourth round
    for s in g.dbd.fetchall():
        series[s['series_round'] - 1].append(s)

    return render_all_or_json('playoffs.html', {'series': series})


@app.route('/<int:league_id>/finances')
@league_crap
def finances():
    g.dbd.execute('SELECT ta.team_id, ta.region, ta.name, ta.abbreviation, AVG(ts.attendance) AS attendance, SUM(ts.attendance)*%s / 1000000 AS revenue, (SUM(ts.attendance)*%s - SUM(ts.cost)) / 1000000 AS profit, ta.cash / 1000000 as cash, ((SELECT SUM(contract_amount) FROM player_attributes as pa WHERE pa.team_id = ta.team_id) + (SELECT IFNULL(SUM(contract_amount),0) FROM released_players_salaries as rps WHERE rps.team_id = ta.team_id)) / 1000 AS payroll FROM team_attributes as ta LEFT OUTER JOIN team_stats as ts ON ta.season = ts.season AND ta.team_id = ts.team_id WHERE ta.season = %s GROUP BY ta.team_id', (g.ticket_price, g.ticket_price, g.season))

    teams = g.dbd.fetchall()

    return render_all_or_json('finances.html', {'salary_cap': g.salary_cap / 1000, 'teams': teams})


@app.route('/<int:league_id>/free_agents')
@league_crap
def free_agents():
    if g.phase >= c.PHASE_AFTER_TRADE_DEADLINE and g.phase <= c.PHASE_RESIGN_PLAYERS:
        error = "You're not allowed to sign free agents now."
        return render_all_or_json('league_error.html', {'error': error})

    g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists, pa.contract_amount/1000.0*(1+pa.free_agent_times_asked/10) as contract_amount, pa.contract_expiration FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = %s AND pa.player_id = pr.player_id LEFT OUTER JOIN player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = %s GROUP BY pa.player_id', (g.season, g.season, g.season, c.PLAYER_FREE_AGENT))

    players = g.dbd.fetchall()

    return render_all_or_json('free_agents.html', {'players': players})


@app.route('/<int:league_id>/trade', methods=['GET', 'POST'])
@league_crap
def trade_():
    player_id = request.form.get('player_id', None, type=int)
    abbreviation = request.form.get('abbreviation', None)
    if abbreviation is not None:
        new_team_id_other, abbreviation = validate_abbreviation(abbreviation)
    else:
        new_team_id_other = None
    if request.method == 'POST':
        if 'cancel' in request.form:
            trade.cancel()
            return redirect_or_json('league_dashboard')
        elif 'propose_trade' in request.form:
            team_amount_new = int(float(request.form['team_amount']) * 1000)
            team_years_new = int(request.form['team_years'])
            accepted, message = trade.offer(player_id, team_amount_new, team_years_new)
            if accepted:
                pass
        elif new_team_id_other is not None or player_id is not None:
            error = trade.new(team_id=new_team_id_other, player_id=player_id)
            if error:
                return render_all_or_json('league_error.html', {'error': error})

    # Validate that player IDs correspond with team IDs
    player_ids_user, player_ids_other = trade.get_players()
    player_ids_user, player_ids_other = trade.update_players(player_ids_user, player_ids_other)

    g.db.execute('SELECT team_id FROM trade')
    team_id_other, = g.db.fetchone()

    # Load info needed to display trade
    g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pa.contract_amount / 1000 AS contract_amount, pa.contract_expiration, AVG(ps.minutes) AS min, AVG(ps.points) AS pts, AVG(ps.offensive_rebounds + ps.defensive_rebounds) AS reb, AVG(ps.assists) AS ast FROM player_attributes AS pa LEFT OUTER JOIN player_ratings AS pr ON pr.season = %s AND pa.player_id = pr.player_id LEFT OUTER JOIN player_stats AS ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = %s GROUP BY pa.player_id ORDER BY pa.roster_position ASC', (g.season, g.season, g.season, g.user_team_id))
    roster_user = g.dbd.fetchall()

    g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pa.contract_amount / 1000 AS contract_amount, pa.contract_expiration, AVG(ps.minutes) AS min, AVG(ps.points) AS pts, AVG(ps.offensive_rebounds + ps.defensive_rebounds) AS reb, AVG(ps.assists) AS ast FROM player_attributes AS pa LEFT OUTER JOIN player_ratings AS pr ON pr.season = %s AND pa.player_id = pr.player_id LEFT OUTER JOIN player_stats AS ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = %s GROUP BY pa.player_id ORDER BY pa.roster_position ASC', (g.season, g.season, g.season, team_id_other))
    roster_other = g.dbd.fetchall()

    summary = trade.summary(team_id_other, player_ids_user, player_ids_other)

    g.dbd.execute('SELECT team_id, abbreviation, region, name FROM team_attributes WHERE season = %s AND team_id != %s ORDER BY team_id ASC', (g.season, g.user_team_id))
    teams = g.dbd.fetchall()

    return render_all_or_json('trade.html', {'roster_user': roster_user, 'roster_other': roster_other, 'player_ids_user': player_ids_user, 'player_ids_other': player_ids_other, 'summary': summary, 'teams': teams, 'team_id_other': team_id_other})


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
        g.dbd.execute('SELECT pa.player_id, pa.position, pa.name, %s - pa.born_date as age, pr.overall, pr.potential FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = %s AND pr.season = %s ORDER BY pr.overall + 2*pr.potential DESC', (g.season, c.PLAYER_UNDRAFTED, g.season))
        undrafted = g.dbd.fetchall()

        g.dbd.execute('SELECT draft_round, pick, abbreviation, player_id, name, %s - born_date as age, position, overall, potential FROM draft_results WHERE season =  %s ORDER BY draft_round, pick ASC', (g.season, g.season))
        drafted = g.dbd.fetchall()

        return render_all_or_json('draft.html', {'undrafted': undrafted, 'drafted': drafted})

    # Show a summary of an old draft
    g.dbd.execute('SELECT dr.draft_round, dr.pick, dr.abbreviation, dr.player_id, dr.name, %s - dr.born_date AS age, dr.position, dr.overall, dr.potential, ta.abbreviation AS current_abbreviation, %s - dr.born_date AS current_age, pr.overall AS current_overall, pr.potential AS current_potential, SUM(ps.minutes>0) AS gp, AVG(ps.minutes) as mpg, AVG(ps.points) AS ppg, AVG(ps.offensive_rebounds + ps.defensive_rebounds) AS rpg, AVG(ps.assists) AS apg FROM draft_results AS dr LEFT OUTER JOIN player_ratings AS pr ON pr.season = %s AND dr.player_id = pr.player_id LEFT OUTER JOIN player_stats AS ps ON ps.is_playoffs = 0 AND dr.player_id = ps.player_id LEFT OUTER JOIN player_attributes AS pa ON dr.player_id = pa.player_id LEFT OUTER JOIN team_attributes AS ta ON pa.team_id = ta.team_id AND ta.season = %s WHERE dr.season =  %s GROUP BY dr.player_id', (view_season, g.season, g.season, g.season, view_season))
    players = g.dbd.fetchall()
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

    g.dbd.execute('SELECT bre_team_id, bre_abbreviation, bre_region, bre_name, bre_won, bre_lost, brw_team_id, brw_abbreviation, brw_region, brw_name, brw_won, brw_lost, mvp_player_id, mvp_name, mvp_team_id, mvp_abbreviation, mvp_ppg, mvp_rpg, mvp_apg, dpoy_player_id, dpoy_name, dpoy_team_id, dpoy_abbreviation, dpoy_rpg, dpoy_bpg, dpoy_spg, smoy_player_id, smoy_name, smoy_team_id, smoy_abbreviation, smoy_ppg, smoy_rpg, smoy_apg, roy_player_id, roy_name, roy_team_id, roy_abbreviation, roy_ppg, roy_rpg, roy_apg FROM awards WHERE season = %s', (view_season,))
    if g.dbd.rowcount == 0:
        error = "You have to play through a season before there is any league history to view."
        return render_all_or_json('league_error.html', {'error': error})
    awards = g.dbd.fetchone()

    g.dbd.execute('SELECT player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM awards_all_league WHERE season = %s AND team_type = \'league\' ORDER BY player_rank', (view_season,))
    all_league = g.dbd.fetchall()

    g.dbd.execute('SELECT player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM awards_all_league WHERE season = %s AND team_type = \'defensive\' ORDER BY player_rank', (view_season,))
    all_defensive = g.dbd.fetchall()

    g.dbd.execute('SELECT abbreviation, region, name FROM team_attributes WHERE won_championship = 1 AND season = %s', (view_season,))
    champ = g.dbd.fetchone()

    return render_all_or_json('history.html', {'awards': awards, 'all_league': all_league, 'all_defensive': all_defensive, 'champ': champ, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/roster')
@app.route('/<int:league_id>/roster/<abbreviation>')
@app.route('/<int:league_id>/roster/<abbreviation>/<int:view_season>')
@league_crap
def roster(abbreviation=None, view_season=None):
    team_id, abbreviation = validate_abbreviation(abbreviation)
    view_season = validate_season(view_season)
    seasons = get_seasons()

    if team_id == g.user_team_id:
        g.db.execute('SELECT COUNT(*) FROM team_stats WHERE team_id = %s AND season = %s AND is_playoffs = 0', (g.user_team_id, g.season))
        n_games_remaining, = g.db.fetchone()
    else:
        n_games_remaining = 0  # Dummy value because only players on the user's team can be bought out

    if view_season == g.season:
        # Show players even if they don't have any stats
        g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pa.contract_amount / 1000 as contract_amount, pa.contract_expiration, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists, ((1 + pa.contract_expiration - %s) * pa.contract_amount - %s / 82 * pa.contract_amount) / 1000 AS cash_owed FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = %s AND pa.player_id = pr.player_id LEFT OUTER JOIN player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = %s GROUP BY pa.player_id ORDER BY pa.roster_position ASC', (view_season, view_season, n_games_remaining, view_season, view_season, team_id))
    else:
        # Only show players with stats, as that's where the team history is recorded
        g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pa.contract_amount / 1000 as contract_amount,  pa.contract_expiration, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists FROM player_attributes as pa LEFT OUTER JOIN player_ratings as pr ON pr.season = %s AND pa.player_id = pr.player_id LEFT OUTER JOIN player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE ps.team_id = %s GROUP BY pa.player_id ORDER BY pa.roster_position ASC', (view_season, view_season, view_season, team_id))
    players = g.dbd.fetchall()

    g.dbd.execute('SELECT team_id, abbreviation, region, name FROM team_attributes WHERE season = %s ORDER BY team_id ASC', (view_season,))
    teams = g.dbd.fetchall()

    g.db.execute('SELECT CONCAT(region, " ", name), cash / 1000000 FROM team_attributes WHERE team_id = %s AND season = %s', (team_id, view_season))
    team_name, cash = g.db.fetchone()

    return render_all_or_json('roster.html', {'players': players, 'num_roster_spots': 15 - len(players), 'teams': teams, 'team_id': team_id, 'team_name': team_name, 'cash': cash, 'view_season': view_season, 'seasons': seasons})


@app.route('/<int:league_id>/roster/auto_sort', methods=['POST'])
@league_crap
def auto_sort_roster(abbreviation=None):
    roster_auto_sort(g.user_team_id)

    return redirect_or_json('roster')


@app.route('/<int:league_id>/game_log')
@app.route('/<int:league_id>/game_log/<int:view_season>')
@app.route('/<int:league_id>/game_log/<int:view_season>/<abbreviation>')
@league_crap
def game_log(view_season=None, abbreviation=None):
    view_season = validate_season(view_season)
    team_id, abbreviation = validate_abbreviation(abbreviation)

    g.dbd.execute('SELECT team_id, abbreviation, region, name FROM team_attributes WHERE season = %s ORDER BY team_id ASC', (view_season,))
    teams = g.dbd.fetchall()

    seasons = []
    g.db.execute('SELECT season FROM team_attributes GROUP BY season ORDER BY season DESC')
    for season, in g.db.fetchall():
        seasons.append(season)

    return render_all_or_json('game_log.html', {'abbreviation': abbreviation, 'teams': teams, 'team_id': team_id, 'seasons': seasons, 'view_season': view_season})


@app.route('/<int:league_id>/player/<int:player_id>')
@league_crap
def player_(player_id):
    # Info
    g.dbd.execute('SELECT name, position, (SELECT CONCAT(region, " ", name) FROM team_attributes as ta WHERE pa.team_id = ta.team_id AND ta.season = %s) as team, height, weight, %s - born_date as age, born_date, born_location, college, draft_year, draft_round, draft_pick, (SELECT CONCAT(region, " ", name) FROM team_attributes as ta WHERE ta.team_id = pa.draft_team_id AND ta.season = %s) as draft_team, contract_amount, contract_expiration FROM player_attributes as pa WHERE player_id = %s', (g.season, g.season, g.season, player_id))
    info = g.dbd.fetchone()
    info['height'] = '%d\'%d"' % (info['height'] // 12, info['height'] % 12)
    info['contract_amount'] = '$%.2fM' % (info['contract_amount'] / 1000.0)

    # Current ratings
    g.dbd.execute('SELECT overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding, potential FROM player_ratings WHERE season = %s AND player_id = %s', (g.season, player_id))
    ratings = g.dbd.fetchone()

    # Season stats and ratings
    g.dbd.execute('SELECT ps.season, ta.abbreviation, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS minutes, AVG(ps.field_goals_made) AS field_goals_made, AVG(ps.field_goals_attempted) AS field_goals_attempted, 100*AVG(ps.field_goals_made/ps.field_goals_attempted) AS field_goal_percentage, AVG(ps.three_pointers_made) AS three_pointers_made, AVG(ps.three_pointers_attempted) AS three_pointers_attempted, 100*AVG(ps.three_pointers_made/ps.three_pointers_attempted) AS three_point_percentage, AVG(ps.free_throws_made) AS free_throws_made, AVG(ps.free_throws_attempted) AS free_throws_attempted, 100*AVG(ps.free_throws_made/ps.free_throws_attempted) AS free_throw_percentage, AVG(ps.offensive_rebounds) AS offensive_rebounds, AVG(ps.defensive_rebounds) AS defensive_rebounds, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rebounds, AVG(ps.assists) AS assists, AVG(ps.turnovers) AS turnovers, AVG(ps.steals) AS steals, AVG(ps.blocks) AS blocks, AVG(ps.personal_fouls) AS personal_fouls, AVG(ps.points) AS points, ps.season - pa.born_date AS age, pr.overall, pr.potential, pr.height, pr.strength, pr.speed, pr.jumping, pr.endurance, pr.shooting_inside, pr.shooting_layups, pr.shooting_free_throws, pr.shooting_two_pointers, pr.shooting_three_pointers, pr.blocks AS rating_blocks, pr.steals AS rating_steals, pr.dribbling, pr.passing, pr.rebounding FROM player_attributes AS pa LEFT JOIN player_stats as ps ON pa.player_id = ps.player_id LEFT JOIN player_ratings AS pr ON pr.player_id = pa.player_id AND pr.season = ps.season LEFT OUTER JOIN team_attributes AS ta ON pa.team_id = ta.team_id AND ta.season = ps.season AND ta.season = pr.season WHERE pa.player_id = %s AND ps.is_playoffs = 0 GROUP BY ps.season ORDER BY ps.season ASC', (player_id,))
    seasons = g.dbd.fetchall()

    return render_all_or_json('player.html', {'info': info, 'ratings': ratings, 'seasons': seasons})


@app.route('/<int:league_id>/negotiation')
@league_crap
def negotiation_list(player_id=None):
    # If there is only one active negotiation with a free agent, go to it
    g.db.execute('SELECT player_id FROM negotiation WHERE resigning = 0')
    if g.db.rowcount == 1:
        player_id, = g.db.fetchone()
        return redirect_or_json('negotiation', {'player_id': player_id})

    if g.phase != c.PHASE_RESIGN_PLAYERS:
        error = "Something bad happened."
        return render_all_or_json('league_error.html', {'error': error})

    g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists, pa.contract_amount/1000.0*(1+pa.free_agent_times_asked/10) as contract_amount, pa.contract_expiration FROM player_attributes as pa LEFT OUTER JOIN negotiation as n ON pa.player_id = n.player_id LEFT OUTER JOIN player_ratings as pr ON pr.season = %s AND pa.player_id = pr.player_id LEFT OUTER JOIN player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = %s AND n.resigning = 1 GROUP BY pa.player_id', (g.season, g.season, g.season, c.PLAYER_FREE_AGENT))

    players = g.dbd.fetchall()

    return render_all_or_json('negotiation_list.html', {'players': players})


@app.route('/<int:league_id>/negotiation/<int:player_id>', methods=['GET', 'POST'])
@league_crap
def negotiation(player_id):
    if request.method == 'POST':
        if 'cancel' in request.form:
            contract_negotiation.cancel(player_id)
            return redirect_or_json('league_dashboard')
        elif 'accept' in request.form:
            error = contract_negotiation.accept(player_id)
            if error:
                return render_all_or_json('league_error.html', {'error': error})
            return redirect_or_json('roster')
        else:
            team_amount_new = int(float(request.form['team_amount']) * 1000)
            team_years_new = int(request.form['team_years'])
            contract_negotiation.offer(player_id, team_amount_new, team_years_new)
    else:
        # If there is no active negotiation with this player_id, create it
        g.db.execute('SELECT 1 FROM negotiation WHERE player_id = %s', (player_id))
        if not g.db.rowcount:
            error = contract_negotiation.new(player_id)
            if error:
                return render_all_or_json('league_error.html', {'error': error})

    g.db.execute('SELECT team_amount, team_years, player_amount, player_years, resigning FROM negotiation WHERE player_id = %s', (player_id))
    team_amount, team_years, player_amount, player_years, resigning = g.db.fetchone()

    player_amount /= 1000.0
    team_amount /= 1000.0
    player_expiration = player_years + g.season
    # Adjust to account for in-season signings
    if g.phase <= c.PHASE_AFTER_TRADE_DEADLINE:
        player_expiration -= 1

    g.dbd.execute('SELECT pa.player_id, pa.name, pr.overall, pr.potential FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.player_id = %s AND pr.season = %s', (player_id, g.season))
    player = g.dbd.fetchone()

    salary_cap = g.salary_cap / 1000.0
    g.db.execute('SELECT CONCAT(region, " ", name) FROM team_attributes WHERE team_id = %s AND season = %s', (g.user_team_id, g.season))
    team_name, = g.db.fetchone()

    payroll = get_payroll(g.user_team_id)
    payroll /= 1000.0

    return render_all_or_json('negotiation.html', {'team_amount': team_amount, 'team_years': team_years, 'player_amount': player_amount, 'player_years': player_years, 'player_expiration': player_expiration, 'resigning': resigning, 'player': player, 'salary_cap': salary_cap, 'team_name': team_name, 'payroll': payroll})


# Utility views

@app.route('/<int:league_id>/box_score')
@app.route('/<int:league_id>/box_score/<int:game_id>')
@league_crap_ajax
def box_score(game_id=0):
    teams = []
    g.dbd.execute('SELECT * FROM team_stats WHERE game_id = %s', (game_id,))
    for row in g.dbd.fetchall():
        teams.append(row)

        g.db.execute('SELECT region, name, abbreviation FROM team_attributes WHERE team_id = %s', (teams[-1]['team_id'],))
        teams[-1]['region'], teams[-1]['name'], teams[-1]['abbreviation'] = g.db.fetchone()

        g.dbd.execute('SELECT pa.player_id, name, position, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, offensive_rebounds + defensive_rebounds AS rebounds, assists, turnovers, steals, blocks, personal_fouls, points FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.game_id = %s AND pa.team_id = %s ORDER BY starter DESC, minutes DESC', (game_id, teams[-1]['team_id']))
        teams[-1]['players'] = g.dbd.fetchall()

        # Total rebounds
        teams[-1]['rebounds'] = teams[-1]['offensive_rebounds'] + teams[-1]['defensive_rebounds']

    # Who won?
    if teams[0]['points'] > teams[1]['points']:
        won_lost = {'won_points': teams[0]['points'], 'won_region': teams[0]['region'], 'won_name': teams[0]['name'], 'won_abbreviation': teams[0]['abbreviation'], 'lost_points': teams[1]['points'], 'lost_region': teams[1]['region'], 'lost_name': teams[1]['name'], 'lost_abbreviation': teams[1]['abbreviation']}
    else:
        won_lost = {'won_points': teams[1]['points'], 'won_region': teams[1]['region'], 'won_name': teams[1]['name'], 'won_abbreviation': teams[1]['abbreviation'], 'lost_points': teams[0]['points'], 'lost_region': teams[0]['region'], 'lost_name': teams[0]['name'], 'lost_abbreviation': teams[0]['abbreviation']}

    return render_template('box_score.html', teams=teams, view_season=teams[0]['season'], **won_lost)


@app.route('/<int:league_id>/game_log_list')
@league_crap_ajax
def game_log_list():
    season = request.args.get('season', None, type=int)
    abbreviation = request.args.get('abbreviation', None, type=str)

    season = validate_season(season)
    team_id, abbreviation = validate_abbreviation(abbreviation)

    g.dbd.execute('SELECT game_id, home, (SELECT abbreviation FROM team_attributes WHERE team_id = opponent_team_id AND season = %s) as opponent_abbreviation, won, points, opponent_points FROM team_stats WHERE team_id = %s AND season = %s', (season, team_id, season))
    games = g.dbd.fetchall()

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
    player_ids_user = map(int, request.form.getlist('player_ids_user'))
    player_ids_other = map(int, request.form.getlist('player_ids_other'))
    player_ids_user, player_ids_other = trade.update_players(player_ids_user, player_ids_other)
    print player_ids_user, player_ids_other
#    return jsonify(summary='FUCK', player_ids_user=player_ids_user, player_ids_other=player_ids_other)
    g.db.execute('SELECT team_id FROM trade')
    team_id_other, = g.db.fetchone()
    summary = trade.summary(team_id_other, player_ids_user, player_ids_other)
    trade_summary = render_template('trade_summary.html', summary=summary)
    return jsonify(summary=trade_summary, player_ids_user=player_ids_user, player_ids_other=player_ids_other)


@app.route('/<int:league_id>/draft/until_user_or_end', methods=['POST'])
@league_crap_ajax
def draft_until_user_or_end():
    play_menu.set_status('Draft in progress...')
    player_ids = draft.until_user_or_end()

    done = False
    if g.phase == c.PHASE_AFTER_DRAFT:
        done = True
        play_menu.set_status('Idle')

    return jsonify(player_ids=player_ids, done=done)


@app.route('/<int:league_id>/draft/user', methods=['POST'])
@league_crap_ajax
def draft_user():
    player_id = int(request.form['player_id'])
    player_id = draft.pick_player(g.user_team_id, player_id)

    return jsonify(player_ids=[player_id])


@app.route('/<int:league_id>/roster/reorder', methods=['POST'])
@league_crap_ajax
def roster_reorder():
    roster_position = 1
    for player_id in request.form.getlist('roster[]'):
        player_id = int(player_id)
        g.db.execute('SELECT team_id FROM player_attributes WHERE player_id = %s', (player_id))
        team_id, = g.db.fetchone()
        if team_id == g.user_team_id:  # Don't let the user update CPU-controlled rosters
            g.db.execute('UPDATE player_attributes SET roster_position = %s WHERE player_id = %s', (roster_position, player_id))
            roster_position += 1

    return 'fuck'


@app.route('/<int:league_id>/roster/release', methods=['POST'])
@league_crap_ajax
def roster_release():
    error = None

    g.db.execute('SELECT COUNT(*) FROM player_attributes WHERE team_id = %s', (g.user_team_id))
    num_players_on_roster, = g.db.fetchone()
    if num_players_on_roster <= 5:
        error = 'You must keep at least 5 players on your roster.'
    else:
        player_id = int(request.form['player_id'])
        g.db.execute('SELECT team_id FROM player_attributes WHERE player_id = %s', (player_id))
        team_id, = g.db.fetchone()
        if team_id == g.user_team_id:  # Don't let the user update CPU-controlled rosters
            p = player.Player()
            p.load(player_id)
            p.release()
        else:
            error = 'You aren\'t allowed to do this.'

    return jsonify(error=error)


@app.route('/<int:league_id>/roster/buy_out', methods=['POST'])
@league_crap_ajax
def roster_buy_out():
    error = None

    g.db.execute('SELECT COUNT(*) FROM player_attributes WHERE team_id = %s', (g.user_team_id))
    num_players_on_roster, = g.db.fetchone()
    if num_players_on_roster <= 5:
        error = 'You must keep at least 5 players on your roster.'
    else:
        player_id = int(request.form['player_id'])
        g.db.execute('SELECT team_id FROM player_attributes WHERE player_id = %s', (player_id))
        team_id, = g.db.fetchone()
        if team_id == g.user_team_id:  # Don't let the user update CPU-controlled rosters
            g.db.execute('SELECT cash / 1000000 FROM team_attributes WHERE team_id = %s AND season = %s', (g.user_team_id, g.season))
            cash, = g.db.fetchone()
            g.db.execute('SELECT COUNT(*) FROM team_stats WHERE team_id = %s AND season = %s AND is_playoffs = 0', (g.user_team_id, g.season))
            n_games_remaining, = g.db.fetchone()
            g.db.execute('SELECT ((1 + pa.contract_expiration - %s) * pa.contract_amount - %s / 82 * pa.contract_amount) / 1000 FROM player_attributes AS pa WHERE player_id = %s', (g.season, n_games_remaining, player_id))
            cash_owed, = g.db.fetchone()
            if cash_owed < cash:
                # Pay the cash
                g.db.execute('UPDATE team_attributes SET cash = cash - %s WHERE team_id = %s AND season = %s', (cash_owed * 1000000, g.user_team_id, g.season))
                # Set to FA in database
                p = player.Player()
                p.load(player_id)
                p.add_to_free_agents()
            else:
                error = 'Not enough cash.'
        else:
            error = 'You aren\'t allowed to do this.'

    return jsonify(error=error)


def validate_abbreviation(abbreviation):
    """Validate that the given abbreviation corresponds to a valid team.

    If an invalid abbreviation is passed, the user's team will be used.

    Args:
        abbreviation: Three-letter all-caps string containing a team's
            abbreviation.
    Returns:
        A two element list of the validated team ID and abbreviation.
    """
    team_id = None

    # Try to use the supplied abbreviation
    if abbreviation:
        g.db.execute('SELECT team_id FROM team_attributes WHERE season = %s AND abbreviation = %s', (g.season, abbreviation))
        if g.db.rowcount == 1:
            team_id, = g.db.fetchone()

    # If no valid abbreviation was given, default to the user's team
    if not team_id:
        team_id = g.user_team_id
        g.db.execute('SELECT abbreviation FROM team_attributes WHERE season = %s AND team_id = %s', (g.season, team_id))
        abbreviation, = g.db.fetchone()

    return team_id, abbreviation


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


def render_all_or_json(template_file, template_args={}):
    """Return rendered template, or JSON containing rendered blocks."""
    if request.args.get('json', 0, type=int) or request.form.get('json', 0, type=int):
        ctx = _request_ctx_stack.top  # Not sure what this does
        ctx.app.update_template_context(template_args)  # Not sure what this does
        template = ctx.app.jinja_env.get_template(template_file)
        context = template.new_context(template_args)
        d = {}
        for key, blockfun in template.blocks.iteritems():
            d[key] = concat(blockfun(context))
        return jsonify(d)
    else:
        return render_template(template_file, **template_args)


def redirect_or_json(f, args={}):
    """Redirect to function's URL, or return a JSON response containing rendered
    blocks from a function's template.

    This kind of sucks because it currently doesn't pass the URL, so there's no
    way to update it with pushState on the client side.
    """
    if request.args.get('json', 0, type=int) or request.form.get('json', 0, type=int):
        return globals()[f](**args)
    else:
        args['league_id'] = g.league_id
        return redirect(url_for(f, **args))
