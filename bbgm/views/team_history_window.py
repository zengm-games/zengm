import gtk

from bbgm import common
from bbgm.util import resources


class TeamHistoryWindow:
    updated = False

    def on_team_history_window_response(self, widget, response, data=None):
        self.team_history_window.hide()

    def on_team_history_window_close(self, widget, data=None):
        self.team_history_window.hide()
        return True

    def update(self):
        if common.DEBUG:
            print 'update team_history_window'

        query = 'SELECT season, won, lost, playoffs, won_conference, won_championship FROM team_attributes WHERE team_id = ? ORDER BY season DESC'
        text = ''
        for season, won, lost, playoffs, won_conference, won_championship in common.DB_CON.execute(query, (common.PLAYER_TEAM_ID,)):
#             = row
            text += '%d season: %d-%d' % (season, won, lost)
            if won_championship:
                text += ', <b>LEAGUE CHAMPIONS</b>\n'
            elif won_conference:
                text += ', <b>conference champions</b>\n'
            elif playoffs:
                text += ', made playoffs\n'
            else:
                text += '\n'

        self.label.set_markup(text.rstrip())

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'team_history_window.ui'))

        self.team_history_window = self.builder.get_object('team_history_window')
        self.label = self.builder.get_object('label')

        self.builder.connect_signals(self)
