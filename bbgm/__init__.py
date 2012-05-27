from flask import Flask, g
from flask.ext.assets import Environment, Bundle
import logging
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker

BBGM_VERSION = '2.0.0alpha'
DEBUG = True
SECRET_KEY = 'A0Zr98j/gry43 etwN]LWX/,?RT'
DB = 'bbgm'
DB_USERNAME = 'testuser'
DB_PASSWORD = 'test623'
DB_POSTGRES = False
TRY_NUMPY = True
if DB_POSTGRES:
    DB_USERNAME = 'jdscheff'

app = Flask(__name__)
app.config.from_object(__name__)


# Logging
class ContextFilter(logging.Filter):
    """This filter injects the league ID, if available into the log."""
    def filter(self, record):
        if hasattr(g, 'league_id'):
            record.league_id = g.league_id
        else:
            record.league_id = '?'
        return True
fh = logging.FileHandler('debug.log')
fh.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s %(levelname)s: League %(league_id)s: %(message)s [in %(pathname)s:%(lineno)d]')
fh.setFormatter(formatter)
f = ContextFilter()
app.logger.addFilter(f)
app.logger.setLevel(logging.DEBUG)
app.logger.addHandler(fh)
app.logger.debug('Started')

# Assets
assets = Environment(app)

# Views
import bbgm.views
import bbgm.league_views


def connect_db(database=''):
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


def db_execute(query, **kwargs):
    """Convenience function so I don't need to be doing "from sqlalchemy import
    text" everywhere.
    """
#    if len(kwargs):
#        return g.db.execute(text(query), **kwargs)
#    else:
#        return g.db.execute(query)
    return g.db.execute(text(query).execution_options(autocommit=False), **kwargs)


def db_executemany(query, params):
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


def init_db():
    g.db = connect_db()
    g.dbex = db_execute

    if app.config['DB_POSTGRES']:
        g.db.connection.connection.set_isolation_level(0)

    # Delete any current bbgm databases
    if app.config['DB_POSTGRES']:
        r = g.dbex("SELECT datname FROM pg_database WHERE datname LIKE 'bbgm%'")
    else:
        r = g.dbex("SHOW DATABASES LIKE 'bbgm%'")
    for database, in r.fetchall():
        app.logger.debug('Dropping database %s' % (database,))
        g.dbex('DROP DATABASE %s' % (database,))

    app.logger.debug('Creating new bbgm database and tables')

    # Create new database
    g.dbex('CREATE DATABASE bbgm')
    if not app.config['DB_POSTGRES']:
        g.dbex('GRANT ALL ON bbgm.* TO %s@localhost IDENTIFIED BY \'%s\'' % (app.config['DB_USERNAME'], app.config['DB_PASSWORD']))
    g.db.close()
    g.db = connect_db('bbgm')

    # Create new tables
    f = app.open_resource('data/core.sql')
    bulk_execute(f)

    if app.config['DB_POSTGRES']:
        g.db.connection.connection.set_isolation_level(1)


@app.before_request
def before_request():
    # Database crap
    if g.league_id >= 0:
        g.db = connect_db('bbgm_%d' % (g.league_id,))
    else:
        g.db = connect_db('bbgm')
    g.dbex = db_execute
    g.dbexmany = db_executemany

    # Non-database crap - should probably be stored elsewhere. Also, changing
    # some of these might break stuff.
    g.bbgm_version = app.config['BBGM_VERSION']
    g.starting_season = 2012
    g.salary_cap = 60000
    g.ticket_price = 45
    g.num_teams = 30
    g.season_length = 82


@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.dbex('COMMIT')
        g.db.close()


@app.template_filter()
def number_format(value, tsep=',', dsep='.'):
    s = unicode(value)
    cnt = 0
    numchars = dsep + '0123456789'
    ls = len(s)
    while cnt < ls and s[cnt] not in numchars:
        cnt += 1

    lhs = s[:cnt]
    s = s[cnt:]
    if not dsep:
        cnt = -1
    else:
        cnt = s.rfind(dsep)
    if cnt > 0:
        rhs = dsep + s[cnt + 1:]
        s = s[:cnt]
    else:
        rhs = ''

    splt = ''
    while s != '':
        splt = s[-3:] + tsep + splt
        s = s[:-3]

    return lhs + splt[:-1] + rhs
