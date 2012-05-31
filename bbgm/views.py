from flask import render_template, url_for, request, session, redirect, g

from bbgm import app
from bbgm.core import league
from bbgm.util.decorators import login_required


@app.route('/')
def index():
    if 'logged_in' in session and session['logged_in']:
        leagues = []
        r = g.dbex('SELECT lid FROM leagues WHERE uid = :uid ORDER BY lid ASC', uid=session['uid'])
        for lid, in r.fetchall():
            r = g.dbex('SELECT tid, season, pm_phase FROM bbgm_' + str(lid) + '.game_attributes ORDER BY season DESC LIMIT 1')
            user_tid, season, pm_phase = r.fetchone()
            r = g.dbex('SELECT CONCAT(region, " ", name) FROM bbgm_' + str(lid) + '.team_attributes WHERE tid = :tid AND season = :season', tid=user_tid, season=season)
            team, = r.fetchone()
            leagues.append({'lid': lid, 'pm_phase': pm_phase, 'team': team})
        return render_template('dashboard.html', leagues=leagues)
    else:
        return render_template('hello.html')


@app.route('/register', methods=['POST', 'GET'])
def register():
    if 'logged_in' in session and session['logged_in']:
        return redirect(url_for('index'))

    error = None
    username = ''
    if request.method == 'POST':
        if not request.form['username'] or not request.form['password']:
            error = 'Enter a username and password'
        else:
            r = g.dbex('SELECT 1 FROM users WHERE username = :username', username=request.form['username'])
            if r.rowcount > 0:
                username = request.form['username']
                error = 'Username already taken'
            else:
                g.dbex('INSERT INTO users (username, password) VALUES (:username, :password)', username=request.form['username'], password=request.form['password'])
                return redirect(url_for('login'))

    return render_template('register.html', error=error, username=username)


@app.route('/login', methods=['POST', 'GET'])
def login():
    if 'logged_in' in session and session['logged_in']:
        return redirect(url_for('index'))

    error = None
    if request.method == 'POST':
        r = g.dbex('SELECT uid FROM users WHERE username = :username AND password = :password', username=request.form['username'], password=request.form['password'])
        if r.rowcount > 0:
            uid, = r.fetchone()
            session['logged_in'] = True
            session['username'] = request.form['username']
            session['uid'] = uid
            return redirect(url_for('index'))
        else:
            error = 'Invalid username/password'

    return render_template('login.html', error=error)


@app.route('/logout')
def logout():
    session.pop('logged_in', None)  # Log user out, if user was logged in
    return redirect(url_for('index'))


@app.route('/new_league', methods=['POST', 'GET'])
@login_required
def new_league():
    if request.method == 'POST':
        tid = int(request.form['tid'])
        if tid >= 0 and tid <= 29:
            lid = league.new(tid)
            return redirect(url_for('league_dashboard', lid=lid))

    r = g.dbex('SELECT tid, region, name FROM teams ORDER BY tid ASC')
    teams = r.fetchall()
    return render_template('new_league.html', teams=teams)


@app.route('/delete_league', methods=['POST'])
@login_required
def delete_league():
    lid = int(request.form['lid'])

    # Check permissions (this is the same as bbgm.util.decorators.check_permissions)
    r = g.dbex('SELECT uid FROM leagues WHERE lid = :lid', lid=lid)
    uid, = r.fetchone()
    if session['uid'] != uid:
        return redirect(url_for('index'))

    league.delete(lid)

    return redirect(url_for('index'))
