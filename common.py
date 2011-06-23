import gtk
import os
import shutil

TEAMS = range(30) # If team id's aren't consecutive integers starting with 0, then some things will break
SEASON_LENGTH = 82 # If this isn't 82 the scheduling gets fucked up.  Only set it lower for debugging (faster seasons)

SRC_FOLDER = os.path.dirname(os.path.abspath(__file__))

# basketball_gm.xml should be in the same folder as this file
# GTKBUILDER_PATH = os.path.join(SRC_FOLDER, 'basketball_gm.xml');
GTKBUILDER_PATH = os.path.join(SRC_FOLDER, 'ui/basketballgm.glade');

DATA_FOLDER = os.path.join(SRC_FOLDER, 'data')
SAVES_FOLDER = os.path.expanduser('~/.basketball-gm')
DB_TEMP_FILENAME = os.path.join(SAVES_FOLDER, 'temp.sqlite')
DB_FILENAME = os.path.join(SAVES_FOLDER, 'temp.sqlite')

if not os.path.exists(SAVES_FOLDER):
    os.mkdir(SAVES_FOLDER, 0755)

# These are set to real values in basketball_gm.py
PLAYER_TEAM_ID = 3
SEASON = 2008

# These should probably be defined somewhere else (user settings)
SALARY_CAP = 60000
TICKET_PRICE = 45

# SQLAlchemy Session, to be later connected to an engine
from sqlalchemy.orm import sessionmaker
Session = sessionmaker()

# These functions are crap and should be replaced eventually
def treeview_build(treeview, column_info):
    """
    Shortcut function to add columns to a treeview
    """
    for i in range(len(column_info[0])):
        add_column(treeview, column_info[0][i], column_info[1][i], column_info[2][i], column_info[3][i])

def treeview_update(treeview, column_types, query, query_bindings=()):
    """
    Shortcut function to add data to a treeview
    """
    liststore = gtk.ListStore(*column_types)
    treeview.set_model(liststore)
    for row in DB_CON.execute(query, query_bindings):
        values = []
        for i in range(0, len(row)):
            # Divide by zero errors
            if row[i] == None:
                values.append(0.0)
            else:
                values.append(row[i])
        liststore.append(values)

def add_column(treeview, title, column_id, sort=False, truncate_float=False):
    renderer = gtk.CellRendererText()
    column = gtk.TreeViewColumn(title, renderer, text=column_id)
    if sort:
        column.set_sort_column_id(column_id)
    if truncate_float:
      # Truncate floats to 1 decimal place
        column.set_cell_data_func(renderer, lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, column_id)))
    treeview.append_column(column)

