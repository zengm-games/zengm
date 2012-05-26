# -*- coding: utf-8 -*-
import csv
import random
import re
import string

from flask import g

from bbgm import app
from bbgm.util import fast_random
import bbgm.util.const as c

class Player:
    def load(self, player_id):
        self.id = player_id

        g.dbd.execute('SELECT * FROM player_ratings WHERE player_id = %s AND season = %s', (self.id, g.season))
        self.rating = g.dbd.fetchone()
        g.dbd.execute('SELECT * FROM player_attributes WHERE player_id = %s', (self.id,))
        self.attribute = g.dbd.fetchone()

    def save(self):
        self.rating['overall'] = self.overall_rating()
        query = 'UPDATE player_ratings SET overall = %s, height = %s, strength = %s, speed = %s, jumping = %s, endurance = %s, shooting_inside = %s, shooting_layups = %s, shooting_free_throws = %s, shooting_two_pointers = %s, shooting_three_pointers = %s, blocks = %s, steals = %s, dribbling = %s, passing = %s, rebounding = %s, potential = %s WHERE player_id = %s AND season = %s'
        g.db.execute(query, (self.rating['overall'], self.rating['height'], self.rating['strength'], self.rating['speed'], self.rating['jumping'], self.rating['endurance'], self.rating['shooting_inside'], self.rating['shooting_layups'], self.rating['shooting_free_throws'], self.rating['shooting_two_pointers'], self.rating['shooting_three_pointers'], self.rating['blocks'], self.rating['steals'], self.rating['dribbling'], self.rating['passing'], self.rating['rebounding'], self.rating['potential'], self.id, g.season))

    def develop(self, years=1):
        # Make sure age is always defined
        if not hasattr(g, 'season'):
            age = g.starting_season - self.attribute['born_date']
        else:
            age = g.season - self.attribute['born_date']

        for i in range(years):
            age += 1
            potential = fast_random.gauss(self.rating['potential'], 5)
            overall = self.overall_rating()

            for key in ('strength', 'speed', 'jumping', 'endurance', 'shooting_inside', 'shooting_layups', 'shooting_free_throws', 'shooting_two_pointers', 'shooting_three_pointers', 'blocks', 'steals', 'dribbling', 'passing', 'rebounding'):
                plus_minus = 28 - age
                if plus_minus > 0:
                    if potential > overall:
                        # Cap potential growth
                        if potential - overall < 20:
                            plus_minus *= (potential - overall) / 20.0 + 0.5
                        else:
                            plus_minus *= 1.5
                    else:
                        plus_minus *= 0.5
                else:
                    plus_minus *= 30.0 / potential
                increase = fast_random.gauss(1, 2) * plus_minus
                #increase = plus_minus
                self.rating[key] += increase
                self.rating[key] = self._limit_rating(self.rating[key])

            # Update potential
            overall = self.overall_rating()
            self.rating['potential'] += -2 + int(fast_random.gauss(0, 2))
            if overall > self.rating['potential'] or age > 28:
                self.rating['potential'] = overall

    def bonus(self, amount):
        """Add or subtract from all ratings"""

        for key in ('strength', 'speed', 'jumping', 'endurance', 'shooting_inside', 'shooting_layups', 'shooting_free_throws', 'shooting_two_pointers', 'shooting_three_pointers', 'blocks', 'steals', 'dribbling', 'passing', 'rebounding', 'potential'):
            self.rating[key] = self._limit_rating(self.rating[key] + amount)

    def _limit_rating(self, rating):
        if rating > 100:
            return 100
        elif rating < 0:
            return 0
        else:
            return int(rating)

    def overall_rating(self):
        return (self.rating['height'] + self.rating['strength'] + self.rating['speed'] + self.rating['jumping'] + self.rating['endurance'] + self.rating['shooting_inside'] + self.rating['shooting_layups'] + self.rating['shooting_free_throws'] + self.rating['shooting_two_pointers'] + self.rating['shooting_three_pointers'] + self.rating['blocks'] + self.rating['steals'] + self.rating['dribbling'] + self.rating['passing'] + self.rating['rebounding']) / 15

    def contract(self, randomize_expiration = False):
        # Limits on yearly contract amount, in $1000's
        min_amount = 500
        max_amount = 20000

        self.rating['overall'] = self.overall_rating()
        # Scale amount from 500k to 15mil, proportional to (overall*2 + potential)*0.5 120-210
        amount = ((2.0 * self.rating['overall'] + self.rating['potential']) * 0.85 - 120) / (210 - 120)  # Scale from 0 to 1 (approx)
        amount = amount * (max_amount - min_amount) + min_amount  # Scale from 500k to 15mil
        amount *= fast_random.gauss(1, 0.1)  # Randomize

        # Expiration
        # Players with high potentials want short contracts
        potential_difference = round((self.rating['potential'] - self.rating['overall']) / 4.0)
        years = 5 - potential_difference
        if years < 2:
            years = 2
        # Bad players can only ask for short deals
        if self.rating['potential'] < 40:
            years = 1
        elif self.rating['potential'] < 50:
            years = 2
        elif self.rating['potential'] < 60:
            years = 3

        # Randomize expiration for contracts generated at beginning of new game
        if randomize_expiration:
            years = random.randrange(1, years+1)


        if not hasattr(g, 'season'):
            expiration = g.starting_season + years - 1
        else:
            expiration = g.season + years - 1
        if amount < min_amount:
            amount = min_amount
        elif amount > max_amount:
            amount = max_amount
        else:
            amount = 50 * round(amount / 50.0)  # Make it a multiple of 50k

        return amount, expiration

    def add_to_free_agents(self, phase=None):
        """Adds a player to the free agents list.

        This should be THE ONLY way that players are added to the free agents
        list, because this will also calculate their demanded contract. But
        currently, the free agents generated at the beginning of the game don't
        use this function.
        """
        if phase == None:
            phase = g.phase

        # Player's desired contract
        amount, expiration = self.contract()

        # During regular season, or before season starts, allow contracts for
        # just this year.
        if g.phase > c.PHASE_AFTER_TRADE_DEADLINE:
            expiration += 1

        g.db.execute('UPDATE player_attributes SET team_id = %s, contract_amount = %s, contract_expiration = %s,'
                     ' free_agent_times_asked = 0 WHERE player_id = %s', (c.PLAYER_FREE_AGENT, amount, expiration, self.id))

    def release(self):
        """Release player.

        This keeps track of what the player's current team owes him, and then
        calls add_to_free_agents.
        """

        # Keep track of player salary even when he's off the team
        g.db.execute('SELECT contract_amount, contract_expiration, team_id FROM player_attributes WHERE player_id = %s', (self.id,))
        contract_amount, contract_expiration, team_id = g.db.fetchone()
        g.db.execute('INSERT INTO released_players_salaries (player_id, team_id, contract_amount, contract_expiration) VALUES (%s, %s, %s, %s)', (self.id, team_id, contract_amount, contract_expiration))

        self.add_to_free_agents()


class GeneratePlayer(Player):
    '''
    Class to generate random players
    self.attributes: row to insert in the player_attributes table
    self.ratings: row to insert in the player_ratings table
    '''

    def __init__(self):
        # First name data
        fn_reader = csv.reader(app.open_resource('data/first_names.txt'))
        self.fn_data = []
        for row in fn_reader:
            self.fn_data.append(row)

        # Last name data (This data has been truncated to make the file smaller)
        ln_reader = csv.reader(app.open_resource('data/last_names.txt'))
        self.ln_data = []
        for row in ln_reader:
            self.ln_data.append(row)

        # Nationality data
        nat_reader = csv.reader(app.open_resource('data/nationalities.txt'))
        self.nat_data = []
        for row in nat_reader:
            self.nat_data.append(row)
        self.nat_max = 100

    def new(self, player_id, team_id, age, profile, base_rating, potential, draft_year, player_nat=""):
        self.id = player_id

        self.rating = {}
        self.rating['potential'] = potential
        self.attribute = {}
        self.attribute['team_id'] = team_id
        self.attribute['roster_position'] = player_id
        self.attribute['draft_year'] = draft_year
        self.generate_ratings(profile, base_rating)
        self.generate_attributes(age, player_nat)

    def develop(self, years=1):
        """Develop and age a player.

        This just calls Player.develop and then adds the appropriate number of
        years to the player's born_date.
        """
        Player.develop(self, years)
        if not hasattr(g, 'season'):
            age = g.starting_season - self.attribute['born_date'] + years
            self.attribute['born_date'] = g.starting_season - age
        else:
            age = g.season - self.attribute['born_date'] + years
            self.attribute['born_date'] = g.season - age

    def generate_ratings(self, profile, base_rating):
        if profile == 'Point':
            profile_id = 1
        elif profile == 'Wing':
            profile_id = 2
        elif profile == 'Big':
            profile_id = 3
        else:
            profile_id = 0

        # Each row should sum to ~150
        profiles = [[10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10],  # Base 
                    [-30, -10, 40,  15,  0,   0,   0,   10,  15,  0,   0,   20,  40,  40,  0],   # Point Guard
                    [10,  10,  15,  15,  0,   0,   25,  15,  15,  5,   0,   10,  15,  0,   15],  # Wing
                    [40,  30,  -10, -10, 10,  30,  30,  0,   -10, -20, 30,  0,   -10, -10, 30]]  # Big
        sigmas = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
        base_rating = fast_random.gauss(base_rating, 5)

        ratings = profiles[profile_id]
        for i in range(len(ratings)):
            ratings[i] += base_rating

        ratings = map(fast_random.gauss, ratings, sigmas)
        ratings = map(self._limit_rating, ratings)

        i = 0
        for key in ('height', 'strength', 'speed', 'jumping', 'endurance', 'shooting_inside', 'shooting_layups', 'shooting_free_throws', 'shooting_two_pointers', 'shooting_three_pointers', 'blocks', 'steals', 'dribbling', 'passing', 'rebounding'):
            self.rating[key] = ratings[i]
            i += 1

    # Call generate_ratings before this method!
    def generate_attributes(self, age, player_nat):
        min_height = 71  # 5'11"
        max_height = 89  # 7'5"
        min_weight = 150
        max_weight = 290

        self.attribute['position'] = self._position()  # Position (PG, SG, SF, PF, C, G, GF, FC)
        self.attribute['height'] = int(fast_random.gauss(1, 0.02) * (self.rating['height'] * (max_height - min_height) / 100 + min_height))  # Height in inches (from min_height to max_height)
        self.attribute['weight'] = int(fast_random.gauss(1, 0.02) * ((self.rating['height'] + 0.5 * self.rating['strength']) * (max_weight - min_weight) / 150 + min_weight))  # Weight in points (from min_weight to max_weight)
        if not hasattr(g, 'season'):
            self.attribute['born_date'] = g.starting_season - age
        else:
            self.attribute['born_date'] = g.season - age

        #If the nationality isn't given, randomly choose one.	
        if player_nat == "":
            nationality_rand = random.uniform(0, self.nat_max)
            for row in self.nat_data:
                if float(row[2]) >= nationality_rand:
                    break
            nationality = row[0]
            self.fn_max = float(row[4])
            self.ln_max = float(row[5])
        else:
            nationality = player_nat
            for row in self.nat_data:
                if row[0].upper() == nationality.upper():
                    break
            self.fn_max = float(row[4])
            self.ln_max = float(row[5])

        self.attribute['born_location'] = nationality
        self.attribute['name'] = self._name(nationality)        

        self.attribute['college'] = 0
        self.attribute['draft_round'] = 0
        self.attribute['draft_pick'] = 0
        self.attribute['draft_team_id'] = 0
        self.attribute['contract_amount'], self.attribute['contract_expiration'] = self.contract()

    def _name(self, nationality):
        # First name
        fn_rand = random.uniform(0, self.fn_max)
        for row in self.fn_data:
            if row[4].upper() == nationality.upper():
                if float(row[2]) >= fn_rand:
                    break
        fn = string.capitalize(row[0])

        # Last name
        ln_rand = random.uniform(0, self.ln_max)
        for row in self.ln_data:
            if row[4].upper() == nationality.upper():
                if float(row[2]) >= ln_rand:
                #   if (random.random() < 0.3):  # This is needed because there are some duplicate CDF's in last_names.txt
                    break
        ln = string.capitalize(row[0])
        # McWhatever
        if len(ln) > 3:
            ln = re.sub('^Mc(\w)', 'Mc' + ln[2].upper(), ln)

        return '%s %s' % (fn, ln)

    def _position(self):
        '''
        Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings
        '''
        g = False
        pg = False
        sg = False
        sf = False
        pf = False
        c = False

        # Default position
        if self.rating['dribbling'] >= 50:
            position = 'GF'
        else:
            position = 'F'

        if self.rating['height'] <= 30 or self.rating['speed'] >= 85:
            g = True
            if (self.rating['passing'] + self.rating['dribbling']) >= 100:
                pg = True
            if self.rating['height'] >= 30:
                sg = True
        if self.rating['height'] >= 50 and self.rating['height'] <= 65 and self.rating['speed'] >= 40:
            sf = True
        if self.rating['height'] >= 70:
            pf = True
        if (self.rating['height'] + self.rating['strength']) >= 130:
            c = True

        if pg and not sg and not sf and not pf and not c:
            position = 'PG'
        elif not pg and (g or sg) and not sf and not pf and not c:
            position = 'SG'
        elif not pg and not sg and sf and not pf and not c:
            position = 'SF'
        elif not pg and not sg and not sf and pf and not c:
            position = 'PF'
        elif not pg and not sg and not sf and not pf and c:
            position = 'C'

        # Multiple positions
        if (pf or sf) and g:
            positon = 'GF'
        elif c and (pf or sf):
            position = 'FC'
        elif pg and sg:
            position = 'G'

        if position is 'F' and self.rating['dribbling'] <= 20:
            position = 'PF'

        return position

    # In the following 4 methods, everything is sorted by the keys to ensure they align
    def sql_insert_attributes_query(self):
        sql = 'INSERT INTO player_attributes (%s) VALUES (%s)'
        return sql % ('player_id, ' + ', '.join(map(str, sorted(self.attribute.keys()))), ', '.join(['%s' for i in xrange(len(self.attribute.keys()) + 1)]))

    def sql_insert_attributes(self):
        return [self.id,] + [self.attribute[i] for i in sorted(self.attribute.keys())]

    def get_attributes(self):
        d = self.attribute
        d['player_id'] = self.id
        return d

    def get_ratings(self):
        d = self.rating
        if not hasattr(g, 'season'):
            d['season'] = g.starting_season
        else:
            d['season'] = g.season
        d['overall'] = self.overall_rating()
        d['player_id'] = self.id
        return d

    def sql_insert_ratings_query(self):
        sql = 'INSERT INTO player_ratings (%s) VALUES (%s)'
        return sql % ('player_id, season, ' + ', '.join(map(str, sorted(self.rating.keys()))), ', '.join(['%s' for i in xrange(len(self.rating.keys()) + 2)]))

    def sql_insert_ratings(self):
        if not hasattr(g, 'season'):
            season = g.starting_season
        else:
            season = g.season
        self.rating['overall'] = self.overall_rating()
        return [self.id, season] + [self.rating[i] for i in sorted(self.rating.keys())]
