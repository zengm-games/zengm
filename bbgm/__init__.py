from flask import Flask, g
from flask.ext.assets import Environment, Bundle
import logging

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
        if hasattr(g, 'lid'):
            record.lid = g.lid
        else:
            record.lid = '?'
        return True
fh = logging.FileHandler('debug.log')
fh.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s %(levelname)s: League %(lid)s: %(message)s [in %(pathname)s:%(lineno)d]')
fh.setFormatter(formatter)
f = ContextFilter()
app.logger.addFilter(f)
app.logger.setLevel(logging.DEBUG)
app.logger.addHandler(fh)
app.logger.debug('Started')

# Assets
assets = Environment(app)

# Internal imports
import bbgm.views
import bbgm.league_views
from bbgm import db
from bbgm import schema


def init_db():
    db.connect()

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
    db.connect('bbgm')

    # Create new tables
    schema.create_core_tables()
    f = app.open_resource('data/core.sql')
    db.bulk_execute(f)

    if app.config['DB_POSTGRES']:
        g.db.connection.connection.set_isolation_level(1)

    g.dbex('COMMIT')  # Because bbgm.teardown_request will not be called

@app.before_request
def before_request():
    # Database crap
    if g.lid >= 0:
        db.connect('bbgm_%d' % (g.lid,))
    else:
        db.connect('bbgm')

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
