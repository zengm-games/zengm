import gtk
import os.path
import sqlite3

from bbgm import common
from bbgm.util import resources


class StandingsTab:
    updated = False
    built = False
    combobox_active = 0

    def on_combobox_standings_changed(self, combobox, data=None):
        old = self.combobox_active
        self.combobox_active = combobox.get_active()
        if self.combobox_active != old:
            self.update()

    def build(self):
        if common.DEBUG:
            print 'build standings_tab'

        max_divisions_in_conference, num_conferences = common.DB_CON.execute('SELECT (SELECT COUNT(*) FROM league_divisions GROUP BY conference_id ORDER BY COUNT(*) LIMIT 1), COUNT(*) FROM league_conferences').fetchone()
        try:
            self.table_standings.destroy()  # Destroy table if it already exists... this will be called after starting a new game from the menu
        except:
            pass
        self.table_standings = gtk.Table(max_divisions_in_conference, num_conferences)
        self.scrolledwindow_standings = self.builder.get_object('scrolledwindow_standings')
        self.scrolledwindow_standings.add_with_viewport(self.table_standings)

        self.treeview_standings = {}  # This will contain treeviews for each conference
        conference_id = -1
        for row in common.DB_CON.execute('SELECT division_id, conference_id, name FROM league_divisions'):
            if conference_id != row[1]:
                row_top = 0
                conference_id = row[1]

            self.treeview_standings[row[0]] = gtk.TreeView()
            self.table_standings.attach(self.treeview_standings[row[0]], conference_id, conference_id + 1, row_top, row_top + 1)
            column_info = [[row[2], 'Won', 'Lost', 'Pct', 'Div', 'Conf'],
                           [0,      1,     2,      3,     4,     5],
                           [False,  False, False,  False, False, False],
                           [False,  False, False,  True,  False, False]]
            common.treeview_build(self.treeview_standings[row[0]], column_info)
            self.treeview_standings[row[0]].show()

            row_top += 1

        self.mw.hbox1.pack_start(self.vbox4)  # When I had all the tabs added dynamically, the switch-notes signal went crazy. So I have the first one added like this.
#        self.mw.notebook.insert_page(self.vbox4, gtk.Label('Standings'), self.mw.pages['standings'])

        self.table_standings.show()
        self.built = True

    def update(self):
        if common.DEBUG:
            print 'update standings_tab'

        season = self.mw.make_season_combobox(self.combobox_standings, self.combobox_active)

        for row in common.DB_CON.execute('SELECT division_id FROM league_divisions'):
            column_types = [str, int, int, float, str, str]
            query = 'SELECT region || " "  || name, won, lost, 100*won/(won + lost), won_div || "-" || lost_div, won_conf || "-" || lost_conf FROM team_attributes WHERE season = ? AND division_id = ? ORDER BY won/(won + lost) DESC'
            common.treeview_update(self.treeview_standings[row[0]], column_types, query, (season, row[0]))
        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'standings_tab.glade'))

        self.vbox4 = self.builder.get_object('vbox4')
        self.scrolledwindow_standings = self.builder.get_object('scrolledwindow_standings')
        self.combobox_standings = self.builder.get_object('combobox_standings')

        self.builder.connect_signals(self)

#        self.build()
