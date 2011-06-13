import csv
import mx.DateTime
import os
import random
import re
import string

class Player:
    def __init__(self, config, p_id, age, profile, base_rating, potential):
        """Generate a new player.
        
        Each instance of this class represents a player, so it should be called
        each time a player is created (before the draft to make rookies or at
        the beginning of a new game to make everyone)

        Args:
            config: Instance of the Config class from config.py.
            p_id: Player ID number.
            age: The player's age as a rookie.
            profile: Type of player. Can be 'Point', 'Wing', 'Big', or ''. The
                blank string means no specialty. This is used to determine
                appropriate ratings for different types of players.
            base_rating: Roughly, the overall rating before the draft.
            potential: Initial potential overall rating.
        """
        self.config = config

        # ID numbers
        self.id = p_id
        self.t_id = -1 # -1 means free agent

        # Ratings and stats
        self.r = self._gen_ratings(profile, base_rating, potential)
        self._update_overall()
        self.ss = {self.config.year: self._blank_stats()} # Season stats - dict for years, list of stats
        self.gs = {self.config.year: {}} # Game stats - dict for years, dict for game IDs, list of stats

        # Player attributes
        self.name = self._gen_name() # First and last name
        self.position = self._gen_position() # PG, SG, etc
        self.height = self._gen_height() # Inches
        self.weight = self._gen_weight() # Pounds
        self.age = age
        self.born_loc = '' # City, State/Country

        # Draft info
        self.college = '' # or HS or country, if applicable
        self.draft_year = -1
        self.draft_round = -1
        self.draft_pick = -1
        self.draft_t_id = -1

        # Contract info
        self.c_amt, self.c_exp = self._gen_contract() # Contract annual amount and expiration year

    def develop(self, years=1):
        """Increase/decrease ratings as a player develops.

        Args:
            years: Number of years to develop. This should only be greater than
                1 when new veteran players are being generated at the beginning
                of a game.
        """

        for i in range(years):
            potential = random.gauss(self.r['potential'], 5)

            for key in ('strength', 'speed', 'jumping', 'endurance', 'shooting_inside', 'shooting_layups', 'shooting_free_throws', 'shooting_two_pointers', 'shooting_three_pointers', 'blocks', 'steals', 'dribbling', 'passing', 'rebounding'):
                plus_minus = 28 - self.age
                if plus_minus > 0:
                    if potential > self.r['overall']:
                        plus_minus *= (potential - self.r['overall']) / 20.0 + 1/2
                    else:
                        plus_minus *= 1/2
                else:
                    plus_minus *= 30.0 / potential
                increase = random.gauss(1, 2) * plus_minus
                #increase = plus_minus
                self.r[key] += increase
                self.r[key] = self._limit_rating(self.r[key])

            self._update_overall()

            self.age += 1

            # Update potential
            self.r['potential'] += -2 + int(random.gauss(0, 2))
            if self.r['overall'] > self.r['potential'] or self.age > 28:
                self.r['potential'] = self.r['overall']

    def _update_overall(self):
        """Call this after a rating is changed to update the overall rating."""
        self.r['overall'] = (self.r['height'] + self.r['strength'] + self.r['speed'] + self.r['jumping'] + self.r['endurance'] + self.r['shooting_inside'] + self.r['shooting_layups'] + self.r['shooting_free_throws'] + self.r['shooting_two_pointers'] + self.r['shooting_three_pointers'] + self.r['blocks'] + self.r['steals'] + self.r['dribbling'] + self.r['passing'] + self.r['rebounding'])/15

    def _blank_stats(self):
        """Returns a blank list of stats, for either a game or a season."""
        return {'playoffs': 0, 'starter': 0, 'minutes': 0, 'field_goals_made': 0, 'field_goals_attempted': 0, 'three_pointers_made': 0, 'three_pointers_attempted': 0, 'free_throws_made': 0, 'free_throws_attempted': 0, 'offensive_rebounds': 0, 'defensive_rebounds': 0, 'assists': 0, 'turnovers': 0, 'steals': 0, 'blocks': 0, 'personal_fouls': 0, 'points': 0}

    def _limit_rating(self, rating):
        if rating > 100:
            return 100
        elif rating < 0:
            return 0
        else:
            return int(rating)

    # BELOW ARE THE PLAYER ATTRIBUTE GENERATION METHODS

    def _gen_ratings(self, profile, base_rating, potential):
        if profile == 'Point':
            profile_id = 1
        elif profile == 'Wing':
            profile_id = 2
        elif profile == 'Big':
            profile_id = 3
        else:
            profile_id = 0

        # Each row should sum to ~150
        profiles = [[10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10], # Base 
                    [-30, -10, 40,  15,  0,   0,   0,   10,  15,  0,   0,   20,  40,  40,  0],  # Point Guard
                    [10,  10,  15,  15,  0,   0,   25,  15,  15,  5,   0,   10,  15,  0,   15], # Wing
                    [30,  30,  -10, -10, 10,  30,  30,  0,   -10, -20, 30,  0,   -10, -10, 30]] # Big
        sigmas =    [10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10]  # Standard deviations
        base_rating = random.gauss(base_rating, 5)

        ratings = profiles[profile_id]
        for i in range(len(ratings)):
            ratings[i] += base_rating

        ratings = map(random.gauss, ratings, sigmas)
        ratings = map(self._limit_rating, ratings)

        i = 0
        r = {'height': 0, 'strength': 0, 'speed': 0, 'jumping': 0, 'endurance': 0, 'shooting_inside': 0, 'shooting_layups': 0, 'shooting_free_throws': 0, 'shooting_two_pointers': 0, 'shooting_three_pointers': 0, 'blocks': 0, 'steals': 0, 'dribbling': 0, 'passing': 0, 'rebounding': 0, 'overall': 0, 'potential': potential} # Initialize ratings
        for key in ('height', 'strength', 'speed', 'jumping', 'endurance', 'shooting_inside', 'shooting_layups', 'shooting_free_throws', 'shooting_two_pointers', 'shooting_three_pointers', 'blocks', 'steals', 'dribbling', 'passing', 'rebounding'):
            r[key] = ratings[i]
            i += 1

        return r

    def _gen_name(self):
        """Generates a first and last name based on census name files

        http://www.census.gov/genealogy/names/names_files.html
        """
        # First name data
        fn_reader = csv.reader(open(os.path.join(self.config.data_dir, 'first_names.txt'), 'rb'))
        fn_data = []
        for row in fn_reader:
            fn_data.append(row)
        fn_max = 90.040

        # Last name data (This data has been truncated to make the file smaller)
        ln_reader = csv.reader(open(os.path.join(self.config.data_dir, "last_names.txt"), 'rb'))
        ln_data = []
        for row in ln_reader:
            ln_data.append(row)
        ln_max = 77.480

        # First name
        fn_rand = random.uniform(0, fn_max)
        for row in fn_data:
            if float(row[2]) >= fn_rand:
                break
        fn = string.capitalize(row[0])

        # Last name
        ln_rand = random.uniform(0, ln_max)
        for row in ln_data:
            if float(row[2]) >= ln_rand:
                if (random.random() < 0.3): # This is needed because there are some duplicate CDF's in last_names.txt
                    break
        ln = string.capitalize(row[0])
        # McWhatever
        if len(ln) > 3:
            ln = re.sub('^Mc(\w)', 'Mc' + ln[2].upper(), ln)

        return '%s %s' % (fn, ln)


    def _gen_position(self):
        """Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings"""
        g = False
        pg = False
        sg = False
        sf = False
        pf = False
        c = False

        # Default position
        if self.r['dribbling'] >= 50:
            position = 'GF'
        else:
            position = 'F'

        if self.r['height'] <= 30 or self.r['speed'] >= 85:
            g = True
            if (self.r['passing'] + self.r['dribbling']) >= 140:
                pg = True
            if self.r['height'] >= 30:
                sg = True
        if self.r['height'] >= 50 and self.r['height'] <= 80 and self.r['speed'] >= 40:
            sf = True
        if (self.r['height'] + self.r['strength']) >= 120 and self.r['speed'] >= 30:
            pf = True
        if (self.r['height'] + self.r['strength']) >= 140:
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

        return position

    def _gen_height(self):
        """Set height, in inches, based on height rating."""
        min_height = 71 # 5'11"
        max_height = 89 # 7'5"

        return int(random.gauss(1, 0.02)*(self.r['height']*(max_height-min_height)/100+min_height))

    def _gen_weight(self):
        """Set weight, in pounds, based on height and strength ratings."""
        min_weight = 150
        max_weight = 290

        return int(random.gauss(1, 0.02)*((self.r['height']+0.5*self.r['strength'])*(max_weight-min_weight)/150+min_weight))

    def _gen_contract(self):
        # Limits on yearly contract amount, in $1000's
        min_amount = 500
        max_amount = 20000

        self.r['overall'] = self.r['overall']
        # Scale amount from 500k to 15mil, proportional to overall*2 + potential 120-210
        amount = ((2.0 * self.r['overall'] + self.r['potential']) - 120)/(210 - 120) # Scale from 0 to 1 (approx)
        amount = amount * (max_amount - min_amount) + min_amount # Scale from 500k to 15mil
        amount *= random.gauss(1, 0.1) # Randomize
        expiration = self.config.year + random.randrange(0, 6)
        if amount < min_amount:
            amount = min_amount
        elif amount > max_amount:
            amount = max_amount
        else:   
            amount = 50*round(amount/50.0) # Make it a multiple of 50k

        return amount, expiration

