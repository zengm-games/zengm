from gi.repository import Gtk

from bbgm import common
from bbgm.util import resources


class FinancesTab:
    updated = False
    built = False

    def build(self):
        if common.DEBUG:
            print 'build finances_tab'

        renderer = Gtk.CellRendererText()
        column = Gtk.TreeViewColumn('Team', renderer, text=1)
        column.set_sort_column_id(1)
        self.treeview_finances.append_column(column)
        renderer = Gtk.CellRendererText()
        column = Gtk.TreeViewColumn('Avg Attendance', renderer, text=2)
        column.set_sort_column_id(2)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter_, data=None: cell.set_property('text', '%s' % self.group(model.get_value(iter_, 2))))
        self.treeview_finances.append_column(column)
        renderer = Gtk.CellRendererText()
        column = Gtk.TreeViewColumn('Revenue (YTD)', renderer, text=3)
        column.set_sort_column_id(3)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter_, data=None: cell.set_property('text', '$%.2fM' % float(model.get_value(iter_, 3) / 1000000.0)))
        self.treeview_finances.append_column(column)
        column = Gtk.TreeViewColumn('Profit (YTD)', renderer, text=4)
        column.set_sort_column_id(4)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter_, data=None: cell.set_property('text', '$%.2fM' % float(model.get_value(iter_, 4) / 1000000.0)))
        self.treeview_finances.append_column(column)
        column = Gtk.TreeViewColumn('Cash', renderer, text=5)
        column.set_sort_column_id(5)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter_, data=None: cell.set_property('text', '$%.2fM' % float(model.get_value(iter_, 5) / 1000000.0)))
        self.treeview_finances.append_column(column)
        column = Gtk.TreeViewColumn('Payroll', renderer, text=6)
        column.set_sort_column_id(6)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter_, data=None: cell.set_property('text', '$%.2fM' % float(model.get_value(iter_,  6) / 1000000.0)))
        self.treeview_finances.append_column(column)

        column_types = [int, str, int, int, int, int, int]
        liststore = Gtk.ListStore(*column_types)
        self.treeview_finances.set_model(liststore)
#        self.update()

        self.mw.notebook.insert_page(self.vbox9, Gtk.Label(label='Finances'), self.mw.pages['finances'])

        self.built = True

    def update(self):
        if common.DEBUG:
            print 'update finances_tab'

        query_ids = 'SELECT team_id FROM team_attributes WHERE season = ? ORDER BY region ASC, name ASC'
        params_ids = [common.SEASON]
        query_row = 'SELECT ta.team_id, ta.region || " " || ta.name, AVG(ts.attendance), SUM(ts.attendance)*%d, SUM(ts.attendance)*%d - SUM(ts.cost), ta.cash, (SELECT SUM(contract_amount*1000) FROM player_attributes WHERE player_attributes.team_id = ta.team_id) + (SELECT TOTAL(contract_amount*1000) FROM released_players_salaries WHERE released_players_salaries.team_id = ta.team_id) FROM team_attributes as ta, team_stats as ts WHERE ta.team_id = ? AND ta.season = ts.season AND ta.season = ? AND ta.team_id = ts.team_id' % (common.TICKET_PRICE, common.TICKET_PRICE)
        params_row = [-1, common.SEASON]
        query_row_alt = 'SELECT team_id, region || " " || name, 0, 0, 0, cash, (SELECT SUM(contract_amount*1000) FROM player_attributes WHERE player_attributes.team_id = team_attributes.team_id) + (SELECT TOTAL(contract_amount*1000) FROM released_players_salaries WHERE released_players_salaries.team_id = team_attributes.team_id) FROM team_attributes WHERE team_id = ? AND season = ?'
        params_row_alt = [-1, common.SEASON]

        common.treeview_update_new(self.treeview_finances, query_ids, params_ids, query_row, params_row, query_row_alt, params_row_alt)

        self.updated = True

    def group(self, number):
        """Add commas every 3 places in a number."""
        s = '%d' % number
        groups = []
        while s and s[-1].isdigit():
            groups.append(s[-3:])
            s = s[:-3]
        return s + ','.join(reversed(groups))

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = Gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'finances_tab.ui'))

        self.vbox9 = self.builder.get_object('vbox9')
        self.treeview_finances = self.builder.get_object('treeview_finances')

        self.builder.connect_signals(self)

#        self.build()
