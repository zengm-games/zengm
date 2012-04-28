from jinja2.utils import concat
import json
import random
import time

from flask import jsonify, render_template, url_for, request, session, redirect, g
from flask.globals import _request_ctx_stack

from bbgm import app
from bbgm.core import draft, game, contract_negotiation, play_menu, season
from bbgm.util import get_payroll, get_seasons, roster_auto_sort
from bbgm.util.decorators import league_crap, league_crap_ajax

# All the views in here are for within a league.

# Automatically handle league ID
@app.url_defaults
def add_league_id(endpoint, values):
    if 'league_id' in values or not g.league_id:
        return
    if app.url_map.is_endpoint_expecting(endpoint, 'league_id'):
        values['league_id'] = g.league_id
@app.url_value_preprocessor
def pull_league_id(endpoint, values):
    g.league_id = values.pop('league_id', None)

@app.route('/<int:league_id>')
@league_crap
def league_dashboard():
    g.dbd.execute('SELECT team_id, region, name FROM teams ORDER BY team_id ASC')
    teams = g.dbd.fetchall()

    return render_all_or_json('league_dashboard.html')

@app.route('/<int:league_id>/leaders')
@app.route('/<int:league_id>/leaders/<int:view_season>')
@league_crap
def leaders(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    categories = []
    categories.append({'name': 'Points', 'stat': 'Pts',
                       'title': 'Points per game', 'data': []})
    categories.append({'name': 'Rebounds', 'stat': 'Reb',
                       'title': 'Rebounds per game', 'data': []})
    categories.append({'name': 'Assists', 'stat': 'Ast',
                       'title': 'Assists per game', 'data': []})
    categories.append({'name': 'Field goal percentage', 'stat': 'FG%',
                       'title': 'Field goal percentage', 'data': []})
    categories.append({'name': 'Blocks', 'stat': 'Blk',
                       'title': 'Blocks per game', 'data': []})
    categories.append({'name': 'Steals', 'stat': 'Stl',
                       'title': 'Steals per game', 'data': []})

    cols = ['ps.points', 'ps.offensive_rebounds+ps.defensive_rebounds',
            'ps.assists', '100*ps.field_goals_made/ps.field_goals_attempted',
            'ps.blocks', 'ps.steals']
    for i in xrange(len(cols)):
        # I have to insert the cateogry using string formatting because
        # otherwise it mangles the syntax. But it's okay, cols is defined just a
        # few lines up. Nothing malicious there.
        g.dbd.execute('SELECT pa.player_id, pa.name, ta.abbreviation, AVG(%s) as stat FROM %s_player_attributes as pa, %s_player_stats as ps, %s_team_attributes as ta WHERE pa.player_id = ps.player_id AND ps.season = %s AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.player_id ORDER BY AVG(%s) DESC LIMIT 10' % (cols[i], '%s', '%s', '%s', '%s', cols[i]), (g.league_id, g.league_id, g.league_id, view_season))
        categories[i]['data'] = g.dbd.fetchall()

    g.db.execute('SELECT abbreviation FROM %s_team_attributes WHERE team_id = %s AND season = %s', (g.league_id, g.user_team_id, view_season))
    user_abbreviation, = g.db.fetchone()

    return render_all_or_json('leaders.html', {'categories': categories, 'user_abbreviation': user_abbreviation, 'seasons': seasons, 'view_season': view_season})

@app.route('/<int:league_id>/player_ratings')
@league_crap
def player_ratings():
    g.dbd.execute('SELECT pa.player_id, pa.team_id, pa.name, (SELECT abbreviation FROM %s_team_attributes WHERE team_id = pa.team_id) as abbreviation, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pr.height, pr.strength, pr.speed, pr.jumping, pr.endurance, pr.shooting_inside, pr.shooting_layups, pr.shooting_free_throws, pr.shooting_two_pointers, pr.shooting_three_pointers, pr.blocks, pr.steals, pr.dribbling, pr.passing, pr.rebounding FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id', (g.league_id, g.season, g.league_id, g.league_id))
    players = g.dbd.fetchall()

    return render_all_or_json('player_ratings.html', {'players': players})

@app.route('/<int:league_id>/player_stats')
@app.route('/<int:league_id>/player_stats/<int:view_season>')
@league_crap
def player_stats(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    g.dbd.execute('SELECT pa.player_id, pa.team_id, pa.name, ta.abbreviation, pa.position, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS minutes, AVG(ps.field_goals_made) AS field_goals_made, AVG(ps.field_goals_attempted) AS field_goals_attempted, 100*AVG(ps.field_goals_made/ps.field_goals_attempted) AS field_goal_percentage, AVG(ps.three_pointers_made) AS three_pointers_made, AVG(ps.three_pointers_attempted) AS three_pointers_attempted, 100*AVG(ps.three_pointers_made/ps.three_pointers_attempted) AS three_point_percentage, AVG(ps.free_throws_made) AS free_throws_made, AVG(ps.free_throws_attempted) AS free_throws_attempted, 100*AVG(ps.free_throws_made/ps.free_throws_attempted) AS free_throw_percentage, AVG(ps.offensive_rebounds) AS offensive_rebounds, AVG(ps.defensive_rebounds) AS defensive_rebounds, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rebounds, AVG(ps.assists) AS assists, AVG(ps.turnovers) AS turnovers, AVG(ps.steals) AS steals, AVG(ps.blocks) AS blocks, AVG(ps.personal_fouls) AS personal_fouls, AVG(ps.points) AS points FROM %s_player_attributes as pa, %s_player_stats as ps, %s_team_attributes as ta WHERE pa.player_id = ps.player_id AND ps.season = %s AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.player_id', (g.league_id, g.league_id, g.league_id, view_season))
    players = g.dbd.fetchall()

    # Don't pass blank values where floats are expected by the template
    for i in xrange(len(players)):
        for key in players[i].keys():
            if not players[i][key]:
                players[i][key] = 0

    return render_all_or_json('player_stats.html', {'players': players, 'seasons': seasons, 'view_season': view_season})

# Change to POST (with CSRF protection) later (gives a weird error when I try that now)
@app.route('/<int:league_id>/play/<amount>', methods=['POST'])
@league_crap_ajax
def play(amount):
    error = None
    url = None

    if amount == 'day':
        game.play(1)
    elif amount == 'week':
        game.play(7)
    elif amount == 'month':
        game.play(30)
    elif amount == 'until_playoffs':
        g.db.execute('SELECT COUNT(*)/%s FROM %s_team_stats WHERE season = %s', (g.num_teams, g.league_id, g.season))
        row = g.db.fetchone()
        num_days = g.season_length - row[0]  # Number of days remaining
        game.play(num_days)
    elif amount == 'through_playoffs':
        game.play(100)  # There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
    elif amount == 'until_draft':
        draft.generate_players()
        draft.set_order()
        season.new_phase(5)
        url = url_for('draft_', league_id=g.league_id)
    elif amount == 'until_resign_players':
        season.new_phase(7)
        url = url_for('negotiation_list', league_id=g.league_id)
    elif amount == 'until_free_agency':
        season.new_phase(8)
        url = url_for('free_agents', league_id=g.league_id)
    elif amount == 'until_preseason':
        season.new_phase(0)
    elif amount == 'until_regular_season':
        error = season.new_phase(1)

    return jsonify(url=url, error=error)

@app.route('/<int:league_id>/schedule')
@league_crap
def schedule():
    schedule_ = season.get_schedule()
    schedule_.reverse()
    games = []

    for game in schedule_:
        if g.user_team_id in game:
            games.append([])
            for team_id in game:
                g.dbd.execute('SELECT team_id, abbreviation, region, name FROM %s_team_attributes WHERE team_id = %s', (g.league_id, team_id))
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
    g.db.execute('SELECT conference_id, name FROM %s_league_conferences ORDER BY conference_id ASC', (g.league_id,))
    for conference_id, conference_name in g.db.fetchall():
        conferences.append({'id': conference_id, 'name': conference_name, 'divisions': [], 'standings': ''})
        g.dbd.execute('SELECT * FROM %s_team_attributes as ta WHERE ta.division_id IN (SELECT ld.division_id FROM %s_league_divisions as ld WHERE ld.conference_id = %s) AND season = %s ORDER BY won/(won+lost) DESC', (g.league_id, g.league_id, conference_id, view_season))
        conferences[-1]['teams'] = g.dbd.fetchall()

        g.db.execute('SELECT division_id, name FROM %s_league_divisions WHERE conference_id = %s ORDER BY name ASC', (g.league_id, conference_id))
        for division_id, division_name in g.db.fetchall():
            g.dbd.execute('SELECT * FROM %s_team_attributes WHERE division_id = %s AND season = %s ORDER BY won/(won+lost) DESC', (g.league_id, division_id, view_season))
            conferences[-1]['divisions'].append({'name': division_name})
            conferences[-1]['divisions'][-1]['teams'] = g.dbd.fetchall()

    return render_all_or_json('standings.html', {'conferences': conferences, 'seasons': seasons, 'view_season': view_season})

@app.route('/<int:league_id>/playoffs')
@league_crap
def playoffs():
    g.dbd.execute('SELECT series_id, series_round, (SELECT name FROM %s_team_attributes WHERE team_id = aps.team_id_home AND season = %s) as name_home, (SELECT name FROM %s_team_attributes WHERE team_id = aps.team_id_away AND season = %s) as name_away, seed_home, seed_away, won_home, won_away FROM %s_active_playoff_series as aps ORDER BY series_round, series_id ASC', (g.league_id, g.season, g.league_id, g.season, g.league_id))
    series = [[], [], [], []] # First round, second round, third round, fourth round
    for s in g.dbd.fetchall():
        series[s['series_round']-1].append(s)

    return render_all_or_json('playoffs.html', {'series': series})

@app.route('/<int:league_id>/free_agents')
@league_crap
def free_agents():
    if g.phase >= 2 and g.phase <= 7:
        error = "You're not allowed to sign free agents now."
        return render_all_or_json('league_error.html', {'error': error})

    g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists, pa.contract_amount/1000.0*(1+pa.free_agent_times_asked/10) as contract_amount, pa.contract_expiration FROM %s_player_attributes as pa LEFT OUTER JOIN %s_player_ratings as pr ON pa.player_id = pr.player_id LEFT OUTER JOIN %s_player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = -1 GROUP BY pa.player_id', (g.season, g.league_id, g.league_id, g.league_id, g.season))

    players = g.dbd.fetchall()

    return render_all_or_json('free_agents.html', {'players': players})

@app.route('/<int:league_id>/draft')
@league_crap
def draft_():
    if g.phase != 5:
        error = "It's not time for the draft right now."
        return render_all_or_json('league_error.html', {'error': error})

    g.dbd.execute('SELECT pa.player_id, pa.position, pa.name, %s - pa.born_date as age, pr.overall, pr.potential FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = -2 ORDER BY pr.overall + 2*pr.potential DESC', (g.season, g.league_id, g.league_id))
    undrafted = g.dbd.fetchall()

    g.dbd.execute('SELECT draft_round, pick, abbreviation, player_id, name, %s - born_date as age, position, overall, potential FROM %s_draft_results WHERE season =  %s ORDER BY draft_round, pick ASC', (g.season, g.league_id, g.season))
    drafted = g.dbd.fetchall()

    return render_all_or_json('draft.html', {'undrafted': undrafted, 'drafted': drafted})

@app.route('/<int:league_id>/history')
@app.route('/<int:league_id>/history/<int:view_season>')
@league_crap
def history(view_season=None):
    view_season = validate_season(view_season)
    seasons = get_seasons()

    # If this season isn't over...
    if g.phase < 3:
        # View last season by default
        if view_season == g.season:
            view_season -= 1
        seasons.remove(g.season)  # Don't show this season as an option

    g.dbd.execute('SELECT bre_team_id, bre_abbreviation, bre_region, bre_name, bre_won, bre_lost, brw_team_id, brw_abbreviation, brw_region, brw_name, brw_won, brw_lost, mvp_player_id, mvp_name, mvp_team_id, mvp_abbreviation, mvp_ppg, mvp_rpg, mvp_apg, dpoy_player_id, dpoy_name, dpoy_team_id, dpoy_abbreviation, dpoy_rpg, dpoy_bpg, dpoy_spg, smoy_player_id, smoy_name, smoy_team_id, smoy_abbreviation, smoy_ppg, smoy_rpg, smoy_apg, roy_player_id, roy_name, roy_team_id, roy_abbreviation, roy_ppg, roy_rpg, roy_apg FROM %s_awards WHERE season = %s', (g.league_id, view_season))
    if g.dbd.rowcount == 0:
        error = "You have to play through a season before there is any league history to view."
        return render_all_or_json('league_error.html', {'error': error})
    awards = g.dbd.fetchone()

    g.dbd.execute('SELECT player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM %s_awards_all_league WHERE season = %s AND team_type = \'league\' ORDER BY player_rank', (g.league_id, view_season))
    all_league = g.dbd.fetchall()

    g.dbd.execute('SELECT player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM %s_awards_all_league WHERE season = %s AND team_type = \'defensive\' ORDER BY player_rank', (g.league_id, view_season))
    all_defensive = g.dbd.fetchall()

    g.dbd.execute('SELECT abbreviation, region, name FROM %s_team_attributes WHERE won_championship = 1 AND season = %s', (g.league_id, view_season))
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

    if view_season == g.season:
        # Show players even if they don't have any stats
        g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pa.contract_amount / 1000 as contract_amount,  pa.contract_expiration, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists FROM %s_player_attributes as pa LEFT OUTER JOIN %s_player_ratings as pr ON pa.player_id = pr.player_id LEFT OUTER JOIN %s_player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = %s GROUP BY pa.player_id ORDER BY pr.roster_position ASC', (view_season, g.league_id, g.league_id, g.league_id, view_season, team_id))
    else:
        # Only show players with stats, as that's where the team history is recorded
        g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pa.contract_amount / 1000 as contract_amount,  pa.contract_expiration, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists FROM %s_player_attributes as pa LEFT OUTER JOIN %s_player_ratings as pr ON pa.player_id = pr.player_id LEFT OUTER JOIN %s_player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE ps.team_id = %s GROUP BY pa.player_id ORDER BY pr.roster_position ASC', (view_season, g.league_id, g.league_id, g.league_id, view_season, team_id))
    players = g.dbd.fetchall()

    g.dbd.execute('SELECT team_id, abbreviation, region, name FROM %s_team_attributes WHERE season = %s ORDER BY team_id ASC', (g.league_id, view_season))
    teams = g.dbd.fetchall()

    g.db.execute('SELECT CONCAT(region, " ", name) FROM %s_team_attributes WHERE team_id = %s AND season = %s', (g.league_id, team_id, view_season))
    team_name, = g.db.fetchone()

    return render_all_or_json('roster.html', {'players': players, 'num_roster_spots': 15-len(players), 'teams': teams, 'team_id': team_id, 'team_name': team_name, 'view_season': view_season, 'seasons': seasons})

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

    g.dbd.execute('SELECT abbreviation FROM %s_team_attributes WHERE season = %s ORDER BY team_id ASC', (g.league_id, view_season))
    teams = g.dbd.fetchall()

    seasons = []
    g.db.execute('SELECT season FROM %s_team_attributes GROUP BY season ORDER BY season DESC', (g.league_id))
    for season, in g.db.fetchall():
        seasons.append(season)

    return render_all_or_json('game_log.html', {'abbreviation': abbreviation, 'teams': teams, 'seasons': seasons, 'view_season': view_season})

@app.route('/<int:league_id>/player/<int:player_id>')
@league_crap
def player(player_id):
    # Info
    g.dbd.execute('SELECT name, position, (SELECT CONCAT(region, " ", name) FROM %s_team_attributes as ta WHERE pa.team_id = ta.team_id AND ta.season = %s) as team, height, weight, %s - born_date as age, born_date, born_location, college, draft_year, draft_round, draft_pick, (SELECT CONCAT(region, " ", name) FROM %s_team_attributes as ta WHERE ta.team_id = pa.draft_team_id AND ta.season = %s) as draft_team, contract_amount, contract_expiration FROM %s_player_attributes as pa WHERE player_id = %s', (g.league_id, g.season, g.season, g.league_id, g.season, g.league_id, player_id))
    info = g.dbd.fetchone()
    print 'INFO', info
    info['height'] = '%d\'%d"' % (info['height'] // 12, info['height'] % 12);
    info['contract_amount'] = '$%.2fM' % (info['contract_amount'] / 1000.0)

    # Ratings
    g.dbd.execute('SELECT overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding, potential FROM %s_player_ratings WHERE player_id = %s', (g.league_id, player_id))
    ratings = g.dbd.fetchone()

    # Season stats
#    g.dbd.execute('SELECT ps.season, ta.abbreviation, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS minutes, AVG(ps.field_goals_made) AS field_goals_made, AVG(ps.field_goals_attempted) AS field_goals_attempted, 100*AVG(ps.field_goals_made/ps.field_goals_attempted) AS field_goal_percentage, AVG(ps.three_pointers_made) AS three_pointers_made, AVG(ps.three_pointers_attempted) AS three_pointers_attempted, 100*AVG(ps.three_pointers_made/ps.three_pointers_attempted) AS three_point_percentage, AVG(ps.free_throws_made) AS free_throws_made, AVG(ps.free_throws_attempted) AS free_throws_attempted, 100*AVG(ps.free_throws_made/ps.free_throws_attempted) AS free_throw_percentage, AVG(ps.offensive_rebounds) AS offensive_rebounds, AVG(ps.defensive_rebounds) AS defensive_rebounds, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rebounds, AVG(ps.assists) AS assists, AVG(ps.turnovers) AS turnovers, AVG(ps.steals) AS steals, AVG(ps.blocks) AS blocks, AVG(ps.personal_fouls) AS personal_fouls, AVG(ps.points) AS points FROM %s_player_attributes as pa, %s_player_stats as ps, %s_team_attributes as ta WHERE pa.player_id = ps.player_id AND pa.player_id = %s AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.season ORDER BY ps.season ASC', (g.league_id, g.league_id, g.league_id, player_id))
    g.dbd.execute('SELECT ps.season, ta.abbreviation, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS minutes, AVG(ps.field_goals_made) AS field_goals_made, AVG(ps.field_goals_attempted) AS field_goals_attempted, 100*AVG(ps.field_goals_made/ps.field_goals_attempted) AS field_goal_percentage, AVG(ps.three_pointers_made) AS three_pointers_made, AVG(ps.three_pointers_attempted) AS three_pointers_attempted, 100*AVG(ps.three_pointers_made/ps.three_pointers_attempted) AS three_point_percentage, AVG(ps.free_throws_made) AS free_throws_made, AVG(ps.free_throws_attempted) AS free_throws_attempted, 100*AVG(ps.free_throws_made/ps.free_throws_attempted) AS free_throw_percentage, AVG(ps.offensive_rebounds) AS offensive_rebounds, AVG(ps.defensive_rebounds) AS defensive_rebounds, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rebounds, AVG(ps.assists) AS assists, AVG(ps.turnovers) AS turnovers, AVG(ps.steals) AS steals, AVG(ps.blocks) AS blocks, AVG(ps.personal_fouls) AS personal_fouls, AVG(ps.points) AS points FROM %s_player_attributes as pa LEFT JOIN %s_player_stats as ps ON pa.player_id = ps.player_id LEFT OUTER JOIN %s_team_attributes as ta ON pa.team_id = ta.team_id AND ta.season = ps.season WHERE pa.player_id = %s AND ps.is_playoffs = 0 GROUP BY ps.season ORDER BY ps.season ASC', (g.league_id, g.league_id, g.league_id, player_id))

    seasons = g.dbd.fetchall()

    return render_all_or_json('player.html', {'info': info, 'ratings': ratings, 'seasons': seasons})

@app.route('/<int:league_id>/negotiation')
@league_crap
def negotiation_list(player_id=None):
    # If there is only one active negotiation with a free agent, go to it
    g.db.execute('SELECT player_id FROM %s_negotiation WHERE resigning = 0', (g.league_id,))
    if g.db.rowcount == 1:
        player_id, = g.db.fetchone()
        return redirect_or_json('negotiation', {'player_id': player_id})

    if g.phase != 7:
        error = "Something bad happened."
        return render_all_or_json('league_error.html', {'error': error})

    g.dbd.execute('SELECT pa.player_id, pa.name, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, AVG(ps.minutes) as minutes, AVG(ps.points) as points, AVG(ps.offensive_rebounds + ps.defensive_rebounds) as rebounds, AVG(ps.assists) as assists, pa.contract_amount/1000.0*(1+pa.free_agent_times_asked/10) as contract_amount, pa.contract_expiration FROM %s_player_attributes as pa LEFT OUTER JOIN %s_negotiation as n ON pa.player_id = n.player_id LEFT OUTER JOIN %s_player_ratings as pr ON pa.player_id = pr.player_id LEFT OUTER JOIN %s_player_stats as ps ON ps.season = %s AND ps.is_playoffs = 0 AND pa.player_id = ps.player_id WHERE pa.team_id = -1 AND n.resigning = 1 GROUP BY pa.player_id', (g.season, g.league_id, g.league_id, g.league_id, g.league_id, g.season))

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
            team_amount_new = int(float(request.form['team_amount'])*1000)
            team_years_new = int(request.form['team_years'])
            contract_negotiation.offer(player_id, team_amount_new, team_years_new)
    else:
        # If there is no active negotiation with this player_id, create it
        g.db.execute('SELECT 1 FROM %s_negotiation WHERE player_id = %s', (g.league_id, player_id))
        if not g.db.rowcount:
            error = contract_negotiation.new(player_id)
            if error:
                return render_all_or_json('league_error.html', {'error': error})

    g.db.execute('SELECT team_amount, team_years, player_amount, player_years, resigning FROM %s_negotiation WHERE player_id = %s', (g.league_id, player_id))
    team_amount, team_years, player_amount, player_years, resigning = g.db.fetchone()

    player_amount /= 1000.0
    team_amount /= 1000.0
    player_expiration = player_years + g.season
    # Adjust to account for in-season signings
    if g.phase <= 2:
        player_expiration -= 1

    g.dbd.execute('SELECT pa.player_id, pa.name, pr.overall, pr.potential FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.player_id = %s', (g.league_id, g.league_id, player_id))
    player = g.dbd.fetchone()

    salary_cap = g.salary_cap / 1000.0
    g.db.execute('SELECT CONCAT(region, " ", name) FROM %s_team_attributes WHERE team_id = %s AND season = %s', (g.league_id, g.user_team_id, g.season))
    team_name, = g.db.fetchone()

    payroll = get_payroll(g.user_team_id)
    payroll /= 1000.0

    return render_all_or_json('negotiation.html', {'team_amount': team_amount, 'team_years': team_years, 'player_amount': player_amount, 'player_years': player_years, 'player_expiration': player_expiration, 'resigning': resigning, 'player': player, 'salary_cap': salary_cap, 'team_name': team_name, 'payroll': payroll})

# Utility views

@app.route('/<int:league_id>/box_score')
@league_crap_ajax
def box_score():
    game_id = request.args.get('game_id', None, type=int)

    teams = []
    g.dbd.execute('SELECT * FROM %s_team_stats WHERE game_id = %s', (g.league_id, game_id))
    for row in g.dbd.fetchall():
        teams.append(row)

        g.db.execute('SELECT region, name, abbreviation FROM %s_team_attributes WHERE team_id = %s', (g.league_id, teams[-1]['team_id']))
        teams[-1]['region'], teams[-1]['name'], teams[-1]['abbreviation'] = g.db.fetchone()

        g.dbd.execute('SELECT name, position, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, offensive_rebounds + defensive_rebounds AS rebounds, assists, turnovers, steals, blocks, personal_fouls, points FROM %s_player_attributes as pa, %s_player_stats as ps WHERE pa.player_id = ps.player_id AND ps.game_id = %s AND pa.team_id = %s ORDER BY starter DESC, minutes DESC', (g.league_id, g.league_id, game_id, teams[-1]['team_id']))
        teams[-1]['players'] = g.dbd.fetchall()

        # Total rebounds
        teams[-1]['rebounds'] = teams[-1]['offensive_rebounds'] + teams[-1]['defensive_rebounds']

    # Who won?
    if teams[0]['points'] > teams[1]['points']:
        won_lost = {'won_points': teams[0]['points'], 'won_region': teams[0]['region'], 'won_name': teams[0]['name'], 'won_abbreviation': teams[0]['abbreviation'], 'lost_points': teams[1]['points'], 'lost_region': teams[1]['region'], 'lost_name': teams[1]['name'], 'lost_abbreviation': teams[1]['abbreviation']}
    else:
        won_lost = {'won_points': teams[1]['points'], 'won_region': teams[1]['region'], 'won_name': teams[1]['name'], 'won_abbreviation': teams[1]['abbreviation'], 'lost_points': teams[0]['points'], 'lost_region': teams[0]['region'], 'lost_name': teams[0]['name'], 'lost_abbreviation': teams[0]['abbreviation']}

    return render_template('box_score.html', teams=teams, **won_lost)

@app.route('/<int:league_id>/game_log_list')
@league_crap_ajax
def game_log_list():
    season = request.args.get('season', None, type=int)
    abbreviation = request.args.get('abbreviation', None, type=str)

    season = validate_season(season)
    team_id, abbreviation = validate_abbreviation(abbreviation)

    g.dbd.execute('SELECT game_id, home, (SELECT abbreviation FROM %s_team_attributes WHERE team_id = opponent_team_id AND season = %s) as opponent_abbreviation, won, points, opponent_points FROM %s_team_stats WHERE team_id = %s AND season = %s', (g.league_id, season, g.league_id, team_id, season))
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

@app.route('/<int:league_id>/draft/until_user_or_end', methods=['POST'])
@league_crap_ajax
def draft_until_user_or_end():
    player_ids = draft.until_user_or_end()

    done = False
    if g.phase == 6:
        done = True

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
        g.db.execute('SELECT team_id FROM %s_player_attributes WHERE player_id = %s', (g.league_id, player_id))
        team_id, = g.db.fetchone()
        if team_id == g.user_team_id:  # Don't let the user update CPU-controlled rosters
            g.db.execute('UPDATE %s_player_ratings SET roster_position = %s WHERE player_id = %s', (g.league_id, roster_position, player_id))
            roster_position += 1

    return 'fuck'






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
        g.db.execute('SELECT team_id FROM %s_team_attributes WHERE season = %s AND abbreviation = %s', (g.league_id, g.season, abbreviation))
        if g.db.rowcount == 1:
            team_id, = g.db.fetchone()

    # If no valid abbreviation was given, default to the user's team
    if not team_id:
        team_id = g.user_team_id
        g.db.execute('SELECT abbreviation FROM %s_team_attributes WHERE season = %s AND team_id = %s', (g.league_id, g.season, team_id))
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
