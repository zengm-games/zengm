import cPickle as pickle
import random

from flask import session, g

import bbgm
from bbgm import app
from bbgm.core import contract_negotiation, play_menu, player
from bbgm.util import free_agents_auto_sign, lock, roster_auto_sort
import bbgm.util.const as c

def new_phase(phase):
    """Set a new phase of the game.

    This function is called to do all the crap that must be done during
    transitions between phases of the game, such as moving from the regular
    season to the playoffs. Phases are defined as:
        0: Preseason
        1: Regular season, before trade deadline
        2: Regular season, after trade deadline (NOTE: not implemented yet)
        3: Playoffs
        4: Offseason, before draft
        5: Draft
        6: Offseason, after draft
        7: Offseason, resign players
        8: Offseason, free agency

    Returns:
        False if everything went well, or a string containing an error message
        to be sent to the client.
    """

    # Prevent code running twice
    if phase == g.phase:
        return

    # Preseason
    if phase == c.PHASE_PRESEASON:
        g.season += 1
        g.db.execute('UPDATE game_attributes SET season = season + 1')
        phase_text = '%s preseason' % (g.season,)

        # Get rid of old playoffs
        g.db.execute('DELETE FROM active_playoff_series')

        # Create new rows in team_attributes
        g.db.execute('SELECT team_id, division_id, region, name, abbreviation, cash FROM team_attributes WHERE season = %s', (g.season - 1,))
        for row in g.db.fetchall():
            g.db.execute('INSERT INTO team_attributes (team_id, division_id, region, name, abbreviation, cash, season) VALUES (%s, %s, %s, %s, %s, %s, %s)', (row[0], row[1], row[2], row[3], row[4], row[5], g.season))

        # Create new rows in player_ratings, only for active players
        g.db.execute('SELECT pr.player_id, season + 1, roster_position, overall, pr.height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding, potential FROM player_ratings AS pr, player_attributes AS pa WHERE pa.player_id = pr.player_id AND pr.season = %s AND pa.team_id != %s', (g.season - 1, c.PLAYER_RETIRED))
        for row in g.db.fetchall():
            g.db.execute('INSERT INTO player_ratings (player_id, season, roster_position, overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding, potential) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', row)

        # Age players
        player_ids = []
        g.db.execute('SELECT player_id FROM player_attributes WHERE team_id != %s', (c.PLAYER_RETIRED,))
        for player_id, in g.db.fetchall():
            player_ids.append(player_id)
        up = player.Player()
        for player_id in player_ids:
            up.load(player_id)
            up.develop()
            up.save()

        # AI teams sign free agents
        free_agents_auto_sign()

    # Regular season, before trade deadline
    elif phase == c.PHASE_REGULAR_SEASON:
        phase_text = '%s regular season' % (g.season,)
        # First, make sure teams are all within the roster limits
        # CPU teams
        g.db.execute('SELECT ta.team_id, COUNT(*) FROM team_attributes as ta, player_attributes as pa WHERE ta.team_id = pa.team_id AND ta.season = %s GROUP BY pa.team_id', (g.season))
        teams = g.db.fetchall()
        for team_id, num_players_on_roster in teams:
            if num_players_on_roster > 15:
                if team_id == g.user_team_id:
                    return 'Your team currently has more than the maximum number of players (15). You must release or buy out players (from the Roster page) before the season starts.'
                else:
                    # Automatically drop lowest potential players until we reach 15
                    g.db.execute('SELECT pa.player_id FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = %s AND pr.season = %s ORDER BY pr.potential ASC LIMIT %s', (team_id, num_players_on_roster-15, g.season))
                    for player_id, in g.db.fetchall():
                        # Release player.
                        p = player.Player()
                        p.load(player_id)
                        p.release(phase)
            elif num_players_on_roster < 5:
                if team_id == g.user_team_id:
                    return 'Your team currently has less than the minimum number of players (5). You must add players (through free agency or trades) before the season starts.'
                else:
                    # Should auto-add players
                    pass

        new_schedule()

        # Auto sort rosters (except player's team)
        for t in range(30):
            if t != g.user_team_id:
                roster_auto_sort(t)

    # Regular season, after trade deadline
    elif phase == c.PHASE_AFTER_TRADE_DEADLINE:
        phase_text = '%s regular season, after trade deadline' % (g.season,)
        pass

    # Playoffs
    elif phase == c.PHASE_PLAYOFFS:
        phase_text = '%s playoffs' % (g.season,)

        # Select winners of the season's awards
        awards()

        # Set playoff matchups
        for conference_id in range(2):
            teams = []
            g.db.execute('SELECT ta.team_id FROM team_attributes as ta, league_divisions as ld WHERE ld.division_id = ta.division_id AND ld.conference_id = %s AND ta.season = %s ORDER BY 1.0*ta.won/(ta.won + ta.lost) DESC LIMIT 8', (conference_id, g.season))
            team_ids = g.db.fetchall()
            for team_id, in team_ids:
                teams.append(team_id)
                # Record playoff appearance for player's team
                if team_id == g.user_team_id:
                    g.db.execute('UPDATE team_attributes SET playoffs = 1 WHERE season = %s AND team_id = %s', (g.season, g.user_team_id))

            query = ('INSERT INTO active_playoff_series (series_id, series_round, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away) VALUES (%s, 1, %s, %s, %s, %s, 0, 0)')
            g.db.execute(query, (conference_id * 4 + 1, teams[0], teams[7], 1, 8))
            g.db.execute(query, (conference_id * 4 + 2, teams[3], teams[4], 4, 5))
            g.db.execute(query, (conference_id * 4 + 3, teams[2], teams[5], 3, 6))
            g.db.execute(query, (conference_id * 4 + 4, teams[1], teams[6], 2, 7))

    # Offseason, before draft
    elif phase == c.PHASE_BEFORE_DRAFT:
        phase_text = '%s before draft' % (g.season,)
        # Remove released players' salaries from payrolls
        g.db.execute('DELETE FROM released_players_salaries WHERE contract_expiration <= %s', (g.season,))

        # Add a year to the free agents
        g.db.execute('UPDATE player_attributes SET contract_expiration = contract_expiration + 1 WHERE team_id = %s', (c.PLAYER_FREE_AGENT,))

    # Draft
    elif phase == c.PHASE_DRAFT:
        phase_text = '%s draft' % (g.season,)

    # Offseason, after draft
    elif phase == c.PHASE_AFTER_DRAFT:
        phase_text = '%s after draft' % (g.season,)

    # Offseason, resign players
    elif phase == c.PHASE_RESIGN_PLAYERS:
        phase_text = '%s resign players' % (g.season,)

        # Check for retiring players
        # Call the contructor each season because that's where the code to check for retirement is
#        rpw = retired_players_window.RetiredPlayersWindow(self)  # Do the retired player check
#        rpw.retired_players_window.run()
#        rpw.retired_players_window.destroy()

        # Resign players
        g.db.execute('SELECT player_id, team_id, name FROM player_attributes WHERE contract_expiration = %s AND team_id >= 0', (g.season,))
        for player_id, team_id, name in g.db.fetchall():
            if team_id != g.user_team_id:
                # Automatically negotiate with teams
#                self.player_contract_expire(player_id)
                pass
            else:
                # Add to free agents first, to generate a contract demand
                p = player.Player()
                p.load(player_id)
                p.add_to_free_agents(phase)

                # Open negotiations with player
                error = contract_negotiation.new(player_id, resigning=True)
                if error:
                    app.logger.debug(error)

    # Offseason, free agency
    elif phase == c.PHASE_FREE_AGENCY:
        phase_text = '%s free agency' % (g.season,)

        # Delete all current negotiations to resign players
        g.db.execute('DELETE FROM negotiation')
        lock.set_negotiation_in_progress(False)

        # Reset contract demands of current free agents
        g.db.execute('SELECT player_id FROM player_attributes WHERE team_id = %s', (c.PLAYER_FREE_AGENT,))
        for player_id, in g.db.fetchall():
            p = player.Player()
            p.load(player_id)
            p.add_to_free_agents(phase)

        # Move undrafted players to free agent pool
        g.db.execute('SELECT player_id FROM player_attributes WHERE team_id = %s', (c.PLAYER_UNDRAFTED,))
        for player_id, in g.db.fetchall():
            g.db.execute('UPDATE player_attributes SET draft_year = -1, draft_round = -1, draft_pick = -1, draft_team_id = -1 WHERE player_id = %s', (player_id,))
            p = player.Player()
            p.load(player_id)
            p.add_to_free_agents(phase)

    old_phase = g.phase
    g.phase = phase

    g.db.execute('UPDATE game_attributes SET phase = %s', (g.phase,))

    play_menu.set_phase(phase_text)
    play_menu.refresh_options()

    return False

def new_schedule():
    """Creates a new regular season schedule with appropriate division and
    conference matchup distributions.
    """
    teams = []
    g.db.execute('SELECT team_id, division_id, (SELECT conference_id FROM league_divisions as ld WHERE ld.division_id = ta.division_id) FROM team_attributes as ta WHERE season = %s', (g.season))
    for row in g.db.fetchall():
        teams.append({'team_id': row[0], 'division_id': row[1], 'conference_id': row[2], 'home_games': 0,
                      'away_games': 0})
    team_ids = []  # team_id_home, team_id_away

    for i in range(len(teams)):
        for j in range(len(teams)):
            if teams[i]['team_id'] != teams[j]['team_id']:
                game = [teams[i]['team_id'], teams[j]['team_id']]

                # Constraint: 1 home game vs. each team in other conference
                if teams[i]['conference_id'] != teams[j]['conference_id']:
                    team_ids.append(game)
                    teams[i]['home_games'] += 1
                    teams[j]['away_games'] += 1

                # Constraint: 2 home schedule vs. each team in same division
                if teams[i]['division_id'] == teams[j]['division_id']:
                    team_ids.append(game)
                    team_ids.append(game)
                    teams[i]['home_games'] += 2
                    teams[j]['away_games'] += 2

                # Constraint: 1-2 home schedule vs. each team in same conference and different division
                # Only do 1 now
                if (teams[i]['conference_id'] == teams[j]['conference_id'] and
                    teams[i]['division_id'] != teams[j]['division_id']):
                    team_ids.append(game)
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
                team_ids.append(game)
                teams[i]['home_games'] += 1
                teams[j]['away_games'] += 1

    random.shuffle(team_ids)
    set_schedule(team_ids)

def new_schedule_playoffs_day():
    """Creates a single day's schedule for an in-progress playoffs."""
    num_active_teams = 0

    # Make today's  playoff schedule
    team_ids = []
    active_series = False
    # Round: 1, 2, 3, or 4
    g.db.execute('SELECT MAX(series_round) FROM active_playoff_series')
    current_round, = g.db.fetchone()

    g.db.execute('SELECT team_id_home, team_id_away FROM active_playoff_series WHERE won_home < 4 AND won_away < 4 AND series_round = %s', (current_round,))
    for team_id_home, team_id_away in g.db.fetchall():
        team_ids.append([team_id_home, team_id_away])
        active_series = True
        num_active_teams += 2
    if len(team_ids) > 0:
        set_schedule(team_ids)
    if not active_series:
        # The previous round is over

        # Who won?
        winners = {}
        g.db.execute('SELECT series_id, team_id_home, team_id_away, seed_home, '
                     'seed_away, won_home, won_away FROM active_playoff_series WHERE '
                     'series_round = %s ORDER BY series_id ASC', (current_round,))
        for row in g.db.fetchall():
            series_id, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away = row
            if won_home == 4:
                winners[series_id] = [team_id_home, seed_home]
            else:
                winners[series_id] = [team_id_away, seed_away]
            # Record user's team as conference and league champion
            if current_round == 3:
                g.db.execute('UPDATE team_attributes SET won_conference = 1 WHERE season = %s AND '
                             'team_id = %s', (g.season, winners[series_id][0]))
            elif current_round == 4:
                g.db.execute('UPDATE team_attributes SET won_championship = 1 WHERE season = %s AND '
                             'team_id = %s', (g.season, winners[series_id][0]))

        # Are the whole playoffs over?
        if current_round == 4:
            new_phase(c.PHASE_BEFORE_DRAFT)

        # Add a new round to the database
        series_id = 1
        current_round += 1
        query = ('INSERT INTO active_playoff_series (series_id, series_round, team_id_home, team_id_away,'
                 'seed_home, seed_away, won_home, won_away) VALUES (%s, %s, %s, %s, %s, %s, 0, 0)')
        for i in range(1, len(winners), 2):  # Go through winners by 2
            if winners[i][1] < winners[i + 1][1]:  # Which team is the home team?
                new_series = (series_id, current_round, winners[i][0], winners[i + 1][0], winners[i][1],
                              winners[i + 1][1])
            else:
                new_series = (series_id, current_round, winners[i + 1][0], winners[i][0], winners[i + 1][1],
                              winners[i][1])
            g.db.execute(query, new_series)
            series_id += 1

    return num_active_teams

def awards():
    """Computes the awards at the end of a season."""
    # Cache averages
    g.db.execute('CREATE TEMPORARY TABLE awards_avg (player_id INTEGER PRIMARY KEY, name VARCHAR(255), team_id INTEGER, abbreviation VARCHAR(3), draft_year INTEGER, games_played INTEGER, games_started INTEGER, mpg FLOAT, ppg FLOAT, rpg FLOAT, apg FLOAT, bpg FLOAT, spg FLOAT)')
    g.db.execute('INSERT INTO awards_avg (player_id, name, team_id, abbreviation, draft_year, games_played, games_started, mpg, ppg, rpg, apg, bpg, spg) (SELECT pa.player_id, pa.name, pa.team_id, ta.abbreviation, pa.draft_year, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS mpg, AVG(ps.points) AS ppg, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rpg, AVG(ps.assists) AS apg, AVG(ps.blocks) AS bpg, AVG(ps.steals) AS spg FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ps.season = %s AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.player_id)', (g.season))

    g.db.execute('SELECT team_id, abbreviation, region, name, won, lost FROM team_attributes AS ta WHERE season = %s AND (SELECT conference_id FROM league_divisions AS ld WHERE ld.division_id = ta.division_id) = 0 ORDER BY 1.0*won/(won + lost) DESC', (g.season,))
    bre = g.db.fetchone()
    g.db.execute('SELECT team_id, abbreviation, region, name, won, lost FROM team_attributes AS ta WHERE season = %s AND (SELECT conference_id FROM league_divisions AS ld WHERE ld.division_id = ta.division_id) = 1 ORDER BY 1.0*won/(won + lost) DESC', (g.season,))
    brw = g.db.fetchone()

    g.db.execute('SELECT player_id, name, team_id, abbreviation, ppg, rpg, apg FROM awards_avg ORDER BY (0.75 * ppg) + apg + rpg DESC')
    mvp =  g.db.fetchone()
    g.db.execute('SELECT player_id, name, team_id, abbreviation, rpg, bpg, spg FROM awards_avg ORDER BY rpg + 5 * bpg + 5 * spg DESC')
    dpoy = g.db.fetchone()
    g.db.execute('SELECT player_id, name, team_id, abbreviation, ppg, rpg, apg FROM awards_avg WHERE games_played/(games_started+1) > 2 ORDER BY (0.75 * ppg) + apg + rpg DESC')
    smoy = g.db.fetchone()
    g.db.execute('SELECT player_id, name, team_id, abbreviation, ppg, rpg, apg FROM awards_avg WHERE draft_year = %s - 1 ORDER BY (0.75 * ppg) + apg + rpg DESC', (g.season,))
    roy = g.db.fetchone()

    g.db.execute('INSERT INTO awards (season, bre_team_id, bre_abbreviation, bre_region, bre_name, bre_won, bre_lost, brw_team_id, brw_abbreviation, brw_region, brw_name, brw_won, brw_lost, mvp_player_id, mvp_name, mvp_team_id, mvp_abbreviation, mvp_ppg, mvp_rpg, mvp_apg, dpoy_player_id, dpoy_name, dpoy_team_id, dpoy_abbreviation, dpoy_rpg, dpoy_bpg, dpoy_spg, smoy_player_id, smoy_name, smoy_team_id, smoy_abbreviation, smoy_ppg, smoy_rpg, smoy_apg, roy_player_id, roy_name, roy_team_id, roy_abbreviation, roy_ppg, roy_rpg, roy_apg) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', (g.season,) + bre + brw + mvp + dpoy + smoy + roy)

    g.db.execute('INSERT INTO awards_all_league (season, team_type, player_id, name, abbreviation, ppg, rpg, apg, bpg, spg) (SELECT %s, \'league\', player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM awards_avg ORDER BY (0.75 * ppg) + apg + rpg DESC LIMIT 15)', (g.season,))
    g.db.execute('INSERT INTO awards_all_league (season, team_type, player_id, name, abbreviation, ppg, rpg, apg, bpg, spg) (SELECT %s, \'defensive\', player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM awards_avg ORDER BY rpg + 5 * bpg + 5 * spg DESC LIMIT 15)', (g.season,))

    g.db.execute('DROP TABLE awards_avg')

def set_schedule(team_ids):
    """Save the schedule to the database, overwriting what's currently there.

    Args:
        team_ids: A list of lists, each containing the team IDs of the home and
            away teams, respectively, for every game in the season.
    """
    g.db.execute('DELETE FROM schedule')
    for home_team_id, away_team_id in team_ids:
        g.db.execute('INSERT INTO schedule (home_team_id, away_team_id) VALUES (%s, %s)', (home_team_id, away_team_id))

def get_schedule(n_games=0):
    """Returns a tuple of n_games games, or all games in the schedule if n_games
    is 0 (default).
    """
    if n_games > 0:
        g.dbd.execute('SELECT game_id, home_team_id, away_team_id FROM schedule ORDER BY game_id ASC LIMIT %s', (n_games,))
    else:
        g.dbd.execute('SELECT game_id, home_team_id, away_team_id FROM schedule ORDER BY game_id ASC')
    return g.dbd.fetchall()
