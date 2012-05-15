from flask import render_template, url_for, request, session, redirect, g

from bbgm import app
from bbgm.core import league
from bbgm.util.decorators import login_required


@app.route('/')
def index():
    if 'logged_in' in session and session['logged_in']:
        leagues = []
        g.db.execute('SELECT league_id FROM leagues WHERE user_id = %s ORDER BY league_id ASC', (session['user_id'],))
        for league_id, in g.db.fetchall():
            g.db.execute('SELECT team_id, season, pm_phase FROM bbgm_%s.game_attributes ORDER BY season DESC LIMIT 1', (league_id,))
            user_team_id, season, pm_phase = g.db.fetchone()
            g.db.execute('SELECT CONCAT(region, " ", name) FROM bbgm_%s.team_attributes WHERE team_id = %s AND season = %s', (league_id, user_team_id, season))
            team, = g.db.fetchone()
            leagues.append({'league_id': league_id, 'pm_phase': pm_phase, 'team': team})
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
            g.db.execute('SELECT 1 FROM users WHERE username = %s', (request.form['username'],))
            if g.db.rowcount > 0:
                username = request.form['username']
                error = 'Username already taken'
            else:
                g.db.execute('INSERT INTO users (username, password) VALUES (%s, %s)', (request.form['username'], request.form['password']))
                return redirect(url_for('login'))

    return render_template('register.html', error=error, username=username)


@app.route('/login', methods=['POST', 'GET'])
def login():
    if 'logged_in' in session and session['logged_in']:
        return redirect(url_for('index'))

    error = None
    if request.method == 'POST':
        g.dbd.execute('SELECT user_id FROM users WHERE username = %s AND password = %s', (request.form['username'], request.form['password']))
        if g.dbd.rowcount > 0:
            user = g.dbd.fetchone()
            session['logged_in'] = True
            session['username'] = request.form['username']
            session['user_id'] = user['user_id']
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
        team_id = int(request.form['team_id'])
        if team_id >= 0 and team_id <= 29:
            league_id = league.new(team_id)
            return redirect(url_for('league_dashboard', league_id=league_id))

    g.dbd.execute('SELECT team_id, region, name FROM teams ORDER BY team_id ASC')
    teams = g.dbd.fetchall()
    return render_template('new_league.html', teams=teams)


@app.route('/delete_league', methods=['POST'])
@login_required
def delete_league():
    league_id = int(request.form['league_id'])

    # Check permissions (this is the same as bbgm.util.decorators.check_permissions)
    g.db.execute('SELECT user_id FROM leagues WHERE league_id = %s', (league_id,))
    user_id, = g.db.fetchone()
    if session['user_id'] != user_id:
        return redirect(url_for('index'))

    league.delete(league_id)

    return redirect(url_for('index'))
