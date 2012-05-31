from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker

from flask import g

from bbgm import app

def connect(database=''):
    """This probably has too much magic for its own good. It connects to the SQL
    server, loading the database passed as an argument if specified or no
    database otherwise, and creates the following global variables:

        g.db: SQLAlchemy connection
        g.db_engine: SQLAlchemy engine
        g.dbex: Convenience function to execute a query with bind parameters
            (see: bbgm.db.execute)
        g.dbexmany: Convenience function to execute a query with multiple sets
            of bind parameters (see: bbgm.db.executemany)

    Also, if there is already a connection and this is called again (e.g. to
    switch to another database), then changes are COMMITed and the previous
    connection is closed before a new one is opened.
    """

    if hasattr(g, 'db'):
        g.dbex('COMMIT')
        g.db.close()

    app.logger.debug('Connecting to database \'%s\'' % (database,))
    if app.config['DB_POSTGRES']:
        g.db_engine = create_engine('postgresql+psycopg2://%s:%s@localhost/%s' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD'], database))
    else:
        g.db_engine = create_engine('mysql+mysqldb://%s:%s@localhost/%s' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD'], database))
#        g.db_engine = create_engine('mysql+pymysql://%s:%s@localhost/' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD']))
#        g.db_engine = create_engine('mysql+oursql://%s:%s@localhost/?default_charset=1' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD']))
    metadata = MetaData(bind=g.db_engine)
    g.db = g.db_engine.connect()

    g.dbex = execute
    g.dbexmany = executemany


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
    text" everywhere. Note that this could easily be merged with
    bbgm.db.execute, but I'd like to keep things explicit because so often huge
    performance gains can be had by executing multiple queries at once.
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
