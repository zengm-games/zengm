import csv
import random
import re
import string

class player:
    '''
    Class to generate random players
    self.attributes: row to insert in the player_attributes table
    self.ratings: row to insert in the player_ratings table
    '''

    def __init__(self):
        # First name data
        fn_reader = csv.reader(open("data/first_names.txt", "rb"))
        self.fn_data = []
        for row in fn_reader:
            self.fn_data.append(row)
        self.fn_max = 90.040

        # Last name data
        ln_reader = csv.reader(open("data/last_names.txt", "rb"))   
        self.ln_data = []
        for row in ln_reader:
            self.ln_data.append(row)  
        self.ln_max = 90.483

    def generate_ratings(self, player_id, roster_position, average_playing_time, profile, base_rating):
        self.ratings = []
        self.ratings.append(player_id) # Player ID
        self.ratings.append(roster_position) # Roster position
        self.ratings.append(average_playing_time) # Average playing time

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
                    [-20, -10, 30,  20,  0,   0,   0,   10,  15,  0,   0,   20,  40,  35,  0], # Point Guard
                    [10,  10,  15,  15,  0,   0,   25,  15,  15,  5,   0,   10,  15,  0,   15], # Wing
                    [30,  30,  -10, -10, 10,  30,  30,  0,   -10, -20, 30,  0,   -10, -10, 30]] # Big
        sigmas = [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
        base_rating = random.gauss(base_rating, 10)

        ratings = profiles[profile_id]
        for i in range(len(ratings)):
            ratings[i] += base_rating

        ratings = map(random.gauss, ratings, sigmas)
        ratings = map(self._limit_rating, ratings)

        self.ratings += ratings

        return self.ratings

    # Call generate_ratings before this method!
    def generate_attributes(self, current_year, age):
        min_height = 69 # 5'9"
        max_height = 86 # 7'2"
        min_weight = 150
        max_weight = 290

        attributes = []
        attributes.append(1) # Player ID
        attributes.append(self._name()) # Name
        attributes.append(1) # Team ID
        attributes.append(self._position()) # Position (PG, SG, SF, PF, C, G, GF, FC)
        attributes.append(int(random.gauss(1, 0.02)*(self.ratings[3]*(max_height-min_height)/100+min_height))) # Height in inches (from min_height to max_height)
        attributes.append(int(random.gauss(1, 0.02)*((self.ratings[3]+0.5*self.ratings[4])*(max_weight-min_weight)/150+min_weight))) # Weight in points (from min_weight to max_weight)
        attributes.append(self._born_date(current_year, age)) #born_date TEXT, -- YYYY-MM-DD for birthday
        attributes.append(0) #born_location TEXT, -- City, State/Country
        attributes.append(0) #college TEXT, -- or HS or country, if applicable
        attributes.append(0) #draft_year INTEGER,
        attributes.append(0) #draft_round INTEGER,
        attributes.append(0) #draft_pick INTEGER,
        attributes.append(0) #draft_team_id INTEGER
        return attributes

    def _name(self):
        # First name
        fn_rand = random.uniform(0, self.fn_max)
        for row in self.fn_data:
            if float(row[2]) >= fn_rand:
                break
        fn = string.capitalize(row[0])

        # Last name
        ln_rand = random.uniform(0, self.ln_max)
        for row in self.ln_data:
            if float(row[2]) >= ln_rand:
                if (random.random() < 0.3): # This is needed because there are some duplicate CDF's in last_names.txt
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
        (height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding) = self.ratings[3:18]

        g = False
        pg = False
        sg = False
        sf = False
        pf = False
        c = False

        # Default position
        if dribbling >= 50:
            position = 'GF'
        else:
            position = 'F'

        if height <= 30 or (height <= 70 and speed >= 80):
            g = True
            if (passing + dribbling) >= 140:
                pg = True
            if height >= 20:
                sg = True
        if height >= 40 and height <= 80 and speed >= 40:
            sf = True
        if (height + strength) >= 130 and speed >= 30:
            pf = True
        if (height + strength) >= 150:
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

    def _born_date(self, current_year, age):
        year = current_year - age
        return '%d-%02d-%02d' % (year, random.randint(1,12), random.randint(1,28))

    def _limit_rating(self, rating):
        if rating > 100:
            return 100
        elif rating < 0:
            return 0
        else:
            return int(rating)
