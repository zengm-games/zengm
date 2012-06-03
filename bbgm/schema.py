from sqlalchemy import *  # This is okay because this file is entirely SQLAlchemy-related stuff

from flask import g

def create_core_tables():
    """Creates global database tables (not related to a specific league). This
    should be called so that these tables are created in the bbgm database.
    """
    metadata = MetaData()

    Table('users', metadata,
        Column('uid', Integer, primary_key=True),
        Column('username', String(255), unique=True),
        Column('password', String(255))
    )

    Table('leagues', metadata,
        Column('lid', Integer, primary_key=True),
        Column('uid', Integer, ForeignKey('users.uid'))
    )

    Table('teams', metadata,
        Column('tid', Integer, autoincrement=False, primary_key=True),
        Column('did', Integer),
        Column('name', String(255)),
        Column('region', String(255)),
        Column('abbrev', String(3))
    )

    metadata.create_all(g.db_engine)

def create_league_tables():
    """Creates leauge database tables. This should be called so that these
    tables are created in the bbgm_%d database.
    """
    metadata = MetaData()

    Table('conferences', metadata,
        Column('cid', Integer, primary_key=True, autoincrement=False),
        Column('name', String(255))
    )

    Table('divisions', metadata,
        Column('did', Integer, primary_key=True, autoincrement=False),
        Column('cid', Integer),
        Column('name', String(255))
    )

    Table('game_attributes', metadata,
        Column('tid', Integer),
        Column('season', Integer),
        Column('phase', Integer),
        Column('games_in_progress', Boolean, server_default='0'),
        Column('stop_games', Boolean, server_default='0'),
        Column('pm_status', String(255)),
        Column('pm_phase', String(255)),
        Column('version', String(255))
    )

    Table('team_attributes', metadata,
        Column('tid', Integer, autoincrement=False, primary_key=True),
        Column('did', Integer),
        Column('name', String(255)),
        Column('region', String(255)),
        Column('abbrev', String(3)),
        Column('season', Integer),
        Column('won', Integer, server_default='0'),
        Column('lost', Integer, server_default='0'),
        Column('won_div', Integer, server_default='0'),
        Column('lost_div', Integer, server_default='0'),
        Column('won_conf', Integer, server_default='0'),
        Column('lost_conf', Integer, server_default='0'),
        Column('cash', Integer, server_default='10000000'),
        Column('playoffs', Boolean, server_default='0'),
        Column('conf_champs', Boolean, server_default='0'),
        Column('league_champs', Boolean, server_default='0')
    )

    Table('schedule', metadata,
        Column('gid', Integer, primary_key=True),
        Column('home_tid', Integer),
        Column('away_tid', Integer),
        Column('in_progress_timestamp', Integer, server_default='0')
    )

    Table('player_attributes', metadata,
        Column('pid', Integer, primary_key=True),
        Column('name', String(255)),
        Column('tid', Integer),
        Column('pos', String(2)),
        Column('roster_order', Integer),
        Column('hgt', Integer),  # inches
        Column('weight', Integer),  # pounds
        Column('born_year', Integer),  # YYYY for birth year
        Column('born_loc', String(255)),  # City, State/Country
        Column('college', String(255)),  # or HS or country, if applicable
        Column('draft_year', Integer),
        Column('round', Integer),
        Column('draft_pick', Integer),
        Column('draft_tid', Integer),
        Column('contract_amount', Integer),
        Column('contract_exp', Integer),
        Column('free_agent_times_asked', Float, server_default='0.0'),
        Column('years_free_agent', Integer, server_default='0')
    )

    Table('released_players_salaries', metadata,
        Column('pid', Integer),
        Column('tid', Integer),
        Column('contract_amount', Integer),
        Column('contract_exp', Integer)
    )

    Table('player_ratings', metadata,
        Column('pid', Integer, autoincrement=False, primary_key=True),
        Column('season', Integer, autoincrement=False, primary_key=True),
        Column('ovr', Integer),
        Column('hgt', Integer),
        Column('stre', Integer),
        Column('spd', Integer),
        Column('jmp', Integer),
        Column('end', Integer),
        Column('ins', Integer),
        Column('dnk', Integer),
        Column('ft', Integer),
        Column('fg', Integer),
        Column('tp', Integer),
        Column('blk', Integer),
        Column('stl', Integer),
        Column('drb', Integer),
        Column('pss', Integer),
        Column('reb', Integer),
        Column('pot', Integer)
    )

    Table('player_stats', metadata,
        Column('pid', Integer, autoincrement=False, primary_key=True),
        Column('tid', Integer),
        Column('gid', Integer, autoincrement=False, primary_key=True),
        Column('season', Integer),
        Column('playoffs', Boolean),
        Column('gs', Integer),
        Column('min', Integer),
        Column('fg', Integer),
        Column('fga', Integer),
        Column('tp', Integer),
        Column('tpa', Integer),
        Column('ft', Integer),
        Column('fta', Integer),
        Column('orb', Integer),
        Column('drb', Integer),
        Column('ast', Integer),
        Column('tov', Integer),
        Column('stl', Integer),
        Column('blk', Integer),
        Column('pf', Integer),
        Column('pts', Integer)
    )

    Table('team_stats', metadata,
        Column('tid', Integer, autoincrement=False, primary_key=True),
        Column('opp_tid', Integer),
        Column('gid', Integer, autoincrement=False, primary_key=True),
        Column('season', Integer),
        Column('playoffs', Boolean),
        Column('won', Boolean),
        Column('home', Boolean),
        Column('min', Integer),
        Column('fg', Integer),
        Column('fga', Integer),
        Column('tp', Integer),
        Column('tpa', Integer),
        Column('ft', Integer),
        Column('fta', Integer),
        Column('orb', Integer),
        Column('drb', Integer),
        Column('ast', Integer),
        Column('tov', Integer),
        Column('stl', Integer),
        Column('blk', Integer),
        Column('pf', Integer),
        Column('pts', Integer),
        Column('opp_pts', Integer),
        Column('att', Integer),
        Column('cost', Integer)
    )

    Table('playoff_series', metadata,
        Column('sid', Integer, primary_key=True),
        Column('round', Integer),
        Column('season', Integer),
        Column('tid_home', Integer),
        Column('tid_away', Integer),
        Column('seed_home', Integer),
        Column('seed_away', Integer),
        Column('won_home', Integer),
        Column('won_away', Integer)
    )

    Table('draft_results', metadata,
        Column('season', Integer, autoincrement=False, primary_key=True),
        Column('round', Integer, autoincrement=False, primary_key=True),
        Column('pick', Integer, autoincrement=False, primary_key=True),
        Column('tid', Integer),
        Column('abbrev', String(3)),
        Column('pid', Integer),
        Column('name', String(255)),
        Column('pos', String(2)),
        Column('born_year', Integer),  # YYYY for birth year
        Column('ovr', Integer),
        Column('pot', Integer)
    )

    Table('negotiations', metadata,
        Column('pid', Integer, autoincrement=False, primary_key=True),
        Column('team_amount', Integer),
        Column('team_years', Integer),
        Column('player_amount', Integer),
        Column('player_years', Integer),
        Column('num_offers_made', Integer),
        Column('max_offers', Integer),
        Column('resigning', Boolean, server_default='0')
    )

    Table('trade', metadata,
        Column('tid', Integer),
        Column('pids_user', Text),
        Column('pids_other', Text)
    )

    Table('awards', metadata,
        Column('season', Integer, autoincrement=False, primary_key=True),
        Column('bre_tid', Integer),
        Column('bre_abbrev', String(3)),
        Column('bre_region', String(255)),
        Column('bre_name', String(255)),
        Column('bre_won', Integer),
        Column('bre_lost', Integer),
        Column('brw_tid', Integer),
        Column('brw_abbrev', String(3)),
        Column('brw_region', String(255)),
        Column('brw_name', String(255)),
        Column('brw_won', Integer),
        Column('brw_lost', Integer),
        Column('mvp_pid', Integer),
        Column('mvp_name', String(255)),
        Column('mvp_tid', Integer),
        Column('mvp_abbrev', String(3)),
        Column('mvp_pts', Float),
        Column('mvp_trb', Float),
        Column('mvp_ast', Float),
        Column('dpoy_pid', Integer),
        Column('dpoy_name', String(255)),
        Column('dpoy_tid', Integer),
        Column('dpoy_abbrev', String(3)),
        Column('dpoy_trb', Float),
        Column('dpoy_blk', Float),
        Column('dpoy_stl', Float),
        Column('smoy_pid', Integer),
        Column('smoy_name', String(255)),
        Column('smoy_tid', Integer),
        Column('smoy_abbrev', String(3)),
        Column('smoy_pts', Float),
        Column('smoy_trb', Float),
        Column('smoy_ast', Float),
        Column('roy_pid', Integer),
        Column('roy_name', String(255)),
        Column('roy_tid', Integer),
        Column('roy_abbrev', String(3)),
        Column('roy_pts', Float),
        Column('roy_trb', Float),
        Column('roy_ast', Float)
    )

    Table('awards_all_league', metadata,
        Column('rank', Integer, primary_key=True),
        Column('season', Integer),
        Column('team_type', String(9)),
        Column('pid', Integer),
        Column('name', String(255)),
        Column('abbrev', String(3)),
        Column('pts', Float),
        Column('trb', Float),
        Column('ast', Float),
        Column('blk', Float),
        Column('stl', Float)
    )

    metadata.create_all(g.db_engine)

