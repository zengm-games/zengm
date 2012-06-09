function Player(pid) {
    this.id = pid
}

/**
 * Load existing player's current ratings and attributes from the database.
 */
Player.prototype.load = function() {
    r = g.dbex('SELECT * FROM player_ratings WHERE pid = :pid AND season = :season', pid=pid, season=g.season)
    this.rating = dict(r.fetchone())
    r = g.dbex('SELECT * FROM player_attributes WHERE pid = :pid', pid=pid)
    this.attribute = dict(r.fetchone())
}

Player.prototype.save = function() {
    query = 'UPDATE player_ratings SET ovr = :ovr, hgt = :hgt, stre = :stre, spd = :spd, jmp = :jmp, endu = :endu, ins = :ins, dnk = :dnk, ft = :ft, fg = :fg, tp = :tp, blk = :blk, stl = :stl, drb = :drb, pss = :pss, reb = :reb, pot = :pot WHERE pid = :pid AND season = :season'
    g.dbex(query, ovr=this.ovr(), hgt=this.rating['hgt'], stre=this.rating['stre'], spd=this.rating['spd'], jmp=this.rating['jmp'], endu=this.rating['endu'], ins=this.rating['ins'], dnk=this.rating['dnk'], ft=this.rating['ft'], fg=this.rating['fg'], tp=this.rating['tp'], blk=this.rating['blk'], stl=this.rating['stl'], drb=this.rating['drb'], pss=this.rating['pss'], reb=this.rating['reb'], pot=this.rating['pot'], pid=this.id, season=g.season)
}

/**
 * Develop (increase/decrease) player's ratings.
 * @param {number} years Number of years to develop (default 1).
 * @param {generate} generate Generating a new player? (default false). If true, then
 *     the player's age is also updated based on years.
 */
Player.prototype.develop = function(years, generate) {
    years = typeof years !== "undefined" ? years : 1;
    generate = typeof generate !== "undefined" ? generate : false;

    // Make sure age is always defined
    if not hasattr(g, 'season'):
        age = g.starting_season - this.attribute['bornYear']
    else:
        age = g.season - this.attribute['bornYear']

    for i in range(years):
        age += 1
        pot = fast_random.gauss(this.rating['pot'], 5)
        ovr = this.ovr()

        for key in ('stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb'):
            plus_minus = 28 - age
            if plus_minus > 0:
                if pot > ovr:
                    // Cap potential growth
                    if pot - ovr < 20:
                        plus_minus *= (pot - ovr) / 20.0 + 0.5
                    else:
                        plus_minus *= 1.5
                else:
                    plus_minus *= 0.5
            else:
                plus_minus *= 30.0 / pot
            increase = fast_random.gauss(1, 2) * plus_minus
            //increase = plus_minus
            this.rating[key] += increase
            this.rating[key] = this._limit_rating(this.rating[key])

        // Update potential
        ovr = this.ovr()
        this.rating['pot'] += -2 + int(fast_random.gauss(0, 2))
        if ovr > this.rating['pot'] or age > 28:
            this.rating['pot'] = ovr

    if (generate) {
        if not hasattr(g, 'season'):
            age = g.starting_season - this.attribute['bornYear'] + years
            this.attribute['bornYear'] = g.starting_season - age
        else:
            age = g.season - this.attribute['bornYear'] + years
            this.attribute['bornYear'] = g.season - age
    }
}

/**
 * Add or subtract amount from all ratings.
 * @param {number} amount Number to be added to each rating (can be negative).
 */
Player.prototype.bonus = function(amount) {
    for key in ('stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb', 'pot'):
        this.rating[key] = this._limit_rating(this.rating[key] + amount)
}

Player.prototype._limit_rating = function(rating) {
    if (rating > 100) {
        return 100;
    }
    else if (rating < 0) {
        return 0;
    }
    else {
        return parseInt(rating, 10);
    }
}

/**
 * Calculates the overall rating by averaging together all the other ratings.
 * @return {number} Overall rating.
 */
Player.prototype.ovr = function() {
    return (this.rating['hgt'] + this.rating['stre'] + this.rating['spd'] + this.rating['jmp'] + this.rating['endu'] + this.rating['ins'] + this.rating['dnk'] + this.rating['ft'] + this.rating['fg'] + this.rating['tp'] + this.rating['blk'] + this.rating['stl'] + this.rating['drb'] + this.rating['pss'] + this.rating['reb']) / 15
}

Player.prototype.contract = function(randomizeExp) {
    randomizeExp = typeof randomizeExp !== "undefined" ? randomizeExp : false;

    // Limits on yearly contract amount, in $1000's
    min_amount = 500
    max_amount = 20000

    ovr = this.ovr()
    // Scale amount from 500k to 15mil, proportional to (ovr*2 + pot)*0.5 120-210
    amount = ((2.0 * ovr + this.rating['pot']) * 0.85 - 120) / (210 - 120)  // Scale from 0 to 1 (approx)
    amount = amount * (max_amount - min_amount) + min_amount  // Scale from 500k to 15mil
    amount *= fast_random.gauss(1, 0.1)  // Randomize

    // Expiration
    // Players with high potentials want short contracts
    potential_difference = round((this.rating['pot'] - ovr) / 4.0)
    years = 5 - potential_difference
    if years < 2:
        years = 2
    // Bad players can only ask for short deals
    if this.rating['pot'] < 40:
        years = 1
    elif this.rating['pot'] < 50:
        years = 2
    elif this.rating['pot'] < 60:
        years = 3

    // Randomize expiration for contracts generated at beginning of new game
    if randomizeExp:
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
        amount = 50 * round(amount / 50.0)  // Make it a multiple of 50k

    return amount, expiration
}

/**
 * Adds player to the free agents list.
 * 
 * This should be THE ONLY way that players are added to the free agents
 * list, because this will also calculate their demanded contract. But
 * currently, the free agents generated at the beginning of the game don't
 * use this function.
 */
Player.prototype.addToFreeAgents = function(phase) {
    phase = typeof phase !== "undefined" ? phase : g.phase;

    // Player's desired contract
    amount, expiration = this.contract()

    // During regular season, or before season starts, allow contracts for
    // just this year.
    if g.phase > c.PHASE_AFTER_TRADE_DEADLINE:
        expiration += 1

    g.dbex('UPDATE player_attributes SET tid = :tid, contract_amount = :contract_amount, contract_exp = :contract_exp, free_agent_times_asked = 0 WHERE pid = :pid', tid=c.PLAYER_FREE_AGENT, contract_amount=amount, contract_exp=expiration, pid=this.id)
}

/**
 * Release player.
 * 
 * This keeps track of what the player's current team owes him, and then
 * calls this.addToFreeAgents.
 */
Player.prototype.release = function() {
    // Keep track of player salary even when he's off the team
    r = g.dbex('SELECT contract_amount, contract_exp, tid FROM player_attributes WHERE pid = :pid', pid=this.id)
    contract_amount, contract_exp, tid = r.fetchone()
    g.dbex('INSERT INTO released_players_salaries (pid, tid, contract_amount, contract_exp) VALUES (:pid, :tid, :contract_amount, :contract_exp)', pid=this.id, tid=tid, contract_amount=contract_amount, contract_exp=contract_exp)

    this.addToFreeAgents()
}

Player.prototype.generate = function(tid, age, profile, baseRating, pot, draftYear) {
    // First name data
    fn_reader = csv.reader(app.open_resource('data/first_names.txt'))
    this.fn_data = []
    for row in fn_reader:
        this.fn_data.append(row)

    // Last name data (This data has been truncated to make the file smaller)
    ln_reader = csv.reader(app.open_resource('data/last_names.txt'))
    this.ln_data = []
    for row in ln_reader:
        this.ln_data.append(row)

    // Nationality data
    nat_reader = csv.reader(app.open_resource('data/nationalities.txt'))
    this.nat_data = []
    for row in nat_reader:
        this.nat_data.append(row)
    this.nat_max = 100

    this.rating = {}
    this.rating['pot'] = pot
    this.attribute = {}
    this.attribute['tid'] = tid
    this.attribute['rosterOrder'] = pid
    this.attribute['draftYear'] = draftYear
    this.generateRatings(profile, baseRating)
    this.generateAttributes(age)
}

Player.prototype.generateRatings(profile, base_rating) {
    if profile == 'Point':
        profile_id = 1
    elif profile == 'Wing':
        profile_id = 2
    elif profile == 'Big':
        profile_id = 3
    else:
        profile_id = 0

    // Each row should sum to ~150
    profiles = [[10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10],  // Base 
                [-30, -10, 40,  15,  0,   0,   0,   10,  15,  0,   0,   20,  40,  40,  0],   // Point Guard
                [10,  10,  15,  15,  0,   0,   25,  15,  15,  5,   0,   10,  15,  0,   15],  // Wing
                [40,  30,  -10, -10, 10,  30,  30,  0,   -10, -20, 30,  0,   -10, -10, 30]]  // Big
    sigmas = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    base_rating = fast_random.gauss(base_rating, 5)

    ratings = profiles[profile_id]
    for i in range(len(ratings)):
        ratings[i] += base_rating

    ratings = map(fast_random.gauss, ratings, sigmas)
    ratings = map(this._limit_rating, ratings)

    i = 0
    for key in ('hgt', 'stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb'):
        this.rating[key] = ratings[i]
        i += 1
}

// Call generate_ratings before this method!
Player.prototype.generateAttributes(age, player_nat) {
    min_hgt = 71  // 5'11"
    max_hgt = 89  // 7'5"
    min_weight = 150
    max_weight = 290

    this.attribute['pos'] = this._pos()  // Position (PG, SG, SF, PF, C, G, GF, FC)
    this.attribute['hgt'] = int(fast_random.gauss(1, 0.02) * (this.rating['hgt'] * (max_hgt - min_hgt) / 100 + min_hgt))  // Height in inches (from min_hgt to max_hgt)
    this.attribute['weight'] = int(fast_random.gauss(1, 0.02) * ((this.rating['hgt'] + 0.5 * this.rating['stre']) * (max_weight - min_weight) / 150 + min_weight))  // Weight in pounds (from min_weight to max_weight)
    if not hasattr(g, 'season'):
        this.attribute['bornYear'] = g.starting_season - age
    else:
        this.attribute['bornYear'] = g.season - age

    // Randomly choose nationality	
    nationality_rand = random.uniform(0, this.nat_max)
    for row in this.nat_data:
        if float(row[2]) >= nationality_rand:
            break
    nationality = row[0]
    this.fn_max = float(row[4])

    this.attribute['born_loc'] = nationality
    this.attribute['name'] = this._name(nationality)        

    this.attribute['college'] = 0
    this.attribute['round'] = 0
    this.attribute['draft_pick'] = 0
    this.attribute['draft_tid'] = 0
    this.attribute['contract_amount'], this.attribute['contract_exp'] = this.contract()
}

Player.prototype._name = function(nationality) {
    fn = "Bob";
    ln = "Johnson";
/*
        // First name
        fn_rand = random.uniform(0, this.fn_max)
        for row in this.fn_data:
            if row[4].upper() == nationality.upper():
                if float(row[2]) >= fn_rand:
                    break
        fn = string.capitalize(row[0])

        // Last name
        ln_rand = random.uniform(0, this.ln_max)
        for row in this.ln_data:
            if row[4].upper() == nationality.upper():
                if float(row[2]) >= ln_rand:
                //   if (random.random() < 0.3):  // This is needed because there are some duplicate CDF's in last_names.txt
                    break
        ln = string.capitalize(row[0])
        // McWhatever
        if len(ln) > 3:
            ln = re.sub('^Mc(\w)', 'Mc' + ln[2].upper(), ln)
*/
        return fn + " " + ln;
}

/**
 * Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings.
 */
Player.prototype._pos = function(nationality) {
    var pos;
    var g = false;
    var pg = false;
    var sg = false;
    var sf = false;
    var pf = false;
    var c = false;

    // Default position
    if this.rating['drb'] >= 50:
        pos = 'GF'
    else:
        pos = 'F'

    if this.rating['hgt'] <= 30 or this.rating['spd'] >= 85:
        g = True
        if (this.rating['pss'] + this.rating['drb']) >= 100:
            pg = True
        if this.rating['hgt'] >= 30:
            sg = True
    if this.rating['hgt'] >= 50 and this.rating['hgt'] <= 65 and this.rating['spd'] >= 40:
        sf = True
    if this.rating['hgt'] >= 70:
        pf = True
    if (this.rating['hgt'] + this.rating['stre']) >= 130:
        c = True

    if pg and not sg and not sf and not pf and not c:
        pos = 'PG'
    elif not pg and (g or sg) and not sf and not pf and not c:
        pos = 'SG'
    elif not pg and not sg and sf and not pf and not c:
        pos = 'SF'
    elif not pg and not sg and not sf and pf and not c:
        pos = 'PF'
    elif not pg and not sg and not sf and not pf and c:
        pos = 'C'

    // Multiple poss
    if (pf or sf) and g:
        positon = 'GF'
    elif c and (pf or sf):
        pos = 'FC'
    elif pg and sg:
        pos = 'G'

    if pos is 'F' and this.rating['drb'] <= 20:
        pos = 'PF'

    return pos
}
/* THSES SHOULDN'T BE NEEDED, IDEALLY
    def get_attributes(this):
        d = this.attribute
        d['pid'] = this.id
        return d

    def get_ratings(this):
        d = this.rating
        if not hasattr(g, 'season'):
            d['season'] = g.starting_season
        else:
            d['season'] = g.season
        d['ovr'] = this.ovr()
        d['pid'] = this.id
        return d*/
