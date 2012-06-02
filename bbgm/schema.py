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
        Column('abbrev', String(3)),
        Column('season', Integer),
        Column('won', Integer, server_default='0'),
        Column('lost', Integer, server_default='0'),
        Column('won_div', Integer, server_default='0'),
        Column('lost_div', Integer, server_default='0'),
        Column('won_conf', Integer, server_default='0'),
        Column('lost_conf', Integer, server_default='0'),
        Column('cash', Integer, server_default='0'),
        Column('playoffs', Boolean, server_default='0'),
        Column('conf_champs', Boolean, server_default='0'),
        Column('league_champs', Boolean, server_default='0')
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

    metadata.create_all(g.db_engine)

