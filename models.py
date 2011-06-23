from sqlalchemy import Table, Column, Boolean, Float, Integer, String, Text, MetaData, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref

Base = declarative_base()

class Player(Base):
    __tablename__ = 'player'
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True)

    name = Column(String(200))
    team_id = Column(Integer, ForeignKey('team.id'))
    pos = Column(String(2))
    roster_pos = Column(Integer)

    # Measurements
    height = Column(Integer) # inches
    weight = Column(Integer) # pounds
    age = Column(Integer)

    # Bio info
    born = Column(String(200)) # City, State/Country
    college = Column(String(200)) # or HS or country, if applicable

    # Draft info
    draft_season = Column(Integer)
    draft_round = Column(Integer)
    draft_pick = Column(Integer)
    draft_team_id = Column(Integer, ForeignKey('team.id'))

    # Contract info
    con_amt = Column(Integer)
    con_exp = Column(Integer)

    # Ratings
    ovr = Column(Integer) # Overall
    pot = Column(Integer) # Potential
    hgt = Column(Integer) # Height
    str = Column(Integer) # Strength
    spd = Column(Integer) # Speed
    jmp = Column(Integer) # Jumping
    end = Column(Integer) # Endurance
    ins = Column(Integer) # Inside Scoring
    dnk = Column(Integer) # Dunks/Layups
    ft = Column(Integer)  # Free Throw Shooting
    two = Column(Integer) # Two-Point Shooting
    thr = Column(Integer) # Three-Point Shooting
    blk = Column(Integer) # blk
    stl = Column(Integer) # stl
    drb = Column(Integer) # Dribbling
    pss = Column(Integer) # Passing
    reb = Column(Integer) # Rebounding

    team = relationship('Team', backref='player', primaryjoin=('Player.team_id==Team.id'))
    draft_team = relationship('Team', backref='draft_player', primaryjoin=('Player.draft_team_id==Team.id'))

    def __repr__(self):
        return "<Player('%s', '%s')>" % (self.name, self.pos)

class PlayerStats(Base):
    __tablename__ = 'player_stats'
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True)

    player_id = Column(Integer, ForeignKey('player.id'))
    team_id = Column(Integer, ForeignKey('team.id'))
    game_id = Column(Integer) # INDEX
    season = Column(Integer) # INDEX
    playoffs = Column(Boolean) # INDEX
    won = Column(Boolean, default=False)
    start = Column(Boolean)
    min = Column(Float, default=0)
    fgm = Column(Integer, default=0)
    fga = Column(Integer, default=0)
    tpm = Column(Integer, default=0)
    tpa = Column(Integer, default=0)
    ftm = Column(Integer, default=0)
    fta = Column(Integer, default=0)
    oreb = Column(Integer, default=0)
    dreb = Column(Integer, default=0)
    ast = Column(Integer, default=0)
    tov = Column(Integer, default=0)
    stl = Column(Integer, default=0)
    blk = Column(Integer, default=0)
    pf = Column(Integer, default=0)
    pts = Column(Integer, default=0)
    # These are convenience variables for game simulation
    court_time = Column(Float, default=0)
    bench_time = Column(Float, default=0)
    energy = Column(Float, default=0)

    player = relationship(Player, backref='stats')
    team = relationship('Team')

class Team(Base):
    __tablename__ = 'team'
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True)

    region = Column(String(200))
    name = Column(String(200))
    abbrev = Column(String(4))
    conf_id = Column(Integer, ForeignKey('conf.id'))
    div_id = Column(Integer, ForeignKey('div.id'))
    won = Column(Integer, default=0)
    lost = Column(Integer, default=0)
    won_home = Column(Integer, default=0)
    lost_home = Column(Integer, default=0)
    won_road = Column(Integer, default=0)
    lost_road = Column(Integer, default=0)
    won_div = Column(Integer, default=0)
    lost_div = Column(Integer, default=0)
    won_conf = Column(Integer, default=0)
    lost_conf = Column(Integer, default=0)
    cash_season = Column(Integer, default=0)
    cash_tot = Column(Integer)

    conf = relationship('Conf', backref='team')
    div = relationship('Div', backref='team')

    def __repr__(self):
        return "<Team('%s', '%s')>" % (self.region, self.name)

class TeamHistory(Base):
    __tablename__ = 'team_history'
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True)

    team_id = Column(Integer, ForeignKey('team.id'))
    conf_id = Column(Integer, ForeignKey('conf.id'))
    div_id = Column(Integer, ForeignKey('div.id'))
    season = Column(Integer) # INDEX
    region = Column(String(200))
    name = Column(String(200))
    abbrev = Column(String(4))
    won = Column(Integer)
    lost = Column(Integer)
    won_home = Column(Integer)
    lost_home = Column(Integer)
    won_road = Column(Integer)
    lost_road = Column(Integer)
    won_div = Column(Integer)
    lost_div = Column(Integer)
    won_conf = Column(Integer)
    lost_conf = Column(Integer)
    cash_season = Column(Integer)
    cash_tot = Column(Integer)

    team = relationship(Team)
    conf = relationship('Conf')
    div = relationship('Div')

    def __repr__(self):
        return "<TeamHistory('%s', '%s', '%s')>" % (self.region, self.name, self.season)

class TeamStats(Base):
    __tablename__ = 'team_stats'
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True)

    game_id = Column(Integer) # INDEX
    team_id = Column(Integer, ForeignKey('team.id'))
    opp_team_id = Column(Integer, ForeignKey('team.id'))
    season = Column(Integer) # INDEX
    playoffs = Column(Boolean) # INDEX
    home = Column(Boolean)
    won = Column(Boolean, default=False)
    fgm = Column(Integer, default=0)
    fga = Column(Integer, default=0)
    tpm = Column(Integer, default=0)
    tpa = Column(Integer, default=0)
    ftm = Column(Integer, default=0)
    fta = Column(Integer, default=0)
    oreb = Column(Integer, default=0)
    dreb = Column(Integer, default=0)
    ast = Column(Integer, default=0)
    tov = Column(Integer, default=0)
    stl = Column(Integer, default=0)
    blk = Column(Integer, default=0)
    pf = Column(Integer, default=0)
    pts = Column(Integer, default=0)
    opp_pts = Column(Integer, default=0)
    attend = Column(Integer, default=0)
    cost = Column(Integer, default=0)

    team = relationship(Team, backref='stats', primaryjoin=(team_id==Team.id))
    opp_team = relationship(Team, primaryjoin=(opp_team_id==Team.id))

class Conf(Base):
    __tablename__ = 'conf'
    __table_args__ = {'sqlite_autoincrement': True}

    # Keys
    id = Column(Integer, primary_key=True)

    name = Column(String(200))

    def __repr__(self):
        return "<Conf('%s', '%s')>" % (self.id, self.name)

class Div(Base):
    __tablename__ = 'div'
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True)
    conf_id = Column(Integer, ForeignKey('conf.id'))

    name = Column(String(200))

    conf = relationship(Conf, backref='div')

    def __repr__(self):
        return "<Div('%s', '%s', '%s')>" % (self.id, self.name, self.conf.name)

class State(Base):
    __tablename__ = 'state'
    __table_args__ = {'sqlite_autoincrement': True}

    id = Column(Integer, primary_key=True)

    team_id = Column(Integer, ForeignKey('team.id'))
    season = Column(Integer)
    phase = Column(Integer)
    schedule = Column(Text)

    team = relationship(Team)

