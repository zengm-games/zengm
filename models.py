from sqlobject import *

class Player(SQLObject):
    name = StringCol(length=200)
    team = ForeignKey('Team')
    pos = StringCol(length=2)
    roster_pos = IntCol()

    # Measurements
    height = IntCol() # inches
    weight = IntCol() # pounds
    age = IntCol()

    # Bio info
    born = StringCol(length=200) # City, State/Country
    college = StringCol(length=200) # or HS or country, if applicable

    # Draft info
    draft_season = IntCol()
    draft_round = IntCol()
    draft_pick = IntCol()
    draft_team = ForeignKey('Team')

    # Contract info
    con_amt = IntCol()
    con_exp = IntCol()

    # Ratings
    ovr = IntCol() # Overall
    pot = IntCol() # Potential
    hgt = IntCol() # Height
    str = IntCol() # Strength
    spd = IntCol() # Speed
    jmp = IntCol() # Jumping
    end = IntCol() # Endurance
    ins = IntCol() # Inside Scoring
    dnk = IntCol() # Dunks/Layups
    ft = IntCol() # Free Throw Shooting
    two = IntCol() # Two-Point Shooting
    thr = IntCol() # Three-Point Shooting
    blk = IntCol() # Blocks
    stl = IntCol() # Steals
    drb = IntCol() # Dribbling
    pss = IntCol() # Passing
    reb = IntCol() # Rebounding

#    team = relationship('Team', backref='player')
#    team = relationship('Team')
#    draft_team = relationship('Team', backref='draft_player')
#    draft_team = relationship('Team')

    def __repr__(self):
        return "<Player('%s', '%s', '%s')>" % (self.id, self.name, self.pos)

class PlayerStats(SQLObject):
    player = ForeignKey('Player')
    team = ForeignKey('Team')
    game = IntCol() # INDEX
    season = IntCol() # INDEX
    playoffs = BoolCol() # INDEX
    won = BoolCol(default=False)
    start = BoolCol()
    min = FloatCol(default=0)
    fgm = IntCol(default=0)
    fga = IntCol(default=0)
    tpm = IntCol(default=0)
    tpa = IntCol(default=0)
    ftm = IntCol(default=0)
    fta = IntCol(default=0)
    oreb = IntCol(default=0)
    dreb = IntCol(default=0)
    ast = IntCol(default=0)
    tov = IntCol(default=0)
    stl = IntCol(default=0)
    blk = IntCol(default=0)
    pf = IntCol(default=0)
    pts = IntCol(default=0)
    # These are convenience variables for game simulation
    court_time = FloatCol(default=0)
    bench_time = FloatCol(default=0)
    energy = FloatCol(default=0)

#    player = relationship(Player, backref='stats')
#    team = relationship('Team')

class Team(SQLObject):
    region = StringCol(length=200)
    name = StringCol(length=200)
    abbrev = StringCol(length=4)
    conf = ForeignKey('Conf')
    div = ForeignKey('Div')
    won = IntCol(default=0)
    lost = IntCol(default=0)
    won_home = IntCol(default=0)
    lost_home = IntCol(default=0)
    won_road = IntCol(default=0)
    lost_road = IntCol(default=0)
    won_div = IntCol(default=0)
    lost_div = IntCol(default=0)
    won_conf = IntCol(default=0)
    lost_conf = IntCol(default=0)
    cash_season = IntCol(default=0)
    cash_tot = IntCol()

#    conf = relationship('Conf', backref='team')
#    div = relationship('Div', backref='team')

    def __repr__(self):
        return "<Team('%s', '%s')>" % (self.region, self.name)

class TeamHistory(SQLObject):
    team = ForeignKey('Team')
    conf = ForeignKey('Conf')
    div = ForeignKey('Div')
    season = IntCol() # INDEX
    region = StringCol(length=200)
    name = StringCol(length=200)
    abbrev = StringCol(length=4)
    won = IntCol()
    lost = IntCol()
    won_home = IntCol()
    lost_home = IntCol()
    won_road = IntCol()
    lost_road = IntCol()
    won_div = IntCol()
    lost_div = IntCol()
    won_conf = IntCol()
    lost_conf = IntCol()
    cash_season = IntCol()
    cash_tot = IntCol()

#    team = relationship(Team, backref='team_history')
#    conf = relationship('Conf', backref='team_history')
#    div = relationship('Div', backref='team_history')

    def __repr__(self):
        return "<TeamHistory('%s', '%s', '%s')>" % (self.region, self.name, self.season)

class TeamStats(SQLObject):
    game_id = IntCol() # INDEX
    team = ForeignKey('Team')
    opp_team = ForeignKey('Team')
    season = IntCol() # INDEX
    playoffs = BoolCol() # INDEX
    home = BoolCol()
    won = BoolCol(default=False)
    fgm = IntCol(default=0)
    fga = IntCol(default=0)
    tpm = IntCol(default=0) # Three-Pointers Made
    tpa = IntCol(default=0) # Three-Pointers Attempted
    ftm = IntCol(default=0) 
    fta = IntCol(default=0)
    oreb = IntCol(default=0) # Offensive Rebounds
    dreb = IntCol(default=0) # Defensive Rebounds
    ast = IntCol(default=0) # Assists
    tov = IntCol(default=0) # Turnovers
    stl = IntCol(default=0) # Steals
    blk = IntCol(default=0) # Blocks
    pf = IntCol(default=0) # Personal Fouls
    pts = IntCol(default=0)
    opp_pts = IntCol(default=0)
    attend = IntCol(default=0)
    cost = IntCol(default=0)

#    team = relationship(Team, backref='stats')
#    team = relationship(Team)
#    opp_team = relationship(Team)

class Conf(SQLObject):
    name = StringCol(length=200)

    def __repr__(self):
        return "<Conf('%s', '%s')>" % (self.id, self.name)

class Div(SQLObject):
    name = StringCol(length=200)
    conf = ForeignKey('Conf')

#    conf = relationship(Conf, backref='div')

    def __repr__(self):
        return "<Conf('%s', '%s', '%s')>" % (self.id, self.conf.id, self.name)

class State(SQLObject):
    team = ForeignKey('Team')
    season = IntCol()
    phase = IntCol()
    schedule = StringCol()

#    team = relationship(Team)

