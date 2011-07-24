import gtk
import locale

from bbgm import common
from bbgm.util import resources


class FinancesTab:
    updated = False
    built = False

    def build(self):
        if common.DEBUG:
            print 'build finances_tab'

        renderer = gtk.CellRendererText()
        column = gtk.TreeViewColumn('Team', renderer, text=1)
        column.set_sort_column_id(1)
        self.treeview_finances.append_column(column)
        renderer = gtk.CellRendererText()
        column = gtk.TreeViewColumn('Avg Attendance', renderer, text=2)
        column.set_sort_column_id(2)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%s' % locale.format('%d', model.get_value(iter, 2), True)))
        self.treeview_finances.append_column(column)
        renderer = gtk.CellRendererText()
        column = gtk.TreeViewColumn('Revenue (YTD)', renderer, text=3)
        column.set_sort_column_id(3)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 3) / 1000000.0, True, True)))
        self.treeview_finances.append_column(column)
        column = gtk.TreeViewColumn('Profit (YTD)', renderer, text=4)
        column.set_sort_column_id(4)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 4) / 1000000.0, True, True)))
        self.treeview_finances.append_column(column)
        column = gtk.TreeViewColumn('Cash', renderer, text=5)
        column.set_sort_column_id(5)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 5) / 1000000.0, True, True)))
        self.treeview_finances.append_column(column)
        column = gtk.TreeViewColumn('Payroll', renderer, text=6)
        column.set_sort_column_id(6)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 6) / 1000000.0, True, True)))
        self.treeview_finances.append_column(column)

        column_types = [int, str, int, int, int, int, int]
        liststore = gtk.ListStore(*column_types)
        self.treeview_finances.set_model(liststore)
#        self.update()

        self.mw.notebook.insert_page(self.vbox9, gtk.Label('Finances'), self.mw.pages['finances'])

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

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'finances_tab.ui'))

        self.vbox9 = self.builder.get_object('vbox9')
        self.treeview_finances = self.builder.get_object('treeview_finances')

        self.builder.connect_signals(self)

#        self.build()
