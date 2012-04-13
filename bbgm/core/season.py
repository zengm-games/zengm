import cPickle as pickle
import random

from flask import session, g

import bbgm
from bbgm import app
from bbgm.core import play_menu, player

def new_phase(phase):
    """Set a new phase of the game.

    This function is called to do all the crap that must be done during transitions between phases of the game, such as
    moving from the regular season to the playoffs. Phases are defined as:
        0: Preseason
        1: Regular season, before trade deadline
        2: Regular season, after trade deadline (NOTE: this isn't implemented yet)
        3: Playoffs
        4: Offseason, before draft
        5: Draft
        6: Offseason, after draft
        7: Offseason, free agency
    """

    # Prevent code running twice
    if phase == g.phase:
        return

    # Preseason
    if phase == 0:
        g.season += 1
        g.db.execute('UPDATE %s_game_attributes SET season = season + 1', (g.league_id,))
        phase_text = '%s preseason' % (g.season,)

        # Get rid of old playoffs
        g.db.execute('DELETE FROM %s_active_playoff_series', (g.league_id,))

        # Create new rows in team_attributes
        g.db.execute('SELECT team_id, division_id, region, name, abbreviation, cash FROM %s_team_attributes WHERE season = %s', (g.league_id, g.season - 1))
        teams = g.db.fetchall()
        for row in teams:
            g.db.execute('INSERT INTO %s_team_attributes (team_id, division_id, region, name, abbreviation, cash, season) VALUES (%s, %s, %s, %s, %s, %s, %s)', (g.league_id, row[0], row[1], row[2], row[3], row[4], row[5], g.season))
        # Age players
        player_ids = []
        g.db.execute('SELECT player_id, born_date FROM %s_player_attributes', (g.league_id,))
        for row in g.db.techall():
            player_ids.append(row[0])
        up = player.Player()
        for player_id in player_ids:
            up.load(player_id)
            up.develop()
            up.save()

        # AI teams sign free agents
        self.auto_sign_free_agents()

    # Regular season, before trade deadline
    elif phase == 1:
        phase_text = '%s regular season' % (g.season,)
        # First, make sure teams are all within the roster limits
        # CPU teams
        keep_going = True
        g.db.execute('SELECT ta.team_id, COUNT(*) FROM %s_team_attributes as ta, %s_player_attributes as pa WHERE ta.team_id = pa.team_id AND ta.season = %s GROUP BY pa.team_id', (g.league_id, g.league_id, g.season))
        teams = g.db.fetchall()
        for team_id, num_players_on_roster in teams:
            if num_players_on_roster > 15:
                if team_id == g.user_team_id:
                    md = Gtk.MessageDialog(self.main_window, Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                           Gtk.MessageType.WARNING, Gtk.ButtonsType.CLOSE, ('Your team currently has more '
                                           'than the maximum number of players (15). You must release or buy out '
                                           'players (from the Roster window) before the season starts.'))
                    md.run()
                    md.destroy()
                    keep_going = False
                else:
                    # Automatically drop lowest potential players until we reach 15
                    g.db.execute('SELECT pa.player_id FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = %s ORDER BY pr.potential ASC LIMIT %s', (g.league_id, g.league_id, team_id, num_players_on_roster-15))
                    for player_id, in g.db.fetchall():
                        # Release player.
                        p = player.Player()
                        p.load(player_id)
                        p.release(phase)
            elif num_players_on_roster < 5:
                if team_id == g.user_team_id:
                    md = Gtk.MessageDialog(self.main_window, Gtk.DialogFlags.MODAL | Gtk.DialogFlags.DESTROY_WITH_PARENT,
                                           Gtk.MessageType.WARNING, Gtk.ButtonsType.CLOSE, ('Your team currently has less '
                                           'than the minimum number of players (5). You must add players (through '
                                           'free agency or trades) before the season starts.'))
                    md.run()
                    md.destroy()
                    keep_going = False
                else:
                    # Should auto-add players
                    pass

        if keep_going:
            new_schedule()

            # Auto sort rosters (except player's team)
#            for t in range(30):
#                if t != g.user_team_id:
#                    common.roster_auto_sort(t)
        else:
            g.db.execute('UPDATE %s_game_attributes SET phase = %s', (g.league_id, phase))
            return

    # Regular season, after trade deadline
    elif phase == 2:
        phase_text = '%s regular season, after trade deadline' % (g.season,)
        pass

    # Playoffs
    elif phase == 3:
        phase_text = '%s playoffs' % (g.season,)

        # Set playoff matchups
        for conference_id in range(2):
            teams = []
            g.db.execute('SELECT ta.team_id FROM %s_team_attributes as ta, %s_league_divisions as ld WHERE ld.division_id = ta.division_id AND ld.conference_id = %s AND ta.season = %s ORDER BY 1.0*ta.won/(ta.won + ta.lost) DESC LIMIT 8', (g.league_id, g.league_id, conference_id, g.season))
            team_ids = g.db.fetchall()
            for team_id, in team_ids:
                teams.append(team_id)
                # Record playoff appearance for player's team
                if team_id == g.user_team_id:
                    g.db.execute('UPDATE %s_team_attributes SET playoffs = 1 WHERE season = %s AND team_id = %s', (g.league_id, g.season, g.user_team_id))

            query = ('INSERT INTO %s_active_playoff_series (series_id, series_round, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away) VALUES (%s, 1, %s, %s, %s, %s, 0, 0)')
            g.db.execute(query, (g.league_id, conference_id * 4 + 1, teams[0], teams[7], 1, 8))
            g.db.execute(query, (g.league_id, conference_id * 4 + 2, teams[3], teams[4], 4, 5))
            g.db.execute(query, (g.league_id, conference_id * 4 + 3, teams[2], teams[5], 3, 6))
            g.db.execute(query, (g.league_id, conference_id * 4 + 4, teams[1], teams[6], 2, 7))

    # Offseason, before draft
    elif phase == 4:
        phase_text = '%s before draft' % (g.season,)
        # Remove released players' salaries from payrolls
        g.db.execute('DELETE FROM %s_released_players_salaries WHERE contract_expiration <= %s', (g.league_id, g.season))

        # Add a year to the free agents
        g.db.execute('UPDATE %s_player_attributes SET contract_expiration = contract_expiration + 1 WHERE team_id = -1', (g.league_id,))

    # Draft
    elif phase == 5:
        phase_text = '%s draft' % (g.season,)

    # Offseason, after draft
    elif phase == 6:
        phase_text = '%s after draft' % (g.season,)

    # Offseason, free agency
    elif phase == 7:
        phase_text = '%s free agency' % (g.season,)
        # Reset contract demands of current free agents
        g.db.execute('SELECT player_id FROM %s_player_attributes WHERE team_id = -1', (g.league_id,))
        for player_id, in g.db.fetchall():
            p = player.Player()
            p.load(player_id)
            p.add_to_free_agents(phase)

        # Check for retiring players
        # Call the contructor each season because that's where the code to check for retirement is
        rpw = retired_players_window.RetiredPlayersWindow(self)  # Do the retired player check
        rpw.retired_players_window.run()
        rpw.retired_players_window.destroy()

        # Move undrafted players to free agent pool
        g.db.execute('SELECT player_id FROM %s_player_attributes WHERE team_id = -2', (g.league_id,))
        for player_id, in g.db.fetchall():
            g.db.execute('UPDATE %s_player_attributes SET draft_year = -1, draft_round = -1, draft_pick = -1, draft_team_id = -1 WHERE player_id = %s', (g.league_id, player_id))
            p = player.Player()
            p.load(player_id)
            p.add_to_free_agents(phase)

        # Resign players
        g.db.execute('SELECT player_id, team_id, name FROM %s_player_attributes WHERE contract_expiration = %s AND team_id >= 0', (g.league_id, g.season))
        for player_id, team_id, name in g.db.fetchall():
            if team_id != g.user_team_id:
                # Automaitcally negotiate with teams
                self.player_contract_expire(player_id)
            else:
                # Add to free agents first, to generate a contract demand
                p = player.Player()
                p.load(player_id)
                p.add_to_free_agents(phase)
                # Open a contract_window
                cw = contract_window.ContractWindow(self, player_id, True)
                cw.contract_window.run()
                cw.contract_window.destroy()

    old_phase = g.phase
    g.phase = phase

    g.db.execute('UPDATE %s_game_attributes SET phase = %s', (g.league_id, g.phase))

    play_menu.set_phase(phase_text)

def new_schedule():
    teams = []
    g.db.execute('SELECT team_id, division_id, (SELECT conference_id FROM %s_league_divisions as ld WHERE ld.division_id = ta.division_id) FROM %s_team_attributes as ta WHERE season = %s', (g.league_id, g.league_id, g.season))
    for row in g.db.fetchall():
        teams.append({'team_id': row[0], 'division_id': row[1], 'conference_id': row[2], 'home_games': 0,
                      'away_games': 0})
    schedule = []  # team_id_home, team_id_away

    for i in range(len(teams)):
        for j in range(len(teams)):
            if teams[i]['team_id'] != teams[j]['team_id']:
                game = [teams[i]['team_id'], teams[j]['team_id']]

                # Constraint: 1 home game vs. each team in other conference
                if teams[i]['conference_id'] != teams[j]['conference_id']:
                    schedule.append(game)
                    teams[i]['home_games'] += 1
                    teams[j]['away_games'] += 1

                # Constraint: 2 home schedule vs. each team in same division
                if teams[i]['division_id'] == teams[j]['division_id']:
                    schedule.append(game)
                    schedule.append(game)
                    teams[i]['home_games'] += 2
                    teams[j]['away_games'] += 2

                # Constraint: 1-2 home schedule vs. each team in same conference and different division
                # Only do 1 now
                if (teams[i]['conference_id'] == teams[j]['conference_id'] and
                    teams[i]['division_id'] != teams[j]['division_id']):
                    schedule.append(game)
                    teams[i]['home_games'] += 1
                    teams[j]['away_games'] += 1

    # Constraint: 1-2 home schedule vs. each team in same conference and different division
    # Constraint: We need 8 more of these games per home team!
    team_ids_by_conference = [[], []]
    division_ids = [[], []]
    for i in range(len(teams)):
        team_ids_by_conference[teams[i]['conference_id']].append(i)
        division_ids[teams[i]['conference_id']].append(teams[i]['division_id'])
    for d in range(2):
        matchups = []
        matchups.append(range(15))
        games = 0
        while games < 8:
            new_matchup = []
            n = 0
            while n <= 14:  # 14 = num teams in conference - 1
                iters = 0
                while True:
                    try_n = random.randint(0, 14)
                    # Pick try_n such that it is in a different division than n and has not been picked before
                    if division_ids[d][try_n] != division_ids[d][n] and try_n not in new_matchup:
                        good = True
                        # Check for duplicate games
                        for matchup in matchups:
                            if matchup[n] == try_n:
                                good = False
                                break
                        if good:
                            new_matchup.append(try_n)
                            break
                    iters += 1
                    # Sometimes this gets stuck (for example, first 14 teams in fine but 15th team must play itself)
                    # So, catch these situations and reset the new_matchup
                    if iters > 50:
                        new_matchup = []
                        n = -1
                        break
                n += 1
            matchups.append(new_matchup)
            games += 1
        matchups.pop(0)  # Remove the first row in matchups
        for matchup in matchups:
            for t in matchup:
                i = team_ids_by_conference[d][t]
                j = team_ids_by_conference[d][matchup[t]]
                game = [teams[i]['team_id'], teams[j]['team_id']]
                schedule.append(game)
                teams[i]['home_games'] += 1
                teams[j]['away_games'] += 1

    random.shuffle(schedule)
    set_schedule(schedule)

def set_schedule(schedule):
    g.db.execute('UPDATE %s_game_attributes SET schedule = %s', (g.league_id, pickle.dumps(schedule)))

def get_schedule():
    g.db.execute('SELECT schedule FROM %s_game_attributes', (g.league_id,))
    row = g.db.fetchone()
    return pickle.loads(row[0].encode('ascii'))
