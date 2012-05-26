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
        g.dbex('UPDATE game_attributes SET season = season + 1')
        phase_text = '%s preseason' % (g.season,)

        # Get rid of old playoffs
        g.dbex('DELETE FROM active_playoff_series')

        # Create new rows in team_attributes
        r = g.dbex('SELECT team_id, division_id, region, name, abbreviation, cash FROM team_attributes WHERE season = :season', season=g.season - 1)
        for row in r.fetchall():
            g.dbex('INSERT INTO team_attributes (team_id, division_id, region, name, abbreviation, cash, season) VALUES (:team_id, :division_id, :region, :name, :abbreviation, :cash, :season)', season=g.season, **row) # team_id=row[0], division_id=row[1], region=row[2], name=row[3], abbreviation=row[4], cash=row[5], season=g.season)

        # Create new rows in player_ratings, only for active players
        r = g.dbex('SELECT pr.player_id, season + 1 AS season, overall, pr.height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding, potential FROM player_ratings AS pr, player_attributes AS pa WHERE pa.player_id = pr.player_id AND pr.season = :season AND pa.team_id != :team_id', season=g.season - 1, team_id=c.PLAYER_RETIRED)
        for row in r.fetchall():
            g.dbex('INSERT INTO player_ratings (player_id, season, overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding, potential) VALUES (:player_id, :season, :overall, :height, :strength, :speed, :jumping, :endurance, :shooting_inside, :shooting_layups, :shooting_free_throws, :shooting_two_pointers, :shooting_three_pointers, :blocks, :steals, :dribbling, :passing, :rebounding, :potential)', **row) # player_id=row[0], season=row[1], overall=row[2], height=row[3], strength=row[4], speed=row[5], jumping=row[6], endurance=row[7], shooting_inside=row[8], shooting_layups=row[9], shooting_free_throws=row[10], shooting_two_pointers=row[11], shooting_three_pointers=row[12], blocks=row[13], steals=row[14], dribbling=row[15], passing=row[16], rebounding=row[17], potential=row[18])

        # Age players
        player_ids = []
        r = g.dbex('SELECT player_id FROM player_attributes WHERE team_id != :team_id', team_id=c.PLAYER_RETIRED)
        for player_id, in r.fetchall():
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
        r = g.dbex('SELECT ta.team_id, COUNT(*) FROM team_attributes as ta, player_attributes as pa WHERE ta.team_id = pa.team_id AND ta.season = :season GROUP BY pa.team_id', season=g.season)
        teams = r.fetchall()
        for team_id, num_players_on_roster in teams:
            if num_players_on_roster > 15:
                if team_id == g.user_team_id:
                    return 'Your team currently has more than the maximum number of players (15). You must release or buy out players (from the Roster page) before the season starts.'
                else:
                    # Automatically drop lowest potential players until we reach 15
                    r = g.dbex('SELECT pa.player_id FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = :team_id AND pr.season = :season ORDER BY pr.potential ASC LIMIT :n_excess_players', team_id=team_id, season=g.season, n_excess_players=num_players_on_roster-15)
                    for player_id, in r.fetchall():
                        # Release player.
                        p = player.Player()
                        p.load(player_id)
                        p.release()
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
            r = g.dbex('SELECT ta.team_id FROM team_attributes as ta, league_divisions as ld WHERE ld.division_id = ta.division_id AND ld.conference_id = :conference_id AND ta.season = :season ORDER BY 1.0*ta.won/(ta.won + ta.lost) DESC LIMIT 8', conference_id=conference_id, season=g.season)
            team_ids = r.fetchall()
            for team_id, in team_ids:
                teams.append(team_id)
                # Record playoff appearance for player's team
                if team_id == g.user_team_id:
                    g.dbex('UPDATE team_attributes SET playoffs = 1 WHERE season = :season AND team_id = :team_id', season=g.season, team_id=g.user_team_id)

            query = ('INSERT INTO active_playoff_series (series_round, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away) VALUES (1, :team_id_home, :team_id_away, :seed_home, :seed_away, 0, 0)')
            g.dbex(query, team_id_home=teams[0], team_id_away=teams[7], seed_home=1, seed_away=8)
            g.dbex(query, team_id_home=teams[3], team_id_away=teams[4], seed_home=4, seed_away=5)
            g.dbex(query, team_id_home=teams[2], team_id_away=teams[5], seed_home=3, seed_away=6)
            g.dbex(query, team_id_home=teams[1], team_id_away=teams[6], seed_home=2, seed_away=7)

    # Offseason, before draft
    elif phase == c.PHASE_BEFORE_DRAFT:
        phase_text = '%s before draft' % (g.season,)
        # Remove released players' salaries from payrolls
        g.dbex('DELETE FROM released_players_salaries WHERE contract_expiration <= :season', season=g.season)

        # Add a year to the free agents
        g.dbex('UPDATE player_attributes SET contract_expiration = contract_expiration + 1 WHERE team_id = :team_id', team_id=c.PLAYER_FREE_AGENT)

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
        r = g.dbex('SELECT player_id, team_id, name FROM player_attributes WHERE contract_expiration = :season AND team_id >= 0', season=g.season)
        for player_id, team_id, name in r.fetchall():
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
        contract_negotiation.cancel_all()

        # Reset contract demands of current free agents
        r = g.dbex('SELECT player_id FROM player_attributes WHERE team_id = :team_id', team_id=c.PLAYER_FREE_AGENT)
        for player_id, in r.fetchall():
            p = player.Player()
            p.load(player_id)
            p.add_to_free_agents(phase)

        # Move undrafted players to free agent pool
        r = g.dbex('SELECT player_id FROM player_attributes WHERE team_id = :team_id', team_id=c.PLAYER_UNDRAFTED)
        for player_id, in r.fetchall():
            g.dbex('UPDATE player_attributes SET draft_year = -1, draft_round = -1, draft_pick = -1, draft_team_id = -1 WHERE player_id = :player_id', player_id=player_id)
            p = player.Player()
            p.load(player_id)
            p.add_to_free_agents(phase)

    old_phase = g.phase
    g.phase = phase

    g.dbex('UPDATE game_attributes SET phase = :phase', phase=g.phase)

    play_menu.set_phase(phase_text)
    play_menu.refresh_options()

    return False

def new_schedule():
    """Creates a new regular season schedule with appropriate division and
    conference matchup distributions.
    """
    teams = []
    r = g.dbex('SELECT team_id, division_id, (SELECT conference_id FROM league_divisions as ld WHERE ld.division_id = ta.division_id) FROM team_attributes as ta WHERE season = :season', season=g.season)
    for row in r.fetchall():
        teams.append({'team_id': row[0], 'division_id': row[1], 'conference_id': row[2], 'home_games': 0, 'away_games': 0})
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
    r = g.dbex('SELECT MAX(series_round) FROM active_playoff_series')
    current_round, = r.fetchone()

    r = g.dbex('SELECT team_id_home, team_id_away FROM active_playoff_series WHERE won_home < 4 AND won_away < 4 AND series_round = :series_round', series_round=current_round)
    for team_id_home, team_id_away in r.fetchall():
        team_ids.append([team_id_home, team_id_away])
        active_series = True
        num_active_teams += 2
    if len(team_ids) > 0:
        set_schedule(team_ids)
    if not active_series:
        # The previous round is over

        # Who won?
        winners = {}
        r = g.dbex('SELECT series_id, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away FROM active_playoff_series WHERE series_round = :series_round ORDER BY series_id ASC', series_round=current_round)
        for row in r.fetchall():
            series_id, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away = row
            if won_home == 4:
                winners[series_id] = [team_id_home, seed_home]
            else:
                winners[series_id] = [team_id_away, seed_away]
            # Record user's team as conference and league champion
            if current_round == 3:
                g.dbex('UPDATE team_attributes SET won_conference = 1 WHERE season = :season AND team_id = :team_id', season=g.season, team_id=winners[series_id][0])
            elif current_round == 4:
                g.dbex('UPDATE team_attributes SET won_championship = 1 WHERE season = :season AND team_id = :team_id', season=g.season, team_id=winners[series_id][0])

        # Are the whole playoffs over?
        if current_round == 4:
            new_phase(c.PHASE_BEFORE_DRAFT)

        # Add a new round to the database
        current_round += 1
        query = ('INSERT INTO active_playoff_series (series_round, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away) VALUES (:series_round, :team_id_home, :team_id_away, :seed_home, :seed_away, 0, 0)')
        series_ids = winners.keys()
        for i in range(min(series_ids), max(series_ids), 2):  # Go through winners by 2
            if winners[i][1] < winners[i + 1][1]:  # Which team is the home team?
                g.dbex(query, series_round=current_round, team_id_home=winners[i][0], team_id_away=winners[i + 1][0], seed_home=winners[i][1], seed_away=winners[i + 1][1])
            else:
                g.dbex(query, series_round=current_round, team_id_home=winners[i + 1][0], team_id_away=winners[i][0], seed_home=winners[i + 1][1], seed_away=winners[i][1])

    return num_active_teams

def awards():
    """Computes the awards at the end of a season."""
    # Cache averages
    g.dbex('CREATE TEMPORARY TABLE awards_avg (player_id INTEGER PRIMARY KEY, name VARCHAR(255), team_id INTEGER, abbreviation VARCHAR(3), draft_year INTEGER, games_played INTEGER, games_started INTEGER, mpg FLOAT, ppg FLOAT, rpg FLOAT, apg FLOAT, bpg FLOAT, spg FLOAT)')
    g.dbex('INSERT INTO awards_avg (player_id, name, team_id, abbreviation, draft_year, games_played, games_started, mpg, ppg, rpg, apg, bpg, spg) (SELECT pa.player_id, pa.name, pa.team_id, ta.abbreviation, pa.draft_year, SUM(ps.minutes>0) AS games_played, SUM(ps.starter) AS games_started, AVG(ps.minutes) AS mpg, AVG(ps.points) AS ppg, AVG(ps.offensive_rebounds+ps.defensive_rebounds) AS rpg, AVG(ps.assists) AS apg, AVG(ps.blocks) AS bpg, AVG(ps.steals) AS spg FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ps.season = :season AND ps.is_playoffs = 0 AND ta.team_id = pa.team_id AND ta.season = ps.season GROUP BY ps.player_id)', season=g.season)

    r = g.dbex('SELECT team_id, abbreviation, region, name, won, lost FROM team_attributes AS ta WHERE season = :season AND (SELECT conference_id FROM league_divisions AS ld WHERE ld.division_id = ta.division_id) = 0 ORDER BY 1.0*won/(won + lost) DESC', season=g.season)
    bre = r.fetchone()
    r = g.dbex('SELECT team_id, abbreviation, region, name, won, lost FROM team_attributes AS ta WHERE season = :season AND (SELECT conference_id FROM league_divisions AS ld WHERE ld.division_id = ta.division_id) = 1 ORDER BY 1.0*won/(won + lost) DESC', season=g.season)
    brw = r.fetchone()

    r = g.dbex('SELECT player_id, name, team_id, abbreviation, ppg, rpg, apg FROM awards_avg ORDER BY (0.75 * ppg) + apg + rpg DESC')
    mvp =  r.fetchone()
    r = g.dbex('SELECT player_id, name, team_id, abbreviation, rpg, bpg, spg FROM awards_avg ORDER BY rpg + 5 * bpg + 5 * spg DESC')
    dpoy = r.fetchone()
    r = g.dbex('SELECT player_id, name, team_id, abbreviation, ppg, rpg, apg FROM awards_avg WHERE games_played/(games_started+1) > 2 ORDER BY (0.75 * ppg) + apg + rpg DESC')
    smoy = r.fetchone()
    r = g.dbex('SELECT player_id, name, team_id, abbreviation, ppg, rpg, apg FROM awards_avg WHERE draft_year = :season - 1 ORDER BY (0.75 * ppg) + apg + rpg DESC', season=g.season)
    roy = r.fetchone()

    g.dbex('INSERT INTO awards (season, bre_team_id, bre_abbreviation, bre_region, bre_name, bre_won, bre_lost, brw_team_id, brw_abbreviation, brw_region, brw_name, brw_won, brw_lost, mvp_player_id, mvp_name, mvp_team_id, mvp_abbreviation, mvp_ppg, mvp_rpg, mvp_apg, dpoy_player_id, dpoy_name, dpoy_team_id, dpoy_abbreviation, dpoy_rpg, dpoy_bpg, dpoy_spg, smoy_player_id, smoy_name, smoy_team_id, smoy_abbreviation, smoy_ppg, smoy_rpg, smoy_apg, roy_player_id, roy_name, roy_team_id, roy_abbreviation, roy_ppg, roy_rpg, roy_apg) VALUES (:season, :bre_team_id, :bre_abbreviation, :bre_region, :bre_name, :bre_won, :bre_lost, :brw_team_id, :brw_abbreviation, :brw_region, :brw_name, :brw_won, :brw_lost, :mvp_player_id, :mvp_name, :mvp_team_id, :mvp_abbreviation, :mvp_ppg, :mvp_rpg, :mvp_apg, :dpoy_player_id, :dpoy_name, :dpoy_team_id, :dpoy_abbreviation, :dpoy_rpg, :dpoy_bpg, :dpoy_spg, :smoy_player_id, :smoy_name, :smoy_team_id, :smoy_abbreviation, :smoy_ppg, :smoy_rpg, :smoy_apg, :roy_player_id, :roy_name, :roy_team_id, :roy_abbreviation, :roy_ppg, :roy_rpg, :roy_apg)', season=g.season, bre_team_id=bre['team_id'], bre_abbreviation=bre['abbreviation'], bre_region=bre['region'], bre_name=bre['name'], bre_won=bre['won'], bre_lost=bre['lost'], brw_team_id=brw['team_id'], brw_abbreviation=brw['abbreviation'], brw_region=brw['region'], brw_name=brw['name'], brw_won=brw['won'], brw_lost=brw['lost'], mvp_player_id=mvp['player_id'], mvp_name=mvp['name'], mvp_team_id=mvp['team_id'], mvp_abbreviation=mvp['abbreviation'], mvp_ppg=mvp['ppg'], mvp_rpg=mvp['rpg'], mvp_apg=mvp['apg'], dpoy_player_id=dpoy['player_id'], dpoy_name=dpoy['name'], dpoy_team_id=dpoy['team_id'], dpoy_abbreviation=dpoy['abbreviation'], dpoy_rpg=dpoy['rpg'], dpoy_bpg=dpoy['bpg'], dpoy_spg=dpoy['spg'], smoy_player_id=smoy['player_id'], smoy_name=smoy['name'], smoy_team_id=smoy['team_id'], smoy_abbreviation=smoy['abbreviation'], smoy_ppg=smoy['ppg'], smoy_rpg=smoy['rpg'], smoy_apg=smoy['apg'], roy_player_id=roy['player_id'], roy_name=roy['name'], roy_team_id=roy['team_id'], roy_abbreviation=roy['abbreviation'], roy_ppg=roy['ppg'], roy_rpg=roy['rpg'], roy_apg=roy['apg'])

    g.dbex('INSERT INTO awards_all_league (season, team_type, player_id, name, abbreviation, ppg, rpg, apg, bpg, spg) (SELECT :season, \'league\', player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM awards_avg ORDER BY (0.75 * ppg) + apg + rpg DESC LIMIT 15)', season=g.season)
    g.dbex('INSERT INTO awards_all_league (season, team_type, player_id, name, abbreviation, ppg, rpg, apg, bpg, spg) (SELECT :season, \'defensive\', player_id, name, abbreviation, ppg, rpg, apg, bpg, spg FROM awards_avg ORDER BY rpg + 5 * bpg + 5 * spg DESC LIMIT 15)', season=g.season)

    g.dbex('DROP TABLE awards_avg')

def set_schedule(team_ids):
    """Save the schedule to the database, overwriting what's currently there.

    Args:
        team_ids: A list of lists, each containing the team IDs of the home and
            away teams, respectively, for every game in the season.
    """
    g.dbex('DELETE FROM schedule')
    for home_team_id, away_team_id in team_ids:
        g.dbex('INSERT INTO schedule (home_team_id, away_team_id) VALUES (:home_team_id, :away_team_id)', home_team_id=home_team_id, away_team_id=away_team_id)

def get_schedule(n_games=0):
    """Returns a list of n_games games, or all games in the schedule if n_games
    is 0 (default). Each element in the list is a dict with keys 'game_id',
    'home_team_id', and 'away_team_id'.
    """
    if n_games > 0:
        r = g.dbex('SELECT game_id, home_team_id, away_team_id FROM schedule ORDER BY game_id ASC LIMIT :n_games', n_games=n_games)
    else:
        r = g.dbex('SELECT game_id, home_team_id, away_team_id FROM schedule ORDER BY game_id ASC')
    return [dict(row) for row in r.fetchall()]
