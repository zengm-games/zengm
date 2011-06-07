import math
import random
import sqlite3

import common

class Game:
    def play(self, t1, t2, is_playoffs):
        self.team = []
        self.team.append(Team(t1))
        self.team.append(Team(t2))
        self.is_playoffs = is_playoffs
        self.id = random.randint(0, 100000000)
        self.num_possessions = self.get_num_possessions()
        self.season = common.SEASON

        # What is the attendance of the game?
        games_played, winp, = common.DB_CON.execute('SELECT won+lost, won/(won + lost) FROM team_attributes WHERE season = ? AND (team_id = ? OR team_id = ?)', (common.SEASON, self.team[0].id, self.team[1].id)).fetchone()
        if games_played < 5:
            self.attendance = random.gauss(22000 + games_played*1000, 1000)
        else:
            self.attendance = random.gauss(winp*36000, 1000)
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
            row = common.DB_CON.execute('SELECT league_divisions.conference_id, team_attributes.division_id FROM team_attributes, league_divisions WHERE team_attributes.team_id = ? AND team_attributes.season = ? AND team_attributes.division_id = league_divisions.division_id', (self.team[t].id, self.season)).fetchone()
            conference_id[t] = row[0]
            division_id[t] = row[1]
        if conference_id[0] == conference_id[1]:
            self.same_conference = True
        if division_id[0] == division_id[1]:
            self.same_division = True

        # Starting lineups - FIX THIS
        self.players_on_court = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]

        # Simulate the game
        for self.o in range(2):
            self.d = 0 if self.o==1 else 1
            for i in range(self.num_possessions):
                self.update_players_on_court(i)
                if not self.is_turnover():
                    # Shot if there is no turnover
                    ratios = self.rating_array('shot_ratio', self.o)
                    shooter = self.pick_player(ratios)
                    if not self.is_block():
                        if not self.is_free_throw(shooter):
                            if not self.is_made_shot(shooter):
                                self.do_rebound()

    def get_num_possessions(self):
        return 100

    def update_players_on_court(self, possession_num):
        '''
        Update players_on_court, track energy levels, and record the number of
        minutes each player plays. This function is currently VERY SLOW.
        '''

        dt = 48.0/(2*self.num_possessions) # Time elapsed in this possession

        for t in range(2):
            # Overall ratings scaled by fatigue
            overalls = [self.team[t].player[i].rating['overall'] * self.team[t].player[i].stat['energy'] * random.gauss(1, .04) for i in xrange(len(self.team[t].player_ids))]

            # Loop through players on court (in inverse order of current roster position)
            i = 0
            for p in self.players_on_court[t]:
                self.players_on_court[t][i] = p
                # Loop through bench players (in order of current roster position) to see if any should be subbed in)
                for b in xrange(len(self.team[t].player_ids)):
                    if b not in self.players_on_court[t] and self.team[t].player[p].stat['court_time'] > 3 and self.team[t].player[b].stat['bench_time'] > 3 and overalls[b] > overalls[p]:
                        # Substitute player
                        self.players_on_court[t][i] = b
                        self.team[t].player[b].stat['court_time'] = random.gauss(0, 2)
                        self.team[t].player[b].stat['bench_time'] = random.gauss(0, 2)
                        self.team[t].player[p].stat['court_time'] = random.gauss(0, 2)
                        self.team[t].player[p].stat['bench_time'] = random.gauss(0, 2)
                i += 1

            # Update minutes (overall, court, and bench)
            for p in xrange(len(self.team[t].player_ids)):
                if p in self.players_on_court[t]:
                    self.team[t].player[p].record_stat('minutes', dt)
                    self.team[t].player[p].record_stat('court_time', dt)
                    self.team[t].player[p].record_stat('energy', -dt*0.01 )
                    if self.team[t].player[p].stat['energy'] < 0:
                        self.team[t].player[p].stat['energy'] = 0
                else:
                    self.team[t].player[p].record_stat('bench_time', dt)
                    self.team[t].player[p].record_stat('energy', dt*0.2)
                    if self.team[t].player[p].stat['energy'] > 1:
                        self.team[t].player[p].stat['energy'] = 1

    def is_turnover(self):
        if random.random() < 0.1:
            self.do_turnover()
            return True
        else:
            return False

    def is_steal(self):
        if random.random() < 0.7:
            self.do_steal()
            return True
        else:
            return False

    def is_block(self):
        if random.random() < 0.04:
            self.do_block()
            return True
        else:
            return False

    def is_free_throw(self, shooter):
        if random.random() < 0.15:
            self.do_free_throw(shooter, 2)
            return True
        else:
            return False

    def is_made_shot(self, shooter):
        p = self.players_on_court[self.o][shooter]
        self.team[self.o].player[p].record_stat('field_goals_attempted')
        # Three pointer or two pointer
        if self.team[self.o].player[p].composite_rating['three_pointer_percentage'] > 0.25 and random.random() < (0.5 * self.team[self.o].player[p].composite_rating['three_pointer_percentage']):
            self.team[self.o].player[p].record_stat('three_pointers_attempted')
            type = 3
            stat = 'three_pointer_percentage'
        else:
            type = 2
            stat = 'field_goal_percentage'
        # Make or miss
        if random.random() < self.team[self.o].player[p].composite_rating[stat]:
            self.do_made_shot(shooter, type)
            # And 1
            if random.random() < 0.1:
                self.do_free_throw(shooter, 1)
            return True
        else:
            return False

    def is_assist(self):
        if random.random() < 0.6:
            return True
        else:
            return False

    def do_turnover(self):
        ratios = self.rating_array('turnover_ratio', self.o)
        p = self.players_on_court[self.o][self.pick_player(ratios)]
        self.team[self.o].player[p].record_stat('turnovers')
        self.is_steal()

    def do_steal(self):
        ratios = self.rating_array('steal_ratio', self.d)
        p = self.players_on_court[self.d][self.pick_player(ratios)]
        self.team[self.d].player[p].record_stat('steals')

    def do_block(self):
        ratios = self.rating_array('block_ratio', self.d)
        p = self.players_on_court[self.d][self.pick_player(ratios)]
        self.team[self.d].player[p].record_stat('blocks')

    # For and1's, set amount=1.  Else, set amount=2
    def do_free_throw(self, shooter, amount):
        self.do_foul(shooter)
        p = self.players_on_court[self.o][shooter]
        for i in range(amount):
            self.team[self.o].player[p].record_stat('free_throws_attempted');
            if random.random() < self.team[self.o].player[p].composite_rating['free_throw_percentage']:
                self.team[self.o].player[p].record_stat('free_throws_made')
                self.team[self.o].player[p].record_stat('points')

    # Assign a foul to anyone who isn't shooter
    # If fouls == 6, then foul out!
    def do_foul(self, shooter):
        ratios = self.rating_array('foul_ratio', self.d)
        p = self.players_on_court[self.d][self.pick_player(ratios)]
        self.team[self.d].player[p].record_stat('personal_fouls')
        # Foul out: remove from player_ids array, decrement num_players, and then they won't be selected anymore by update_players_on_court()
        #if self.team[self.d].player[p].stat['personal_fouls'] >= 6:

    def do_made_shot(self, shooter, type):
        if self.is_assist():
            ratios = self.rating_array('assist_ratio', self.o)
            p = self.players_on_court[self.o][self.pick_player(ratios, shooter)]
            self.team[self.o].player[p].record_stat('assists')
        p = self.players_on_court[self.o][shooter]
        self.team[self.o].player[p].record_stat('field_goals_made')
        self.team[self.o].player[p].record_stat('points', 2) # 2 points for 2's
        if (type == 3):
            self.team[self.o].player[p].record_stat('three_pointers_made') # Extra point for 3's
            self.team[self.o].player[p].record_stat('points')

    def do_rebound(self):
        if random.random() < 0.8:
            ratios = self.rating_array('rebound_ratio', self.d)
            p = self.players_on_court[self.d][self.pick_player(ratios)]
            self.team[self.d].player[p].record_stat('defensive_rebounds')
        else:
            ratios = self.rating_array('rebound_ratio', self.o)
            p = self.players_on_court[self.o][self.pick_player(ratios)]
            self.team[self.o].player[p].record_stat('offensive_rebounds')

    def rating_array(self, rating, t):
        array = [0, 0, 0, 0, 0]
        for i in range(5):
            p = self.players_on_court[t][i]
            array[i] = self.team[t].player[p].composite_rating[rating]
        return array

    # exempt is_ a player that can't be picked (you can't assis_t your own shot, which is_ the only current use of exempt)
    # The value of exempt is_ an integer from 0 to 4 that represents the index of the player in players_on_court
    # This_ is_ *NOT* the same value as the playerID or the index of the team.player array
    # Yes, that's confusing
    def pick_player(self, ratios, exempt=False):
        if exempt != False:
            ratios[exempt] = 0
        rand = random.random() * (ratios[0] + ratios[1] + ratios[2] + ratios[3] + ratios[4])
        if rand < ratios[0]:
            pick = 0
        elif rand < (ratios[0] + ratios[1]):
            pick = 1
        elif rand < (ratios[0] + ratios[1] + ratios[2]):
            pick = 2
        elif rand < (ratios[0] + ratios[1] + ratios[2] + ratios[3]):
            pick = 3
        else:
            pick = 4
        return pick

    def write_stats(self):
        # Record who the starters are
        for t in range(2):
            query = 'SELECT player_attributes.player_id FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? AND player_ratings.roster_position <= 5'
            for row in common.DB_CON.execute(query, (self.team[t].id,)):
                for p in range(self.team[t].num_players):
                    if self.team[t].player[p].id == row[0]:
                        self.team[t].player[p].record_stat('starter')

        # Player stats and team stats
        for t in range(2):
            self.write_team_stats(t)
            for p in range(self.team[t].num_players):
                self.write_player_stats(t, p)

    def write_player_stats(self, t, p):
        query = 'INSERT INTO player_stats \
                 (player_id, team_id, game_id, season, is_playoffs, starter, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, assists, turnovers, steals, blocks, personal_fouls, points) \
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        common.DB_CON.execute(query, (self.team[t].player[p].id, self.team[t].id, self.id, self.season, self.is_playoffs, self.team[t].player[p].stat['starter'], int(round(self.team[t].player[p].stat['minutes'])), self.team[t].player[p].stat['field_goals_made'], self.team[t].player[p].stat['field_goals_attempted'], self.team[t].player[p].stat['three_pointers_made'], self.team[t].player[p].stat['three_pointers_attempted'], self.team[t].player[p].stat['free_throws_made'], self.team[t].player[p].stat['free_throws_attempted'], self.team[t].player[p].stat['offensive_rebounds'], self.team[t].player[p].stat['defensive_rebounds'], self.team[t].player[p].stat['assists'], self.team[t].player[p].stat['turnovers'], self.team[t].player[p].stat['steals'], self.team[t].player[p].stat['blocks'], self.team[t].player[p].stat['personal_fouls'], self.team[t].player[p].stat['points']))

    def write_team_stats(self, t):
        if t == 0:
            t2 = 1
        else:
            t2 = 0
        if self.team[t].stat['points'] > self.team[t2].stat['points']:
            won = True
            if self.is_playoffs and t==0:
                common.DB_CON.execute('UPDATE active_playoff_series SET won_home = won_home + 1 WHERE team_id_home = ? AND team_id_away = ?', (self.team[t].id, self.team[t2].id))
            elif self.is_playoffs:
                common.DB_CON.execute('UPDATE active_playoff_series SET won_away = won_away + 1 WHERE team_id_home = ? AND team_id_away = ?', (self.team[t2].id, self.team[t].id))
        else:
            won = False

        cost, = common.DB_CON.execute('SELECT SUM(contract_amount)*1000/82 FROM player_attributes WHERE team_id = ?', (self.team[t].id,)).fetchone()
        common.DB_CON.execute('UPDATE team_attributes SET cash = cash + ? - ? WHERE season = ? AND team_id = ?', (common.TICKET_PRICE*self.attendance, cost, common.SEASON, self.team[t].id))

        query = 'INSERT INTO team_stats \
                 (team_id, opponent_team_id, game_id, season, is_playoffs, won, minutes, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, offensive_rebounds, defensive_rebounds, assists, turnovers, steals, blocks, personal_fouls, points, opponent_points, attendance, cost) \
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        common.DB_CON.execute(query, (self.team[t].id, self.team[t2].id, self.id, self.season, self.is_playoffs, won, int(round(self.team[t].stat['minutes'])), self.team[t].stat['field_goals_made'], self.team[t].stat['field_goals_attempted'], self.team[t].stat['three_pointers_made'], self.team[t].stat['three_pointers_attempted'], self.team[t].stat['free_throws_made'], self.team[t].stat['free_throws_attempted'], self.team[t].stat['offensive_rebounds'], self.team[t].stat['defensive_rebounds'], self.team[t].stat['assists'], self.team[t].stat['turnovers'], self.team[t].stat['steals'], self.team[t].stat['blocks'], self.team[t].stat['personal_fouls'], self.team[t].stat['points'], self.team[t2].stat['points'], self.attendance, cost))
        if won and not self.is_playoffs:
            common.DB_CON.execute('UPDATE team_attributes SET won = won + 1 WHERE team_id = ? AND season = ?', (self.team[t].id, self.season))
            if self.same_division:
                common.DB_CON.execute('UPDATE team_attributes SET won_div = won_div + 1, won_conf = won_conf + 1 WHERE team_id = ? AND season = ?', (self.team[t].id, self.season))
            elif self.same_conference:
                common.DB_CON.execute('UPDATE team_attributes SET won_conf = won_conf + 1 WHERE team_id = ? AND season = ?', (self.team[t].id, self.season))
        elif not self.is_playoffs:
            common.DB_CON.execute('UPDATE team_attributes SET lost = lost + 1 WHERE team_id = ? AND season = ?', (self.team[t].id, self.season))
            if self.same_division:
                common.DB_CON.execute('UPDATE team_attributes SET lost_div = lost_div + 1, lost_conf = lost_conf + 1 WHERE team_id = ? AND season = ?', (self.team[t].id, self.season))
            elif self.same_conference:
                common.DB_CON.execute('UPDATE team_attributes SET lost_conf = lost_conf + 1 WHERE team_id = ? AND season = ?', (self.team[t].id, self.season))


class Team:
    def __init__(self, team_id):
        self.id = team_id
        self._initialize_stats()
        self.load_players()
        self.load_team_attributes()

    def _initialize_stats(self):
        self.stat = dict(minutes=0, field_goals_made=0, field_goals_attempted=0,
                         three_pointers_made=0, three_pointers_attempted=0,
                         free_throws_made=0, free_throws_attempted=0,
                         offensive_rebounds=0, defensive_rebounds=0, assists=0,
                         turnovers=0, steals=0, blocks=0, personal_fouls=0,
                         points=0)

    def load_players(self):
        self.player = []
        self.player_ids = []
        p = 0
        query = 'SELECT player_id FROM player_attributes WHERE team_id = ? ORDER BY Random()'
        query = 'SELECT player_attributes.player_id FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC'
        for row in common.DB_CON.execute(query, (self.id,)):
            self.player.append(Player(row[0], self.stat))
            self.player_ids.append(row[0])
            p += 1
        self.num_players = p

    def load_team_attributes(self):
        query = 'SELECT region, name FROM team_attributes WHERE team_id = ?'
        row = common.DB_CON.execute(query, (self.id,)).fetchone()
        self.region = row[0]
        self.name = row[1]


class Player:
    def __init__(self, player_id, team_stat_ref):
        self.id = player_id
        self.team_stat = team_stat_ref
        self.load_ratings()
        self.make_composite_ratings()
        self._initialize_stats()

    # Load the raw rating values from the database
    def load_ratings(self):
        common.DB_CON.row_factory = sqlite3.Row
        query = 'SELECT overall, average_playing_time, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding FROM player_ratings WHERE player_id = ?'
        self.rating = common.DB_CON.execute(query, (self.id,)).fetchone()
        query = 'SELECT name, position FROM player_attributes WHERE player_id = ?'
        self.attribute = common.DB_CON.execute(query, (self.id,)).fetchone()
        common.DB_CON.row_factory = None

    def make_composite_ratings(self):
        self.composite_rating = {}
        self.composite_rating['pace'] = self._composite(70, 130, ['speed', 'jumping', 'shooting_layups', 'shooting_three_pointers', 'steals', 'dribbling', 'passing'])
        self.composite_rating['shot_ratio'] = self._composite(0, 0.5, ['shooting_inside', 'shooting_layups', 'shooting_two_pointers', 'shooting_three_pointers'])
        self.composite_rating['assist_ratio'] = self._composite(0, 0.5, ['dribbling', 'passing', 'speed'])
        self.composite_rating['turnover_ratio'] = self._composite(0, 0.5, ['dribbling', 'passing', 'speed'], True)
        self.composite_rating['field_goal_percentage'] = self._composite(0.3, 0.6, ['height', 'jumping', 'shooting_inside', 'shooting_layups', 'shooting_two_pointers', 'shooting_three_pointers'])
        self.composite_rating['free_throw_percentage'] = self._composite(0.4, 1, ['shooting_free_throws'])
        self.composite_rating['three_pointer_percentage'] = self._composite(0, 0.45, ['shooting_three_pointers'])
        self.composite_rating['rebound_ratio'] = self._composite(0, 0.5, ['height', 'strength', 'jumping', 'rebounding'])
        self.composite_rating['steal_ratio'] = self._composite(0, 0.5, ['speed', 'steals'])
        self.composite_rating['block_ratio'] = self._composite(0, 0.5, ['height', 'jumping', 'blocks'])
        self.composite_rating['foul_ratio'] = self._composite(0, 0.5, ['speed'], True)
        self.composite_rating['defense'] = self._composite(0, 0.5, ['speed'])

    def _composite(self, minval, maxval, components, inverse=False):
        r = 0
        if inverse:
            sign = -1
            add = -100
        else:
            sign = 1
            add = 0
        for component in components:
            r = r + sign * (add + self.rating[component])
        # Scale from minval to maxval
        r = r / (100.0 * len(components))  # 0-1
        r = r * (maxval - minval) + minval  # Min-Max
        # Randomize: Mulitply by a random number from N(1,0.1)
        r = random.gauss(1, 0.1) * r
        return r

    def _initialize_stats(self):
        self.stat = dict(starter=0, minutes=0, field_goals_made=0, field_goals_attempted=0,
                         three_pointers_made=0, three_pointers_attempted=0,
                         free_throws_made=0, free_throws_attempted=0,
                         offensive_rebounds=0, defensive_rebounds=0, assists=0,
                         turnovers=0, steals=0, blocks=0, personal_fouls=0,
                         points=0, court_time=0, bench_time=0, energy=1)

    def record_stat(self, s, amount=1):
        self.stat[s] = self.stat[s] + amount
        if s != 'starter' and s != 'court_time' and s != 'bench_time' and s != 'energy':
            self.team_stat[s] = self.team_stat[s] + amount

