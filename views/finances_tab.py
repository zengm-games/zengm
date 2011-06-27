import gtk
import locale
import sqlite3

import common

class FinancesTab:
    updated = False
    built = False

    def build(self):
        print 'build finances'
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
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 3)/1000000.0, True, True)))
        self.treeview_finances.append_column(column)
        column = gtk.TreeViewColumn('Profit (YTD)', renderer, text=4)
        column.set_sort_column_id(4)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 4)/1000000.0, True, True)))
        self.treeview_finances.append_column(column)
        column = gtk.TreeViewColumn('Cash', renderer, text=5)
        column.set_sort_column_id(5)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 5)/1000000.0, True, True)))
        self.treeview_finances.append_column(column)
        column = gtk.TreeViewColumn('Payroll', renderer, text=6)
        column.set_sort_column_id(6)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%sM' % locale.currency(model.get_value(iter, 6)/1000000.0, True, True)))
        self.treeview_finances.append_column(column)

        column_types = [int, str, int, int, int, int, int]
        query = 'SELECT team_id, region || " " || name, 0, 0, 0, cash, (SELECT SUM(contract_amount*1000) FROM player_attributes WHERE player_attributes.team_id = team_attributes.team_id) FROM team_attributes WHERE season = ? ORDER BY region ASC, name ASC'
        common.treeview_update(self.treeview_finances, column_types, query, (common.SEASON,))

        self.mw.notebook.insert_page(self.vbox9, gtk.Label('Finances2'), self.mw.pages['finances'])

        self.built = True

    def update(self):
        print 'update finances'
        new_values = {}
        query = 'SELECT ta.team_id, ta.region || " " || ta.name, AVG(ts.attendance), SUM(ts.attendance)*?, SUM(ts.attendance)*? - SUM(ts.cost), ta.cash, (SELECT SUM(contract_amount*1000) FROM player_attributes WHERE player_attributes.team_id = ta.team_id) FROM team_attributes as ta, team_stats as ts WHERE ta.season = ts.season AND ta.season = ? AND ta.team_id = ts.team_id GROUP BY ta.team_id ORDER BY ta.region ASC, ta.name ASC'
        for row in common.DB_CON.execute(query, (common.TICKET_PRICE, common.TICKET_PRICE, common.SEASON,)):
            new_values[row[0]] = row[1:]

        model = self.treeview_finances.get_model()
        for row in model:
            if new_values.get(row[0], False):
                i = 1
                for new_value in new_values[row[0]]:
                    model[(row[0],)][i] = new_value
                    i += 1
            else:
                # Reset values when starting a new season
                model[(row[0],)][2] = 0
                model[(row[0],)][3] = 0
                model[(row[0],)][4] = 0

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file('ui/finances_tab.glade')

        self.vbox9 = self.builder.get_object('vbox9')
        self.treeview_finances = self.builder.get_object('treeview_finances')

        self.builder.connect_signals(self)

#        self.build()
#        self.update()

