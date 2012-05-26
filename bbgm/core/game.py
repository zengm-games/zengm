import httplib, urllib
import math
import MySQLdb
import random
import sqlite3
import time

from flask import g, url_for

from bbgm import app
from bbgm.core import game_sim, season, play_menu
from bbgm.util import free_agents_auto_sign, free_agents_decrease_demands, lock, fast_random, request_context_globals
import bbgm.util.const as c

class Game:
    def load(self, results, is_playoffs):
        # Retrieve stats
        self.team = results['team']
        self.is_playoffs = is_playoffs
        self.id = results['game_id']
        self.home = [True, False]

        # What is the attendance of the game?
        r = g.dbex('SELECT won+lost, 1.0*won/(won + lost) FROM team_attributes WHERE season = :season AND (team_id = :team_id_home OR team_id = :team_id_away)', season=g.season, team_id_home=self.team[0]['id'], team_id_away=self.team[1]['id'])
        games_played, winp = r.fetchone()
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
            r = g.dbex('SELECT ld.conference_id, ta.division_id FROM team_attributes as ta, league_divisions as ld WHERE ta.team_id = :team_id AND ta.season = :season AND ta.division_id = ld.division_id', team_id=self.team[t]['id'], season=g.season)
            row = r.fetchone()
            conference_id[t] = row[0]
            division_id[t] = row[1]
        if conference_id[0] == conference_id[1]:
            self.same_conference = True
        if division_id[0] == division_id[1]:
            self.same_division = True

    def write_stats(self):
        # Record who the starters are
        for t in range(2):
            r = g.dbex('SELECT player_id FROM player_attributes WHERE team_id = :team_id ORDER BY roster_position ASC LIMIT 5', team_id=self.team[t]['id'])
            for starter_id, in r.fetchall():
                for p in xrange(len(self.team[t]['player'])):
                    if self.team[t]['player'][p]['id'] == starter_id:
                        self.team[t]['player'][p]['stat']['starter'] = 1

        # Player stats and team stats
        for t in range(2):
            self.write_team_stats(t)
            for p in xrange(len(self.team[t]['player'])):
                self.write_player_stats(t, p)

    def write_player_stats(self, t, p):
        query = 'INSERT INTO player_stats (player_id, team_id, game_id, season, is_playoffs, starter, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, assists, turnovers, steals, blocks, personal_fouls, points) VALUES(:player_id, :team_id, :game_id, :season, :is_playoffs, :starter, :minutes, :field_goals_made, :field_goals_attempted, :three_pointers_made, :three_pointers_attempted, :free_throws_made, :free_throws_attempted, :offensive_rebounds, :defensive_rebounds, :assists, :turnovers, :steals, :blocks, :personal_fouls, :points)'
        params = {'player_id': self.team[t]['player'][p]['id'], 'team_id': self.team[t]['id'], 'game_id': self.id, 'season': g.season, 'is_playoffs': self.is_playoffs, 'starter': self.team[t]['player'][p]['stat']['starter'], 'minutes': int(round(self.team[t]['player'][p]['stat']['minutes'])), 'field_goals_made': self.team[t]['player'][p]['stat']['field_goals_made'], 'field_goals_attempted': self.team[t]['player'][p]['stat']['field_goals_attempted'], 'three_pointers_made': self.team[t]['player'][p]['stat']['three_pointers_made'], 'three_pointers_attempted': self.team[t]['player'][p]['stat']['three_pointers_attempted'], 'free_throws_made': self.team[t]['player'][p]['stat']['free_throws_made'], 'free_throws_attempted': self.team[t]['player'][p]['stat']['free_throws_attempted'], 'offensive_rebounds': self.team[t]['player'][p]['stat']['offensive_rebounds'], 'defensive_rebounds': self.team[t]['player'][p]['stat']['defensive_rebounds'], 'assists': self.team[t]['player'][p]['stat']['assists'], 'turnovers': self.team[t]['player'][p]['stat']['turnovers'], 'steals': self.team[t]['player'][p]['stat']['steals'], 'blocks': self.team[t]['player'][p]['stat']['blocks'], 'personal_fouls': self.team[t]['player'][p]['stat']['personal_fouls'], 'points': self.team[t]['player'][p]['stat']['points']}
        g.dbex(query, **params)

    def write_team_stats(self, t):
        if t == 0:
            t2 = 1
        else:
            t2 = 0
        if self.team[t]['stat']['points'] > self.team[t2]['stat']['points']:
            won = True
            if self.is_playoffs and t == 0:
                g.dbex('UPDATE active_playoff_series SET won_home = won_home + 1 WHERE team_id_home = :team_id_home AND team_id_away = :team_id_away', team_id_home=self.team[t]['id'], team_id_away=self.team[t2]['id'])
            elif self.is_playoffs:
                g.dbex('UPDATE active_playoff_series SET won_away = won_away + 1 WHERE team_id_home = :team_id_home AND team_id_away = :team_id_away', team_id_home=self.team[t2]['id'], team_id_away=self.team[t]['id'])
        else:
            won = False

        # Only pay player salaries for regular season games.
        if not self.is_playoffs:
            r = g.dbex('SELECT SUM(contract_amount) * 1000 / 82 FROM released_players_salaries WHERE team_id = :team_id', team_id=self.team[t]['id'])
            cost_released, = r.fetchone()
            r = g.dbex('SELECT SUM(contract_amount) * 1000 / 82 FROM player_attributes WHERE team_id = :team_id', team_id=self.team[t]['id'])
            cost, = r.fetchone()
            if cost_released:
                cost += cost_released
        else:
            cost = 0
        g.dbex('UPDATE team_attributes SET cash = cash + :revenue - :cost WHERE season = :season AND team_id = :team_id', revenue=g.ticket_price * self.attendance, cost=cost, season=g.season, team_id=self.team[t]['id'])

        query = 'INSERT INTO team_stats (team_id, opponent_team_id, game_id, season, is_playoffs, won, home, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, assists, turnovers, steals, blocks, personal_fouls, points, opponent_points, attendance, cost) VALUES (:team_id, :opponent_team_id, :game_id, :season, :is_playoffs, :won, :home, :minutes, :field_goals_made, :field_goals_attempted, :three_pointers_made, :three_pointers_attempted, :free_throws_made, :free_throws_attempted, :offensive_rebounds, :defensive_rebounds, :assists, :turnovers, :steals, :blocks, :personal_fouls, :points, :opponent_points, :attendance, :cost)'
        params = {'team_id': self.team[t]['id'], 'opponent_team_id': self.team[t2]['id'], 'game_id': self.id, 'season': g.season, 'is_playoffs': self.is_playoffs, 'won': won, 'home': self.home[t], 'minutes': int(round(self.team[t]['stat']['minutes'])), 'field_goals_made': self.team[t]['stat']['field_goals_made'], 'field_goals_attempted': self.team[t]['stat']['field_goals_attempted'], 'three_pointers_made': self.team[t]['stat']['three_pointers_made'], 'three_pointers_attempted': self.team[t]['stat']['three_pointers_attempted'], 'free_throws_made': self.team[t]['stat']['free_throws_made'], 'free_throws_attempted': self.team[t]['stat']['free_throws_attempted'], 'offensive_rebounds': self.team[t]['stat']['offensive_rebounds'], 'defensive_rebounds': self.team[t]['stat']['defensive_rebounds'], 'assists': self.team[t]['stat']['assists'], 'turnovers': self.team[t]['stat']['turnovers'], 'steals': self.team[t]['stat']['steals'], 'blocks': self.team[t]['stat']['blocks'], 'personal_fouls': self.team[t]['stat']['personal_fouls'], 'points': self.team[t]['stat']['points'], 'opponent_points': self.team[t2]['stat']['points'], 'attendance': self.attendance, 'cost': cost}
        g.dbex(query, **params)

        if won and not self.is_playoffs:
            g.dbex('UPDATE team_attributes SET won = won + 1 WHERE team_id = :team_id AND season = :season', team_id=self.team[t]['id'], season=g.season)
            if self.same_division:
                g.dbex('UPDATE team_attributes SET won_div = won_div + 1, won_conf = won_conf + 1 WHERE team_id = :team_id AND season = :season', team_id=self.team[t]['id'], season=g.season)
            elif self.same_conference:
                g.dbex('UPDATE team_attributes SET won_conf = won_conf + 1 WHERE team_id = :team_id AND season = :season', team_id=self.team[t]['id'], season=g.season)
        elif not self.is_playoffs:
            g.dbex('UPDATE team_attributes SET lost = lost + 1 WHERE team_id = :team_id AND season = :season', team_id=self.team[t]['id'], season=g.season)
            if self.same_division:
                g.dbex('UPDATE team_attributes SET lost_div = lost_div + 1, lost_conf = lost_conf + 1 WHERE team_id = :team_id AND season = :season', team_id=self.team[t]['id'], season=g.season)
            elif self.same_conference:
                g.dbex('UPDATE team_attributes SET lost_conf = lost_conf + 1 WHERE team_id = :team_id AND season = :season', team_id=self.team[t]['id'], season=g.season)


def team(team_id):
    """Returns a dict containing the minimal information about a team needed to
    simulate a game.
    """
    t = {'id': team_id, 'defense': 0, 'pace': 0, 'stat': {}, 'player': []}

    r = g.dbex('SELECT player_id FROM player_attributes WHERE team_id = :team_id ORDER BY roster_position ASC', team_id=team_id)
    for row in r.fetchall():
        t['player'].append(player(row[0]))

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


def player(player_id):
    """Returns a dict containing the minimal information about a player needed
    to simulate a game.
    """
    p = {'id': player_id, 'overall_rating': 0, 'stat': {}, 'composite_rating': {}}

    r = g.dbex('SELECT overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, '
            'shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, '
            'passing, rebounding FROM player_ratings WHERE player_id = :player_id AND season = :season', player_id=p['id'], season=g.season)
    rating = r.fetchone()

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

def save_results(results, is_playoffs):
    """Convenience function to save game stats."""
    r = g.dbex('SELECT in_progress_timestamp FROM schedule WHERE game_id = :game_id', game_id=results['game_id'])
    in_progress_timestamp, = r.fetchone()
    if in_progress_timestamp > 0:
        game = Game()
        game.load(results, is_playoffs)
        game.write_stats()
        g.dbex('DELETE FROM schedule WHERE game_id = :game_id', game_id=results['game_id'])
        app.logger.debug('Saved results for game %d' % (results['game_id'],))
    else:
        app.logger.debug('Ignored stale results for game %d' % (results['game_id'],))

def play(num_days, start=False):
    """Play num_days days worth of games. If start is True, then this is
    starting a new series of games. If not, then it's continuing a simulation.
    """

    teams = []
    schedule = []
    playoffs_continue = False
    url = None

    # If this is a request to start a new simulation... are we allowed to do
    # that? If so, set the lock and update the play menu
    if start:
        print 'hi', lock.can_start_games()
        if lock.can_start_games():
            lock.set_games_in_progress(True)
            play_menu.refresh_options()
        else:
            # If not allowed to start games, don't
            return teams, schedule, playoffs_continue, url

    if num_days > 0:
        # If the user wants to stop the simulation, then stop the simulation
        r = g.dbex('SELECT stop_games FROM game_attributes WHERE season = :season', season=g.season)
        stop_games, = r.fetchone()
        if stop_games:
            g.dbex('UPDATE game_attributes SET stop_games = 0 WHERE season = :season', season=g.season)

        # If we didn't just stop games, let's play
        # Or, if we are starting games (and already passed the lock above),
        # continue even if stop_games was just seen
        if start or not stop_games:
            # Check if it's the playoffs and do some special stuff if it is or isn't
            if g.phase == c.PHASE_PLAYOFFS:
                num_active_teams = season.new_schedule_playoffs_day()

                # If season.new_schedule_playoffs_day didn't move the phase to 4, then
                # the playoffs are still happening.
                if g.phase == c.PHASE_PLAYOFFS:
                    playoffs_continue = True
            else:
                num_active_teams = g.num_teams

                # Decrease free agent demands and let AI teams sign them
                free_agents_decrease_demands()
                free_agents_auto_sign()

            play_menu.set_status('Playing games (%d days remaining)...' % (num_days,))
            # Create schedule and team lists for today, to be sent to the client
            schedule = season.get_schedule(num_active_teams / 2)
            team_ids_today = []
            for game in schedule:
                g.dbex('UPDATE schedule SET in_progress_timestamp = :in_progress_timestamp WHERE game_id = :game_id', in_progress_timestamp=int(time.time()), game_id=game['game_id'])
                team_ids_today.append(game['home_team_id'])
                team_ids_today.append(game['away_team_id'])
#                team_ids_today = list(set(team_ids_today))  # Unique list
            teams = []
            for team_id in xrange(30):
                # Only send team data for today's active teams
                if team_id in team_ids_today:
                    teams.append(team(team_id))
                else:
                    teams.append({'id': team_id})

    # If this is the last day, update play menu
    if num_days == 0 or (len(schedule) == 0 and not playoffs_continue):
        play_menu.set_status('Idle')
        lock.set_games_in_progress(False)
        play_menu.refresh_options()
        # Check to see if the season is over
        r = g.dbex('SELECT game_id FROM schedule LIMIT 1')
        if g.db.rowcount == 0 and g.phase < c.PHASE_PLAYOFFS:
            season.new_phase(c.PHASE_PLAYOFFS)  # Start playoffs
            url = url_for('history', league_id=g.league_id)

    return teams, schedule, playoffs_continue, url
