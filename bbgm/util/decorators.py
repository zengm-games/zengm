from functools import wraps

from flask import session, g, redirect, url_for, request

def login_required(f, ajax=False):
    """Check if the user is logged in. If not, then return 'Permission denied'
    if ajax is True, or redirect to the login page if ajax is False.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.has_key('logged_in') or not session['logged_in']:
            if ajax:
                return 'Permission denied'
            else:
                return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def check_permissions(f, ajax=False):
    """Check if the user has permission to view this league. If not, then return
    'Permission denied' if ajax is True, or redirect to the index page if ajax
    is False.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        r = g.dbex('SELECT uid FROM bbgm.leagues WHERE lid = :lid', lid=g.lid)
        uid, = r.fetchone()
        if session['uid'] != uid:
            if ajax:
                return 'Permission denied'
            else:
                return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

def global_game_attributes(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        r = g.dbex('SELECT tid, season, phase, version FROM game_attributes LIMIT 1')
        g.user_tid, g.season, g.phase, g.version = r.fetchone()
        return f(*args, **kwargs)
    return decorated_function

def league_crap(f):
    """This just combines the above 3 decorators, for convenience, since they're used everywhere in league_views."""
    return global_game_attributes(check_permissions(login_required(f)))

def league_crap_ajax(f):
    """Same as above, but returns blank when there's no permission."""
    return global_game_attributes(check_permissions(login_required(f, True), True))

