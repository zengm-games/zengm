# Play a game.

import sys
import os
import bz2
import sqlite3

sys.path.append("..")

import common
import game_sim

common.DB_FILENAME = os.path.join(common.SAVES_FOLDER, 'test.bbgm')

f = open(common.DB_FILENAME)
data_bz2 = f.read()
f.close()

data = bz2.decompress(data_bz2)

# Write decompressed data from the save file to the temp SQLite DB file
f = open(common.DB_TEMP_FILENAME, 'w')
f.write(data)
f.close()

common.DB_CON = sqlite3.connect(common.DB_TEMP_FILENAME)
common.DB_CON.isolation_level = 'IMMEDIATE'

row = common.DB_CON.execute('SELECT team_id, season, phase, schedule FROM game_attributes').fetchone()
common.PLAYER_TEAM_ID = row[0]
common.SEASON = row[1]

game = game_sim.Game()
game.play(5, 6, False)
game.write_stats()

print game.team[0].stat


# Box score

game_id = game.id

format = '%-23s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s\n'
box = ''
t = 0
common.DB_CON.row_factory = sqlite3.Row

for row in common.DB_CON.execute('SELECT team_id FROM team_stats WHERE game_id = ?', (game_id,)):
    team_id = row[0]
    row2 = common.DB_CON.execute('SELECT region || " " || name FROM team_attributes WHERE team_id = ?', (team_id,)).fetchone()
    team_name_long = row2[0]
    dashes = ''
    for i in range(len(team_name_long)):
        dashes += '-'
    box += team_name_long + '\n' + dashes + '\n'

    box += format % ('Name', 'Pos', 'Min', 'FG', '3Pt', 'FT', 'Off', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'Pts')

    for player_stats in common.DB_CON.execute('SELECT player_attributes.name, player_attributes.position, player_stats.minutes, player_stats.field_goals_made, player_stats.field_goals_attempted, player_stats.three_pointers_made, player_stats.three_pointers_attempted, player_stats.free_throws_made, player_stats.free_throws_attempted, player_stats.offensive_rebounds, player_stats.defensive_rebounds, player_stats.assists, player_stats.turnovers, player_stats.steals, player_stats.blocks, player_stats.personal_fouls, player_stats.points FROM player_attributes, player_stats WHERE player_attributes.player_id = player_stats.player_id AND player_stats.game_id = ? AND player_attributes.team_id = ? ORDER BY player_stats.starter DESC, player_stats.minutes DESC', (game_id, team_id)):
        rebounds = player_stats['offensive_rebounds'] + player_stats['defensive_rebounds']
        box += format % (player_stats['name'], player_stats['position'], player_stats['minutes'], '%s-%s' % (player_stats['field_goals_made'], player_stats['field_goals_attempted']), '%s-%s' % (player_stats['three_pointers_made'], player_stats['three_pointers_attempted']), '%s-%s' % (player_stats['free_throws_made'], player_stats['free_throws_attempted']), player_stats['offensive_rebounds'], rebounds, player_stats['assists'], player_stats['turnovers'], player_stats['steals'], player_stats['blocks'], player_stats['personal_fouls'], player_stats['points'])
    team_stats = common.DB_CON.execute('SELECT *  FROM team_stats WHERE game_id = ? AND team_id = ?', (game_id, team_id)).fetchone()
    rebounds = team_stats['offensive_rebounds'] + team_stats['defensive_rebounds']
    box += format % ('Total', '', 240, '%s-%s' % (team_stats['field_goals_made'], team_stats['field_goals_attempted']), '%s-%s' % (team_stats['three_pointers_made'], team_stats['three_pointers_attempted']), '%s-%s' % (team_stats['free_throws_made'], team_stats['free_throws_attempted']), team_stats['offensive_rebounds'], rebounds, team_stats['assists'], team_stats['turnovers'], team_stats['steals'], team_stats['blocks'], team_stats['personal_fouls'], team_stats['points'])
    if (t==0):
        box += '\n'
    t += 1

print box
