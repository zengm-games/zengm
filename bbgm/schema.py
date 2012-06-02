from sqlalchemy import *  # This is okay because this file is entirely SQLAlchemy-related stuff

from flask import g

def create_core_tables():
    """Creates global database tables (not related to a specific league). This
    should be called so that these tables are created in the bbgm database."""
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
        Column('playoffs', Boolean, server_default='0'), # Default False
        Column('conf_champs', Boolean, server_default='0'), # Default False
        Column('league_champs', Boolean, server_default='0') # Default False
    )

    metadata.create_all(g.db_engine)

