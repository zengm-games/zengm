from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker

from flask import g

from bbgm import app

def connect(database=''):
    app.logger.debug('Connecting to database \'%s\'' % (database,))
    if app.config['DB_POSTGRES']:
        engine = create_engine('postgresql+psycopg2://%s:%s@localhost/%s' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD'], database))
    else:
        engine = create_engine('mysql+mysqldb://%s:%s@localhost/%s' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD'], database))
#        engine = create_engine('mysql+pymysql://%s:%s@localhost/' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD']))
#        engine = create_engine('mysql+oursql://%s:%s@localhost/?default_charset=1' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD']))
    metadata = MetaData(bind=engine)
    con = engine.connect()
    return con


def execute(query, **kwargs):
    """Convenience function so I don't need to be doing "from sqlalchemy import
    text" everywhere.
    """
#    if len(kwargs):
#        return g.db.execute(text(query), **kwargs)
#    else:
#        return g.db.execute(query)
    return g.db.execute(text(query).execution_options(autocommit=False), **kwargs)


def executemany(query, params):
    """Convenience function so I don't need to be doing "from sqlalchemy import
    text" everywhere.
    """
    return g.db.execute(text(query).execution_options(autocommit=False), params)


def bulk_execute(f):
    """Executes a series of SQL queries, even if split across multiple lines.

    This emulates the functionality of executescript from sqlite3. It won't work
    if either you have SQL queries that don't end in a semicolon followed by a
    newline ;\n or you have a semicolon followed by a newline that is not at the
    end of an SQL query.

    Args:
        f: An iterable (such as a file handle) containing lines of SQL queries
    """
    sql = ''
    for line in f:
        sql += line
        if line.endswith(';\n'):
            g.dbex(sql)
            sql = ''
