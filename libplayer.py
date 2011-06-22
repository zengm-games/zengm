from models import *

import csv
import gtk
import os
import random
import re
import string

def new_game(progressbar=None):
    # Generate league structure
    # Confs and divs
    ec = Conf(id=1, name='Eastern')
    Div(id=1, name='Atlantic', conf=ec)
    Div(id=2, name='Central', conf=ec)
    Div(id=3, name='Southeast', conf=ec)
    wc = Conf(id=2, name='Western')
    Div(id=4, name='Southwest', conf=ec)
    Div(id=5, name='Northwest', conf=ec)
    Div(id=6, name='Pacific', conf=ec)
    # Teams 
    t_csv = csv.reader(open('data/teams.csv', 'r'))
    for row in t_csv:
        t_id, div_id, conf_id, region, name, abbrev, cash_tot = row
        Team(conf=Conf.get(conf_id), div=Div.get(div_id), region=region, name=name, abbrev=abbrev, cash_tot=int(cash_tot))

    # Generate new players
    profiles = ['Point', 'Wing', 'Big', '']
    n_players = 0
    for team in Team.select():

        progress = 1.0*n_players/360
        if progressbar is not None:
            progressbar.set_fraction(0.95*progress)
            while gtk.events_pending():
                gtk.main_iteration(False)
        else:
            print progress, team

        base_ratings = [40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29]
        potentials = [70, 60, 50, 50, 55, 45, 65, 35, 50, 45, 55, 55]
        random.shuffle(potentials)
        for i in range(12):
            profile = profiles[random.randrange(len(profiles))]
            age = 19+random.randint(0,3)

            player = generate(team, age, profile, base_ratings[i], potentials[i])

            aging_years = random.randint(0,15)
            develop(player, aging_years)

            n_players += 1

def generate(team, age, profile, base_rating, potential):
    """Generate a new player.

    Args:
    team: Team object.
    age: The player's age as a rookie.
    profile: Type of player. Can be 'Point', 'Wing', 'Big', or ''. The
        blank string means no specialty. This is used to determine
        appropriate ratings for different types of players.
    base_rating: Roughly, the overall rating before the draft.
    potential: Initial potential overall rating.
    """

    def gen_ratings(profile, base_rating, potential):
        if profile == 'Point':
            profile_id = 1
        elif profile == 'Wing':
            profile_id = 2
        elif profile == 'Big':
            profile_id = 3
        else:
            profile_id = 0

        # Each row should sum to ~150
        profiles = [[10, 10, 10, 10, 60, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], # Base
                    [-30, -10, 40, 15, 50, 0, 0, 10, 15, 0, 0, 20, 40, 40, 0], # Point Guard
                    [10, 10, 15, 15, 40, 0, 25, 15, 15, 5, 0, 10, 15, 0, 15], # Wing
                    [30, 30, -10, -10, 0, 30, 30, 0, -10, -20, 30, 0, -10, -10, 30]] # Big
        sigmas = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10] # Standard deviations
        base_rating = random.gauss(base_rating, 5)

        ratings = profiles[profile_id]
        for i in range(len(ratings)):
            ratings[i] += base_rating

        ratings = map(random.gauss, ratings, sigmas)
        ratings = map(limit_rating, ratings)

        i = 0
        r = {'hgt': 0, 'str': 0, 'spd': 0, 'jmp': 0, 'end': 0, 'ins': 0, 'dnk': 0, 'ft': 0, 'two': 0, 'thr': 0, 'blk': 0, 'stl': 0, 'drb': 0, 'pss': 0, 'reb': 0, 'ovr': 0, 'pot': potential} # Initialize ratings
        for key in ('hgt', 'str', 'spd', 'jmp', 'end', 'ins', 'dnk', 'ft', 'two', 'thr', 'blk', 'stl', 'drb', 'pss', 'reb'):
            r[key] = ratings[i]
            i += 1

        return r

    def gen_name():
        """Generates a first and last name based on census name files

        http://www.census.gov/genealogy/names/names_files.html
        """
        # First name data
        fn_reader = csv.reader(open('data/first_names.csv', 'rb'))
        fn_data = []
        for row in fn_reader:
            fn_data.append(row)
        fn_max = 90.040

        # Last name data (This data has been truncated to make the file smaller)
        ln_reader = csv.reader(open('data/last_names.csv', 'rb'))
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


    def gen_position(p):
        """Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings"""
        g = False
        pg = False
        sg = False
        sf = False
        pf = False
        c = False

        # Default position
        if p['drb'] >= 50:
            position = 'GF'
        else:
            position = 'F'

        if p['hgt'] <= 30 or p['spd'] >= 85:
            g = True
            if (p['pss'] + p['drb']) >= 140:
                pg = True
            if p['hgt'] >= 30:
                sg = True
        if p['hgt'] >= 50 and p['hgt'] <= 80 and p['spd'] >= 40:
            sf = True
        if (p['hgt'] + p['str']) >= 120 and p['spd'] >= 30:
            pf = True
        if (p['hgt'] + p['str']) >= 140:
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

    def gen_height(height):
        """Set height, in inches, based on height rating."""
        min_height = 71 # 5'11"
        max_height = 89 # 7'5"

        return int(random.gauss(1, 0.02)*(height*(max_height-min_height)/100+min_height))

    def gen_weight(height, strength):
        """Set weight, in pounds, based on height and strength ratings."""
        min_weight = 150
        max_weight = 290

        return int(random.gauss(1, 0.02)*((height+0.5*strength)*(max_weight-min_weight)/150+min_weight))

    def gen_contract(overall, potential):
        # Limits on yearly contract amount, in $1000's
        min_amount = 500
        max_amount = 20000

        # Scale amount from 500k to 15mil, proportional to overall*2 + potential 120-210
        amount = ((2.0 * overall + potential) - 120)/(210 - 120) # Scale from 0 to 1 (approx)
        amount = amount * (max_amount - min_amount) + min_amount # Scale from 500k to 15mil
        amount *= random.gauss(1, 0.1) # Randomize
        expiration = random.randrange(0, 6) # NEED TO ADD CURRENT YEAR TO THIS
        if amount < min_amount:
            amount = min_amount
        elif amount > max_amount:
            amount = max_amount
        else:
            amount = 50*round(amount/50.0) # Make it a multiple of 50k

        return amount, expiration

    # Ratings
    p = gen_ratings(profile, base_rating, potential)
    p['ovr'] = update_overall(p)

    # Player info
    p['name'] = gen_name() # First and last name
    p['team'] = team
    p['pos'] = gen_position(p) # PG, SG, etc
    p['roster_pos'] = 0;

    # Measurements
    p['height'] = gen_height(p['hgt']) # Inches
    p['weight'] = gen_weight(p['hgt'], p['str']) # Pounds
    p['age'] = age

    # Bio info
    p['born'] = '' # City, State/Country
    p['college'] = '' # or HS or country, if applicable

    # Draft info
    p['draft_season'] = -1
    p['draft_round'] = -1
    p['draft_pick'] = -1
    p['draft_team'] = team

    # Contract info
    p['con_amt'], p['con_exp'] = gen_contract(p['ovr'], p['pot']) # Contract annual amount and expiration year

    p = Player(**p)
    return p

def develop(p, years=1):
    """Increase/decrease ratings as a player develops.

    Currently, players tend to improve until their potential is tapped out or
    until they are 29. It would be better to have different ratings switch from
    increasing to decreasing at different times. Athleticism goes away before
    skill, and shooting can be learned late in a career.

    Args:
    years: Number of years to develop. This should only be greater than
    1 when new veteran players are being generated at the beginning
    of a game.
    """

    for i in range(years):
        potential = random.gauss(p.pot, 5)

        plus_minus = 28 - p.age
        if plus_minus > 0:
            if potential > p.ovr:
                plus_minus *= (potential - p.ovr) / 20.0 + 1/2
            else:
                plus_minus *= 1/2
        else:
            plus_minus *= 30.0 / potential

        for key in ('str', 'spd', 'jmp', 'end', 'ins', 'dnk', 'ft', 'two', 'thr', 'blk', 'stl', 'drb', 'pss', 'reb'):
            increase = random.gauss(1, 2) * plus_minus
            #increase = plus_minus
            r = getattr(p, key)
            r = limit_rating(r + increase)
            setattr(p, key, r)            

        update_overall(p)

        p.age += 1

        # Update potential
        p.pot += -2 + int(random.gauss(0, 2))
        if p.ovr > p.pot or p.age > 28:
            p.pot = p.ovr

def update_overall(p):
    """Call this after a rating is changed to update the overall rating.

    This is a pretty naive estimation of overall value. It just averages all
    the ratings together. There is probably a better way to do this.

    Args:
    p: Either a dict of ratings, as when creating a player in generate(), or a
        Player object
    """

    if type(p) is dict:
        return (p['hgt'] + p['str'] + p['spd'] + p['jmp'] + p['end'] + p['ins'] + p['dnk'] + p['ft'] + p['two'] + p['thr'] + p['blk'] + p['stl'] + p['drb'] + p['pss'] + p['reb'])/15
    else:
        return (p.hgt + p.str + p.spd + p.jmp + p.end + p.ins + p.dnk + p.ft + p.two + p.thr + p.blk + p.stl + p.drb + p.pss + p.reb)/15


def limit_rating(rating):
    if rating > 100:
        return 100
    elif rating < 0:
        return 0
    else:
        return int(rating)

