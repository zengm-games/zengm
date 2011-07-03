import common
import random
import sqlite3

class Schedule:
    def generate(self):
        teams = [] # division_id, conference_id
        for row in common.DB_CON.execute('SELECT team_id, division_id, (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) FROM team_attributes WHERE season = ?', (common.SEASON,)):
            teams.append({'team_id': row[0], 'division_id': row[1], 'conference_id': row[2]})

        games = [] # team_id_home, team_id_away

        for i in range(len(teams)):
            for j in range(len(teams)):
                if teams[i]['team_id'] != teams[j]['team_id']:
                    game = [teams[i]['team_id'], teams[j]['team_id']]

                    # Constraint: 1 home game vs. each team in other conference
                    if teams[i]['conference_id'] != teams[j]['conference_id']:
                        games.append(game)

                    # Constraint: 2 home games vs. each team in same division
                    if teams[i]['division_id'] == teams[j]['division_id']:
                        games.append(game)

                    # Constraint: 1-2 home games vs. each team in same conference and different division
                    # Only do 1 now
                    if teams[i]['conference_id'] == teams[j]['conference_id'] and teams[i]['division_id'] != teams[j]['division_id']:
                        games.append(game)

        # Constraint: 1-2 home games vs. each team in same conference and different division
        # Randomly assign games until there are none left
        while len(games) < 82*15:
            # Pick two teams randomly
            i = random.randint(0, 29)
            while True:
                j = random.randint(0, 29)
                if i != j:
                    break

            game = [teams[i]['team_id'], teams[j]['team_id']]

            if teams[i]['conference_id'] == teams[j]['conference_id'] and teams[i]['division_id'] != teams[j]['division_id']:
                # Constraint: <= 2 home games vs. each team in same conference and different division
                count = 0
                for g in range(len(games)):
                    if game == games[g]:
                        count += 1
                        if count == 2:
                            continue

                # Constraint: 41 home games
                count = 0
                for g in range(len(games)):
                    if teams[i]['team_id'] == games[g][0]:
                        count += 1
                        if count == 41:
                            continue

                # Constraing: 41 away games
                count = 0
                for g in range(len(games)):
                    if teams[j]['team_id'] == games[g][1]:
                        count += 1
                        if count == 41:
                            continue

                games.append(game)

        random.shuffle(games)

        return games

