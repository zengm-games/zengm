import httplib, urllib
import math
import MySQLdb
import random
import sqlite3
import time

from flask import g

from bbgm import app
from bbgm.core import game_sim, season, play_menu
from bbgm.util import auto_sign_free_agents, lock, fast_random, request_context_globals


class Game:
    def load(self, results, is_playoffs):
        # Retrieve stats
        self.team = results['team']
        self.is_playoffs = is_playoffs
        self.id = results['game_id']
        self.home = [True, False]

        # What is the attendance of the game?
        g.db.execute('SELECT won+lost, 1.0*won/(won + lost) FROM %s_team_attributes WHERE season = %s AND (team_id = %s OR team_id = %s)', (g.league_id, g.season, self.team[0]['id'], self.team[1]['id']))
        games_played, winp = g.db.fetchone()
        if games_played < 5:
            self.attendance = fast_random.gauss(22000 + games_played * 1000, 1000)
        else:
            self.attendance = fast_random.gauss(winp * 36000, 1000)
        if self.attendance > 25000:
            self.attendance = 25000
        elif self.attendance < 10000:
            self.attendance = 10000

        # Are the teams in the same conference/division?
        self.same_conference = False
        self.same_division = False
        conference_id = [-1, -1]
        division_id = [-1, -1]
        for t in range(2):
            g.db.execute('SELECT ld.conference_id, ta.division_id FROM %s_team_attributes as ta, %s_league_divisions as ld WHERE ta.team_id = %s AND ta.season = %s AND ta.division_id = ld.division_id', (g.league_id, g.league_id, self.team[t]['id'], g.season))
            row = g.db.fetchone()
            conference_id[t] = row[0]
            division_id[t] = row[1]
        if conference_id[0] == conference_id[1]:
            self.same_conference = True
        if division_id[0] == division_id[1]:
            self.same_division = True

    def write_stats(self):
        # Record who the starters are
        for t in range(2):
            g.db.execute('SELECT pa.player_id FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = %s ORDER BY pr.roster_position ASC LIMIT 5', (g.league_id, g.league_id, self.team[t]['id']))
            for starter_id, in g.db.fetchall():
                for p in xrange(len(self.team[t]['player'])):
                    if self.team[t]['player'][p]['id'] == starter_id:
                        self.team[t]['player'][p]['stat']['starter'] = 1

        # Player stats and team stats
        for t in range(2):
            self.write_team_stats(t)
            for p in xrange(len(self.team[t]['player'])):
                self.write_player_stats(t, p)

    def write_player_stats(self, t, p):
        query = 'INSERT INTO %s_player_stats \
                 (player_id, team_id, game_id, season, is_playoffs, starter, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, assists, turnovers, steals, blocks, personal_fouls, points) \
                 VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'
        g.db.execute(query, (g.league_id, self.team[t]['player'][p]['id'], self.team[t]['id'], self.id, g.season, self.is_playoffs, self.team[t]['player'][p]['stat']['starter'], int(round(self.team[t]['player'][p]['stat']['minutes'])), self.team[t]['player'][p]['stat']['field_goals_made'], self.team[t]['player'][p]['stat']['field_goals_attempted'], self.team[t]['player'][p]['stat']['three_pointers_made'], self.team[t]['player'][p]['stat']['three_pointers_attempted'], self.team[t]['player'][p]['stat']['free_throws_made'], self.team[t]['player'][p]['stat']['free_throws_attempted'], self.team[t]['player'][p]['stat']['offensive_rebounds'], self.team[t]['player'][p]['stat']['defensive_rebounds'], self.team[t]['player'][p]['stat']['assists'], self.team[t]['player'][p]['stat']['turnovers'], self.team[t]['player'][p]['stat']['steals'], self.team[t]['player'][p]['stat']['blocks'], self.team[t]['player'][p]['stat']['personal_fouls'], self.team[t]['player'][p]['stat']['points']))

    def write_team_stats(self, t):
        if t == 0:
            t2 = 1
        else:
            t2 = 0
        if self.team[t]['stat']['points'] > self.team[t2]['stat']['points']:
            won = True
            if self.is_playoffs and t == 0:
                g.db.execute('UPDATE %s_active_playoff_series SET won_home = won_home + 1 WHERE team_id_home = %s AND team_id_away = %s', (g.league_id, self.team[t]['id'], self.team[t2]['id']))
            elif self.is_playoffs:
                g.db.execute('UPDATE %s_active_playoff_series SET won_away = won_away + 1 WHERE team_id_home = %s AND team_id_away = %s', (g.league_id, self.team[t2]['id'], self.team[t]['id']))
        else:
            won = False

        # Only pay player salaries for regular season games.
        if not self.is_playoffs:
            g.db.execute('SELECT SUM(contract_amount) * 1000 / 82 FROM %s_released_players_salaries WHERE team_id = %s', (g.league_id, self.team[t]['id']))
            cost_released, = g.db.fetchone()
            g.db.execute('SELECT SUM(contract_amount) * 1000 / 82 FROM %s_player_attributes WHERE team_id = %s', (g.league_id, self.team[t]['id']))
            cost, = g.db.fetchone()
            if cost_released:
                cost += cost_released
        else:
            cost = 0
        g.db.execute('UPDATE %s_team_attributes SET cash = cash + %s - %s WHERE season = %s AND team_id = %s', (g.league_id, g.ticket_price * self.attendance, cost, g.season, self.team[t]['id']))

        query = 'INSERT INTO %s_team_stats \
                 (team_id, opponent_team_id, game_id, season, is_playoffs, won, home, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, assists, turnovers, steals, blocks, personal_fouls, points, opponent_points, attendance, cost) \
                 VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'
        g.db.execute(query, (g.league_id, self.team[t]['id'], self.team[t2]['id'], self.id, g.season, self.is_playoffs, won, self.home[t], int(round(self.team[t]['stat']['minutes'])), self.team[t]['stat']['field_goals_made'], self.team[t]['stat']['field_goals_attempted'], self.team[t]['stat']['three_pointers_made'], self.team[t]['stat']['three_pointers_attempted'], self.team[t]['stat']['free_throws_made'], self.team[t]['stat']['free_throws_attempted'], self.team[t]['stat']['offensive_rebounds'], self.team[t]['stat']['defensive_rebounds'], self.team[t]['stat']['assists'], self.team[t]['stat']['turnovers'], self.team[t]['stat']['steals'], self.team[t]['stat']['blocks'], self.team[t]['stat']['personal_fouls'], self.team[t]['stat']['points'], self.team[t2]['stat']['points'], self.attendance, cost))
        if won and not self.is_playoffs:
            g.db.execute('UPDATE %s_team_attributes SET won = won + 1 WHERE team_id = %s AND season = %s', (g.league_id, self.team[t]['id'], g.season))
            if self.same_division:
                g.db.execute('UPDATE %s_team_attributes SET won_div = won_div + 1, won_conf = won_conf + 1 WHERE team_id = %s AND season = %s', (g.league_id, self.team[t]['id'], g.season))
            elif self.same_conference:
                g.db.execute('UPDATE %s_team_attributes SET won_conf = won_conf + 1 WHERE team_id = %s AND season = %s', (g.league_id, self.team[t]['id'], g.season))
        elif not self.is_playoffs:
            g.db.execute('UPDATE %s_team_attributes SET lost = lost + 1 WHERE team_id = %s AND season = %s', (g.league_id, self.team[t]['id'], g.season))
            if self.same_division:
                g.db.execute('UPDATE %s_team_attributes SET lost_div = lost_div + 1, lost_conf = lost_conf + 1 WHERE team_id = %s AND season = %s', (g.league_id, self.team[t]['id'], g.season))
            elif self.same_conference:
                g.db.execute('UPDATE %s_team_attributes SET lost_conf = lost_conf + 1 WHERE team_id = %s AND season = %s', (g.league_id, self.team[t]['id'], g.season))


def team(team_id):
    """Returns a dict containing the minimal information about a team needed to
    simulate a game.
    """
    t = {'id': team_id, 'defense': 0, 'pace': 0, 'stat': {}, 'player': []}

    g.db.execute('SELECT pa.player_id FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = %s ORDER BY pr.roster_position ASC', (g.league_id, g.league_id, team_id))
    for row in g.db.fetchall():
        t['player'].append(player(row[0], g.league_id, g.dbd))

    # Number of players to factor into pace and defense rating calculation
    n_players = len(t['player'])
    if n_players > 7:
        n_players = 7

    # Would be better if these were scaled by average minutes played and endurance
    t['pace'] = sum([t['player'][i]['composite_rating']['pace'] for i in xrange(n_players)]) / 7
    t['defense'] = sum([t['player'][i]['composite_rating']['defense'] for i in xrange(n_players)]) / 7 # 0 to 0.5
    t['defense'] /= 4 # This gives the percentage points subtracted from the other team's normal FG%


    t['stat'] = dict(minutes=0, field_goals_made=0, field_goals_attempted=0,
                three_pointers_made=0, three_pointers_attempted=0,
                free_throws_made=0, free_throws_attempted=0,
                offensive_rebounds=0, defensive_rebounds=0, assists=0,
                turnovers=0, steals=0, blocks=0, personal_fouls=0,
                points=0)

    return t


def player(player_id, league_id, dbd):
    """Returns a dict containing the minimal information about a player needed
    to simulate a game.
    """
    p = {'id': player_id, 'overall_rating': 0, 'stat': {}, 'composite_rating': {}}

    dbd.execute('SELECT overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, '
            'shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, '
            'passing, rebounding FROM %s_player_ratings WHERE player_id = %s', (league_id, p['id']))
    rating = dbd.fetchone()

    p['overall_rating'] = rating['overall']

    p['composite_rating']['pace'] = _composite(90, 140, rating, ['speed', 'jumping', 'shooting_layups',
                                                    'shooting_three_pointers', 'steals', 'dribbling',
                                                    'passing'], random=False)
    p['composite_rating']['shot_ratio'] = _composite(0, 0.5, rating, ['shooting_inside', 'shooting_layups',
                                                          'shooting_two_pointers', 'shooting_three_pointers'])
    p['composite_rating']['assist_ratio'] = _composite(0, 0.5, rating, ['dribbling', 'passing', 'speed'])
    p['composite_rating']['turnover_ratio'] = _composite(0, 0.5, rating, ['dribbling', 'passing', 'speed'],
                                                              inverse=True)
    p['composite_rating']['field_goal_percentage'] = _composite(0.38, 0.68, rating, ['height', 'jumping',
                                                                     'shooting_inside', 'shooting_layups',
                                                                     'shooting_two_pointers',
                                                                     'shooting_three_pointers'])
    p['composite_rating']['free_throw_percentage'] = _composite(0.65, 0.9, rating, ['shooting_free_throws'])
    p['composite_rating']['three_pointer_percentage'] = _composite(0, 0.45, rating, ['shooting_three_pointers'])
    p['composite_rating']['rebound_ratio'] = _composite(0, 0.5, rating, ['height', 'strength', 'jumping',
                                                             'rebounding'])
    p['composite_rating']['steal_ratio'] = _composite(0, 0.5, rating, ['speed', 'steals'])
    p['composite_rating']['block_ratio'] = _composite(0, 0.5, rating, ['height', 'jumping', 'blocks'])
    p['composite_rating']['foul_ratio'] = _composite(0, 0.5, rating, ['speed'], inverse=True)
    p['composite_rating']['defense'] = _composite(0, 0.5, rating, ['strength', 'speed'])

    p['stat'] = dict(starter=0, minutes=0, field_goals_made=0, field_goals_attempted=0,
                     three_pointers_made=0, three_pointers_attempted=0,
                     free_throws_made=0, free_throws_attempted=0,
                     offensive_rebounds=0, defensive_rebounds=0, assists=0,
                     turnovers=0, steals=0, blocks=0, personal_fouls=0,
                     points=0, court_time=0, bench_time=0, energy=1)

    return p

def _composite(minval, maxval, rating, components, inverse=False, random=True):
    r = 0.0
    rmax = 0.0
    if inverse:
        sign = -1
        add = -100
    else:
        sign = 1
        add = 0
    for component in components:
        # Sigmoidal transformation
        y = (rating[component] - 70) / 10
        rcomp = y / math.sqrt(1 + pow(y, 2))
        rcomp = (rcomp + 1) * 50
#        rcomp = rating[component]

        r = r + sign * (add + rcomp)
        rmax = rmax + sign * (add + 100)
    # Scale from minval to maxval
    r = r / (100.0 * len(components))  # 0-1
#    r = r / (rmax * len(components))  # 0-1
    r = r * (maxval - minval) + minval  # Min-Max
    # Randomize: Mulitply by a random number from N(1,0.1)
    if random:
        r = fast_random.gauss(1, 0.1) * r
    return r

def sim_wrapper():
    """Asynchonously simulate a day's game, then do some housekeeping before
    moving on to the next day to handle playoff scheduling and free agents.
    """
    schedule = []
    teams = []
    playoffs_continue = False

    # Check if it's the playoffs and do some special stuff if it is
    if g.phase == 3:
        num_active_teams = season.new_schedule_playoffs_day()

        # If season.new_schedule_playoffs_day didn't move the phase to 4, then
        # the playoffs are still happening.
        if g.phase == 3:
            playoffs_continue = True
    else:
        num_active_teams = g.num_teams

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

        # Sign available free agents
        auto_sign_free_agents()

    # If the user wants to stop the simulation, then stop the simulation
    g.db.execute('SELECT stop_games FROM %s_game_attributes WHERE season = %s', (g.league_id, g.season))
    stop_games, = g.db.fetchone()
    if stop_games:
        g.db.execute('UPDATE %s_game_attributes SET stop_games = 0 WHERE season = %s', (g.league_id, g.season))
    else:
        schedule = season.get_schedule(num_active_teams / 2)
        tasks = []
        print len(schedule)
        team_ids_today = []
        for i in range(num_active_teams / 2):
            game = schedule[i]
            g.db.execute('UPDATE %s_schedule SET in_progress_timestamp = %s WHERE game_id = %s', (g.league_id, int(time.time()), game['game_id']))
            team_ids_today.append(game['home_team_id'])
            team_ids_today.append(game['away_team_id'])
        team_ids_today = list(set(team_ids_today))  # Unique list
        teams = []
        for team_id in xrange(30):
            teams.append(team(team_id))

    return teams, schedule, playoffs_continue

def save_results(results, is_playoffs):
    """Convenience function to save game stats."""
    g.db.execute('SELECT in_progress_timestamp FROM %s_schedule WHERE game_id = %s', (g.league_id, results['game_id']))
    in_progress_timestamp, = g.db.fetchone()
    if in_progress_timestamp > 0:
        game = Game()
        game.load(results, is_playoffs)
        game.write_stats()
        g.db.execute('DELETE FROM %s_schedule WHERE game_id = %s', (g.league_id, results['game_id']))
        app.logger.debug('Saved results for game %d' % (results['game_id'],))
    else:
        app.logger.debug('Ignored stale results for game %d' % (results['game_id'],))

def play(num_days, start=False):
    """Play num_days days worth of games. If start is True, then this is
    starting a new series of games. If not, then it's continuing a simulation.
    """

    teams = []
    schedule = []

    # If this is a request to start a new simulation... are we allowed to do
    # that? If so, set the lock and update the play menu
    if start:
        if lock.can_start_games():
            lock.set_games_in_progress(True)
            play_menu.refresh_options()
        else:
            # If not allowed to start games, don't
            return teams, schedule

    if num_days > 0:
        play_menu.set_status('Playing games (%d days remaining)...' % (num_days,))
        [teams, schedule, playoffs_continue] = sim_wrapper()

    # If this is the last day, update play menu
    if num_days == 0 or len(schedule) == 0:
        play_menu.set_status('Idle')
        lock.set_games_in_progress(False)
        play_menu.refresh_options()
        # Check to see if the season is over
        g.db.execute('SELECT game_id FROM %s_schedule LIMIT 1', (g.league_id,))
        if g.db.rowcount == 0 and g.phase < 3:
            season.new_phase(3)  # Start playoffs


    return teams, schedule, playoffs_continue
