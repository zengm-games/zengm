from juggernaut import Juggernaut
import time

from flask import url_for, g, render_template

from bbgm import app
from bbgm.util import lock
import bbgm.util.const as c

jug = Juggernaut()

def options(keys=None):
    """Set the options to be shown in the play button.

    Arguments:
        keys: A list of strings identifying the options to be shown. If left
            blank, the default options are shown based on the game state.

    Returns:
        A list of dicts, each dict containing the properties needed to build the
        play button.
    """
    all_options = [{'id': 'stop', 'url': url_for('play', lid=g.lid, amount='stop'), 'label': 'Stop', 'normal_link': False},
                   {'id': 'day', 'url': url_for('play', lid=g.lid, amount='day'), 'label': 'One day', 'normal_link': False},
                   {'id': 'week', 'url': url_for('play', lid=g.lid, amount='week'), 'label': 'One week', 'normal_link': False},
                   {'id': 'month', 'url': url_for('play', lid=g.lid, amount='month'), 'label': 'One month', 'normal_link': False},
                   {'id': 'until_playoffs', 'url': url_for('play', lid=g.lid, amount='until_playoffs'), 'label': 'Until playoffs', 'normal_link': False},
                   {'id': 'through_playoffs', 'url': url_for('play', lid=g.lid, amount='through_playoffs'), 'label': 'Through playoffs', 'normal_link': False},
                   {'id': 'until_draft', 'url': url_for('play', lid=g.lid, amount='until_draft'), 'label': 'Until draft', 'normal_link': False},
                   {'id': 'view_draft', 'url': url_for('draft_'), 'label': 'View draft', 'normal_link': True},
                   {'id': 'until_resign_players', 'url': url_for('play', lid=g.lid, amount='until_resign_players'), 'label': 'Resign players with expiring contracts', 'normal_link': False},
                   {'id': 'until_free_agency', 'url': url_for('play', lid=g.lid, amount='until_free_agency'), 'label': 'Until free agency', 'normal_link': False},
                   {'id': 'until_preseason', 'url': url_for('play', lid=g.lid, amount='until_preseason'), 'label': 'Until preseason', 'normal_link': False},
                   {'id': 'until_regular_season', 'url': url_for('play', lid=g.lid, amount='until_regular_season'), 'label': 'Until regular season', 'normal_link': False},
                   {'id': 'contract_negotiation', 'url': url_for('negotiation_list', lid=g.lid), 'label': 'Continue contract negotiation', 'normal_link': True},
                   {'id': 'contract_negotiation_list', 'url': url_for('negotiation_list', lid=g.lid), 'label': 'Continue resigning players', 'normal_link': True}]

    if not keys:
        # Preseason
        if g.phase == c.PHASE_PRESEASON:
            keys = ['until_regular_season']
        # Regular season - pre trading deadline
        elif g.phase == c.PHASE_REGULAR_SEASON:
            keys = ['day', 'week', 'month', 'until_playoffs']
        # Regular season - post trading deadline
        elif g.phase == c.PHASE_AFTER_TRADE_DEADLINE:
            keys = ['day', 'week', 'month', 'until_playoffs']
        # Playoffs
        elif g.phase == c.PHASE_PLAYOFFS:
            keys = ['day', 'week', 'month', 'through_playoffs']
        # Offseason - pre draft
        elif g.phase == c.PHASE_BEFORE_DRAFT:
            keys = ['until_draft']
        # Draft
        elif g.phase == c.PHASE_DRAFT:
            keys = ['view_draft']
        # Offseason - post draft
        elif g.phase == c.PHASE_AFTER_DRAFT:
            keys = ['until_resign_players']
        # Offseason - resign players
        elif g.phase == c.PHASE_RESIGN_PLAYERS:
            keys = ['contract_negotiation_list', 'until_free_agency']
        # Offseason - free agency
        elif g.phase == c.PHASE_FREE_AGENCY:
            keys = ['until_preseason']

        if lock.games_in_progress():
            keys = ['stop']
        if lock.negotiation_in_progress() and g.phase != c.PHASE_RESIGN_PLAYERS:
            keys = ['contract_negotiation']

    # This code is very ugly. Basically I just want to filter all_options into
    # some_options based on if the ID matches one of the keys.
    ids = [o['id'] for o in all_options]
    some_options = []
    for key in keys:
        i = 0
        for id_ in ids:
            if id_ == key:
                some_options.append(all_options[i])
                break
            i += 1

    return some_options

def set_status(status=None):
    """Save status to database and push to client.

    If no status is given, load the last status from the database and push that
    to the client.

    Args:
        status: A string containing the current status message to be pushed to
            the client.
    """
    r = g.dbex('SELECT pm_status FROM game_attributes WHERE season = :season', season=g.season)
    old_status, = r.fetchone()

    if not status:
        status = old_status
        jug.publish('%d_status' % (g.lid,), status)
    if status != old_status:
        g.dbex('UPDATE game_attributes SET pm_status = :pm_status WHERE season = :season', pm_status=status, season=g.season)
        jug.publish('%d_status' % (g.lid,), status)
        app.logger.debug('Set status: %s' % (status,))

def set_phase(phase_text=None):
    """Save phase text to database and push to client.

    If no phase text is given, load the last phase text from the database and
    push that to the client.

    Args:
        phase_text: A string containing the current phase text to be pushed to
            the client.
    """
    r = g.dbex('SELECT pm_phase FROM game_attributes WHERE season = :season', season=g.season)
    old_phase_text, = r.fetchone()

    if not phase_text:
        phase_text = old_phase_text
        jug.publish('%d_phase' % (g.lid,), phase_text)
    if phase_text != old_phase_text:
        g.dbex('UPDATE game_attributes SET pm_phase = :pm_phase WHERE season = :season', pm_phase=phase_text, season=g.season)
        jug.publish('%d_phase' % (g.lid,), phase_text)
        app.logger.debug('Set phase: %s' % (phase_text,))

def refresh_options():
    """Get current options based on game state and push rendered play button
    to client.
    """
    button = render_template('play_button.html', lid=g.lid, options=options())
    jug.publish('%d_button' % (g.lid,), button)

