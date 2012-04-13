import logging

from flask import g

from bbgm import app

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
file_handler = logging.FileHandler('example.log')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s '
    '[in %(pathname)s:%(lineno)d]'
))
logger.addHandler(file_handler)

def request_context_globals(league_id):
    """Call this within an app.test_request_context() to set other globals."""
    app.preprocess_request()  # So that g is available
    g.league_id = league_id
    # The following two lines are copied from bbgm.util.decorators.global_game_attributes
    g.db.execute('SELECT team_id, season, phase, schedule, version FROM %s_game_attributes LIMIT 1', (g.league_id,))
    g.user_team_id, g.season, g.phase, g.schedule, g.version = g.db.fetchone()
