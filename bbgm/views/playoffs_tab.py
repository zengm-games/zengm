from gi.repository import Gtk

from bbgm import common
from bbgm.util import resources


class PlayoffsTab:
    updated = False
    built = False

    def build(self):
        if common.DEBUG:
            print 'build playoffs_tab'

        self.mw.notebook.insert_page(self.table8, Gtk.Label(label='Playoffs'), self.mw.pages['playoffs'])

        self.built = True

    def update(self):
        if common.DEBUG:
            print 'update playoffs_tab'

        # Initialize to blank page
        for i in range(4):
            ii = 3 - i
            for j in range(2 ** ii):
                self.label_playoffs[i + 1][j + 1].set_text('')

        # Update cells
        for series_id, series_round, name_home, name_away, seed_home, seed_away, won_home, won_away in common.DB_CON.execute('SELECT series_id, series_round, (SELECT region || " " || name FROM team_attributes WHERE team_id = active_playoff_series.team_id_home), (SELECT region || " " || name FROM team_attributes WHERE team_id = active_playoff_series.team_id_away), seed_home, seed_away, won_home, won_away FROM active_playoff_series'):
            self.label_playoffs[series_round][series_id].set_text('%d. %s (%d)\n%d. %s (%d)' % (seed_home, name_home, won_home, seed_away, name_away, won_away))

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = Gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'playoffs_tab.ui'))

        self.table8 = self.builder.get_object('table8')
        self.label_playoffs = {1: {}, 2: {}, 3: {}, 4: {}}
        for i in range(4):
            ii = 3 - i
            for j in range(2 ** ii):
                self.label_playoffs[i + 1][j + 1] = self.builder.get_object('label_playoffs_%d_%d' % (i + 1, j + 1))

        self.builder.connect_signals(self)

#        self.build()
#        self.update()
