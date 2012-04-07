from jinja2.utils import concat
import json
import random
import time

from flask import jsonify, render_template, url_for, request, session, redirect, g
from flask.globals import _request_ctx_stack

from bbgm import app
from bbgm.core import game, play_menu, season
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
    print values
    g.league_id = values.pop('league_id', None)

@app.route('/<int:league_id>')
@league_crap
def league_dashboard():
    g.dbd.execute('SELECT team_id, region, name FROM teams ORDER BY team_id ASC')
    teams = g.dbd.fetchall()

    return render_all_or_json('league_dashboard.html')

@app.route('/<int:league_id>/player_ratings')
@league_crap
def player_ratings():
    g.dbd.execute('SELECT pa.player_id, pa.team_id, pa.name, (SELECT abbreviation FROM %s_team_attributes WHERE team_id = pa.team_id) as team_abbreviation, pa.position, %s - pa.born_date as age, pr.overall, pr.potential, pr.height, pr.strength, pr.speed, pr.jumping, pr.endurance, pr.shooting_inside, pr.shooting_layups, pr.shooting_free_throws, pr.shooting_two_pointers, pr.shooting_three_pointers, pr.blocks, pr.steals, pr.dribbling, pr.passing, pr.rebounding FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id', (g.league_id, g.season, g.league_id, g.league_id))
    players = g.dbd.fetchall()

    return render_all_or_json('player_ratings.html', {'players': players})

@app.route('/<int:league_id>/player_stats')
@league_crap
def player_stats():
    g.dbd.execute('SELECT pa.player_id, pa.team_id, pa.name, ta.abbreviation, pa.position, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS minutes, AVG(ps.field_goals_made) AS field_goals_made, AVG(ps.field_goals_attempted) AS field_goals_attempted, 100*AVG(ps.field_goals_made/ps.field_goals_attempted) AS field_goal_percentage, AVG(ps.three_pointers_made) AS three_pointers_made, AVG(ps.three_pointers_attempted) AS three_pointers_attempted, 100*AVG(ps.three_pointers_made/ps.three_pointers_attempted) AS three_point_percentage, AVG(ps.free_throws_made) AS free_throws_made, AVG(ps.free_throws_attempted) AS free_throws_attempted, 100*AVG(ps.free_throws_made/ps.free_throws_attempted) AS free_throw_percentage, AVG(ps.offensive_rebounds) AS offensive_rebounds, AVG(ps.defensive_rebounds) AS defensive_rebounds, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rebounds, AVG(ps.assists) AS assists, AVG(ps.turnovers) AS turnovers, AVG(ps.steals) AS steals, AVG(ps.blocks) AS blocks, AVG(ps.personal_fouls) AS personal_fouls, AVG(ps.points) AS points FROM %s_player_attributes as pa, %s_player_stats as ps, %s_team_attributes as ta WHERE pa.player_id = ps.player_id AND ps.season = %s AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.player_id', (g.league_id, g.league_id, g.league_id, g.season))
    players = g.dbd.fetchall()

    # Don't pass blank values where floats are expected by the template
    for i in xrange(len(players)):
        for key in players[i].keys():
            if not players[i][key]:
                players[i][key] = 0

    return render_all_or_json('player_stats.html', {'players': players})

# Change to POST (with CSRF protection) later
@app.route('/<int:league_id>/play_games/<amount>')
@league_crap
def play_games(amount):
    if amount == 'day':
        num_days = 1
    elif amount == 'week':
        num_days = 7
    elif amount == 'month':
        num_days = 30
    elif amount == 'until_playoffs':
        g.db.execute('SELECT COUNT(*)/%s FROM %s_team_stats WHERE season = %s', (g.num_teams, g.league_id, g.season))
        row = g.db.fetchone()
        num_days = g.season_length - row[0]  # Number of days remaining
    game.play(num_days)
    return '%s days! fuck, this should be done asynchronously via POST and then show the progress.. um.. somewhere' % (num_days,)

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
@league_crap
def standings():
    conferences = []
    g.db.execute('SELECT conference_id, name FROM %s_league_conferences ORDER BY conference_id ASC', (g.league_id,))
    for conference_id, conference_name in g.db.fetchall():
        conferences.append({'id': conference_id, 'name': conference_name, 'divisions': [], 'standings': ''})
        g.dbd.execute('SELECT * FROM %s_team_attributes as ta WHERE ta.division_id IN (SELECT ld.division_id FROM %s_league_divisions as ld WHERE ld.conference_id = %s) AND season = %s ORDER BY won/(won+lost) DESC', (g.league_id, g.league_id, conference_id, g.season))
        conferences[-1]['teams'] = g.dbd.fetchall()

        g.db.execute('SELECT division_id, name FROM %s_league_divisions WHERE conference_id = %s ORDER BY name ASC', (g.league_id, conference_id))
        for division_id, division_name in g.db.fetchall():
            g.dbd.execute('SELECT * FROM %s_team_attributes WHERE division_id = %s AND season = %s ORDER BY won/(won+lost) DESC', (g.league_id, division_id, g.season))
            conferences[-1]['divisions'].append({'name': division_name})
            conferences[-1]['divisions'][-1]['teams'] = g.dbd.fetchall()

    return render_all_or_json('standings.html', {'conferences': conferences})

@app.route('/<int:league_id>/game_log')
@app.route('/<int:league_id>/game_log/<int:season>')
@app.route('/<int:league_id>/game_log/<int:season>/<abbreviation>')
@league_crap
def game_log(season=None, abbreviation=None):
    season = validate_season(season)
    team_id, abbreviation = validate_abbreviation(abbreviation)

    g.dbd.execute('SELECT abbreviation FROM %s_team_attributes WHERE season = %s ORDER BY team_id ASC', (g.league_id, g.season))
    teams = g.dbd.fetchall()

    return render_all_or_json('game_log.html', {'abbreviation': abbreviation, 'teams': teams})

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
    bbgm.core.play_menu.set_options, which push updates to the client.
    """
    play_menu.set_status()
    play_menu.set_options()

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
    if request.args.get('json', False, type=bool):
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
