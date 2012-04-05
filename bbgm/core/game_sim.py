import random

from bbgm.util import fast_random

class GameSim:
    def __init__(self, team1, team2):
        self.team = []
        self.team.append(team1)
        self.team.append(team2)
        self.num_possessions = int(round(self.get_num_possessions()))

        # Starting lineups - FIX THIS
        self.players_on_court = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]

        self.subs_every_n = 5  # How many possessions to wait before doing subs

    def run(self):
        # Simulate the game
        for self.o in range(2):
            self.d = 0 if self.o == 1 else 1
            for i in range(self.num_possessions):
                if i % self.subs_every_n == 0:
                    self.update_players_on_court()
                if not self.is_turnover():
                    # Shot if there is no turnover
                    ratios = self.rating_array('shot_ratio', self.o)
                    shooter = self.pick_player(ratios)
                    if not self.is_block():
                        if not self.is_free_throw(shooter):
                            if not self.is_made_shot(shooter):
                                self.do_rebound()

        return self.team

    def get_num_possessions(self):
        return (self.team[0].pace + self.team[1].pace) / 2 * fast_random.gauss(1, 0.03)

    def update_players_on_court(self):
        '''
        Update players_on_court, track energy levels, and record the number of
        minutes each player plays. This function is currently VERY SLOW.
        '''

        dt = 48.0 / (2 * self.num_possessions) * self.subs_every_n  # Time elapsed in this possession

        for t in range(2):
            # Overall ratings scaled by fatigue
            overalls = [self.team[t].player[i].overall_rating * self.team[t].player[i].stat['energy'] * fast_random.gauss(1, .04) for i in xrange(len(self.team[t].player_ids))]

            # Loop through players on court (in inverse order of current roster position)
            i = 0
            for p in self.players_on_court[t]:
                self.players_on_court[t][i] = p
                # Loop through bench players (in order of current roster position) to see if any should be subbed in)
                for b in xrange(len(self.team[t].player_ids)):
                    if b not in self.players_on_court[t] and self.team[t].player[p].stat['court_time'] > 3 and self.team[t].player[b].stat['bench_time'] > 3 and overalls[b] > overalls[p]:
                        # Substitute player
                        self.players_on_court[t][i] = b
                        self.team[t].player[b].stat['court_time'] = fast_random.gauss(0, 2)
                        self.team[t].player[b].stat['bench_time'] = fast_random.gauss(0, 2)
                        self.team[t].player[p].stat['court_time'] = fast_random.gauss(0, 2)
                        self.team[t].player[p].stat['bench_time'] = fast_random.gauss(0, 2)
                i += 1

            # Update minutes (overall, court, and bench)
            for p in xrange(len(self.team[t].player_ids)):
                if p in self.players_on_court[t]:
                    self.record_stat(t, p, 'minutes', dt)
                    self.record_stat(t, p, 'court_time', dt)
                    self.record_stat(t, p, 'energy', -dt * 0.01)
                    if self.team[t].player[p].stat['energy'] < 0:
                        self.team[t].player[p].stat['energy'] = 0
                else:
                    self.record_stat(t, p, 'bench_time', dt)
                    self.record_stat(t, p, 'energy', dt * 0.2)
                    if self.team[t].player[p].stat['energy'] > 1:
                        self.team[t].player[p].stat['energy'] = 1

    def is_turnover(self):
        if random.random() < 0.1 + self.team[self.d].defense:
            self.do_turnover()
            return True
        else:
            return False

    def is_steal(self):
        if random.random() < 0.55:
            self.do_steal()
            return True
        else:
            return False

    def is_block(self):
        if random.random() < (0.02 + self.team[self.d].defense):
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
        self.record_stat(self.o, p, 'field_goals_attempted')
        # Three pointer or two pointer
        if self.team[self.o].player[p].composite_rating['three_pointer_percentage'] > 0.25 and random.random() < (0.5 * self.team[self.o].player[p].composite_rating['three_pointer_percentage']):
            self.record_stat(self.o, p, 'three_pointers_attempted')
            type = 3
            stat = 'three_pointer_percentage'
        else:
            type = 2
            stat = 'field_goal_percentage'
        # Make or miss
        if random.random() < (self.team[self.o].player[p].composite_rating[stat] - self.team[self.d].defense):
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
        self.record_stat(self.o, p, 'turnovers')
        self.is_steal()

    def do_steal(self):
        ratios = self.rating_array('steal_ratio', self.d)
        p = self.players_on_court[self.d][self.pick_player(ratios)]
        self.record_stat(self.d, p, 'steals')

    def do_block(self):
        ratios = self.rating_array('block_ratio', self.d)
        p = self.players_on_court[self.d][self.pick_player(ratios)]
        self.record_stat(self.d, p, 'blocks')

    # For and1's, set amount=1.  Else, set amount=2
    def do_free_throw(self, shooter, amount):
        self.do_foul(shooter)
        p = self.players_on_court[self.o][shooter]
        for i in range(amount):
            self.record_stat(self.o, p, 'free_throws_attempted')
            if random.random() < self.team[self.o].player[p].composite_rating['free_throw_percentage']:
                self.record_stat(self.o, p, 'free_throws_made')
                self.record_stat(self.o, p, 'points')

    # Assign a foul to anyone who isn't shooter
    # If fouls == 6, then foul out!
    def do_foul(self, shooter):
        ratios = self.rating_array('foul_ratio', self.d)
        p = self.players_on_court[self.d][self.pick_player(ratios)]
        self.record_stat(self.d, p, 'personal_fouls')
        # Foul out: remove from player_ids array, decrement num_players, and then they won't be selected anymore by update_players_on_court()
        #if self.team[self.d].player[p].stat['personal_fouls'] >= 6:

    def do_made_shot(self, shooter, type):
        if self.is_assist():
            ratios = self.rating_array('assist_ratio', self.o)
            p = self.players_on_court[self.o][self.pick_player(ratios, shooter)]
            self.record_stat(self.o, p, 'assists')
        p = self.players_on_court[self.o][shooter]
        self.record_stat(self.o, p, 'field_goals_made')
        self.record_stat(self.o, p, 'points', 2)  # 2 points for 2's
        if (type == 3):
            self.record_stat(self.o, p, 'three_pointers_made')  # Extra point for 3's
            self.record_stat(self.o, p, 'points')

    def do_rebound(self):
        if random.random() < 0.8:
            ratios = self.rating_array('rebound_ratio', self.d)
            p = self.players_on_court[self.d][self.pick_player(ratios)]
            self.record_stat(self.d, p, 'defensive_rebounds')
        else:
            ratios = self.rating_array('rebound_ratio', self.o)
            p = self.players_on_court[self.o][self.pick_player(ratios)]
            self.record_stat(self.o, p, 'offensive_rebounds')

    def rating_array(self, rating, t):
        array = [0, 0, 0, 0, 0]
        for i in range(5):
            p = self.players_on_court[t][i]
            array[i] = self.team[t].player[p].composite_rating[rating]
        return array

    # exempt is a player that can't be picked (you can't assist your own shot, which is the only current use of exempt)
    # The value of exempt is an integer from 0 to 4 that represents the index of the player in players_on_court
    # This is *NOT* the same value as the playerID or the index of the team.player array
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

    def record_stat(self, t, p, s, amount=1):
        """Increments a stat (s) for a player (p) on a team (t) by amount
        (default is 1).
        """
        self.team[t].player[p].stat[s] = self.team[t].player[p].stat[s] + amount
        if s != 'starter' and s != 'court_time' and s != 'bench_time' and s != 'energy':
            self.team[t].stat[s] = self.team[t].stat[s] + amount
