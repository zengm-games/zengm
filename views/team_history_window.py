import gtk
import sqlite3

import common

class TeamHistoryWindow:
    updated = False

    def update(self):
        query = 'SELECT season, won, lost, playoffs, won_conference, won_championship FROM team_attributes WHERE team_id = ? ORDER BY season DESC'
        text = ''
        for row in common.DB_CON.execute(query, (common.PLAYER_TEAM_ID,)):
            season, won, lost, playoffs, won_conference, won_championship = row
            text += '%d season: %d-%d' % (season, won, lost)
            if won_championship:
                text += ', <b>LEAGUE CHAMPIONS</b>\n'
            elif won_conference:
                text += ', <b>conference champions</b>\n'
            elif playoffs:
                text += ', made playoffs\n'
            else:
                text += '\n'

        self.label.set_markup(text)

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file('ui/team_history_window.glade')

        self.team_history_window = self.builder.get_object('team_history_window')
        self.label = self.builder.get_object('label')

        self.builder.connect_signals(self)
