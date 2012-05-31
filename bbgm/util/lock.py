"""
bbgm.util.lock

These functions all deal with locking game state when there is some blocking
action in progress, currently one of these things:

* Game simulation is in progress
* User is negotiating a contract

There are also functions to check if it is permissible to start one of those
actions.
"""

from flask import g

def set_games_in_progress(status):
    g.dbex('UPDATE game_attributes SET games_in_progress = :games_in_progress', games_in_progress=status)

def set_negotiation_in_progress(status):
    g.dbex('UPDATE game_attributes SET negotiation_in_progress = :negotiation_in_progress', negotiation_in_progress=status)

def games_in_progress():
    r = g.dbex('SELECT games_in_progress FROM game_attributes')
    in_progress, = r.fetchone()
    return in_progress

def negotiation_in_progress():
    r = g.dbex('SELECT negotiation_in_progress FROM game_attributes')
    in_progress, = r.fetchone()
    return in_progress

def can_start_games():
    r = g.dbex('SELECT games_in_progress, negotiation_in_progress FROM game_attributes')
    games_in_progress, negotiation_in_progress = r.fetchone()

    if games_in_progress:
        return False

    r = g.dbex('SELECT COUNT(*) FROM negotiations WHERE resigning = 0')
    n_negotiations, = r.fetchone()
    if negotiation_in_progress or n_negotiations > 0:
        return False

    return True

def can_start_negotiation():
    r = g.dbex('SELECT games_in_progress, negotiation_in_progress FROM game_attributes')
    games_in_progress, negotiation_in_progress = r.fetchone()

    if games_in_progress:
        return False

    # Allow multiple parallel negotiations (ignore negotiation_in_progress) only for resigning players
    r = g.dbex('SELECT 1 FROM negotiations WHERE resigning = 0')
    if r.rowcount:
        return False

    return True
