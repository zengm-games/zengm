from sqlalchemy import Table, Column, Boolean, Float, Integer, String, Text, MetaData, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref

Base = declarative_base()

class Player(Base):
    __tablename__ = 'player'

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
    ft = Column(Integer) # Free Throw Shooting
    two = Column(Integer) # Two-Point Shooting
    thr = Column(Integer) # Three-Point Shooting
    blk = Column(Integer) # Blocks
    stl = Column(Integer) # Steals
    drb = Column(Integer) # Dribbling
    pss = Column(Integer) # Passing
    reb = Column(Integer) # Rebounding

    team = relationship('Team', backref='player')
    draft_team = relationship('Team', backref='draft_player')

    def __unicode__(self):
        return "<Player('%s', '%s')>" % (self.name, self.position)

class PlayerStats(Base):
    __tablename__ = 'player_stats'

    id = Column(Integer, primary_key=True)

    player_id = Column(Integer, ForeignKey('player.id'))
    team_id = Column(Integer, ForeignKey('team.id'))
    game_id = Column(Integer) # INDEX
    season = Column(Integer) # INDEX
    playoffs = Column(Boolean) # INDEX
    won = Column(Boolean, default=False)
    starter = Column(Boolean)
    minutes = Column(Float, default=0)
    field_goals_made = Column(Integer, default=0)
    field_goals_attempted = Column(Integer, default=0)
    three_pointers_made = Column(Integer, default=0)
    three_pointers_attempted = Column(Integer, default=0)
    free_throws_made = Column(Integer, default=0)
    free_throws_attempted = Column(Integer, default=0)
    offensive_rebounds = Column(Integer, default=0)
    defensive_rebounds = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    turnovers = Column(Integer, default=0)
    steals = Column(Integer, default=0)
    blocks = Column(Integer, default=0)
    personal_fouls = Column(Integer, default=0)
    points = Column(Integer, default=0)
    # These are convenience variables for game simulation
    court_time = Column(Float, default=0)
    bench_time = Column(Float, default=0)
    energy = Column(Float, default=0)

    player = relationship(Player, backref='stats')
    team = relationship('Team')

class Team(Base):
    __tablename__ = 'team'

    id = Column(Integer, primary_key=True)

    region = Column(String(200))
    name = Column(String(200))
    abbreviation = Column(String(4))
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
    cash_total = Column(Integer)

    conf = relationship('Conf', backref='team')
    div = relationship('Div', backref='team')

    def __unicode__(self):
        return "<Team('%s', '%s')>" % (self.region, self.name)

class TeamHistory(Base):
    __tablename__ = 'team_history'

    id = Column(Integer, primary_key=True)

    team_id = Column(Integer, ForeignKey('team.id'))
    conf_id = Column(Integer, ForeignKey('conf.id'))
    div_id = Column(Integer, ForeignKey('div.id'))
    season = Column(Integer) # INDEX
    region = Column(String(200))
    name = Column(String(200))
    abbreviation = Column(String(4))
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
    cash_total = Column(Integer)

    team = relationship(Team, backref='team_history')
    conf = relationship('Conf', backref='team_history')
    div = relationship('Div', backref='team_history')

    def __unicode__(self):
        return "<TeamHistory('%s', '%s', '%s')>" % (self.region, self.name, self.season)

class TeamStats(Base):
    __tablename__ = 'team_stats'

    id = Column(Integer, primary_key=True)

    game_id = Column(Integer) # INDEX
    team_id = Column(Integer, ForeignKey('team.id'))
    opp_team_id = Column(Integer, ForeignKey('team.id'))
    season = Column(Integer) # INDEX
    playoffs = Column(Boolean) # INDEX
    home = Column(Boolean)
    won = Column(Boolean, default=False)
    field_goals_made = Column(Integer, default=0)
    field_goals_attempted = Column(Integer, default=0)
    three_pointers_made = Column(Integer, default=0)
    three_pointers_attempted = Column(Integer, default=0)
    free_throws_made = Column(Integer, default=0)
    free_throws_attempted = Column(Integer, default=0)
    offensive_rebounds = Column(Integer, default=0)
    defensive_rebounds = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    turnovers = Column(Integer, default=0)
    steals = Column(Integer, default=0)
    blocks = Column(Integer, default=0)
    personal_fouls = Column(Integer, default=0)
    points = Column(Integer, default=0)
    opponent_points = Column(Integer, default=0)
    attendance = Column(Integer, default=0)
    cost = Column(Integer, default=0)

    team = relationship(Team, backref='stats')
    opp_team = relationship(Team)

class Conf(Base):
    __tablename__ = 'conf'

    id = Column(Integer, primary_key=True)

    name = Column(String(200))

    def __unicode__(self):
        return "<Conf('%s')>" % (self.name,)

class Div(Base):
    __tablename__ = 'div'

    id = Column(Integer, primary_key=True)

    conf_id = Column(Integer, ForeignKey('conf.id'))
    name = Column(String(200))

    conf = relationship(Conf, backref='div')

    def __unicode__(self):
        return "<Div('%s')>" % (self.name,)

class State(Base):
    __tablename__ = 'state'

    id = Column(Integer, primary_key=True)

    team_id = Column(Integer, ForeignKey('team.id'))
    season = Column(Integer)
    phase = Column(Integer)
    schedule = Column(Text)

    team = relationship(Team)

