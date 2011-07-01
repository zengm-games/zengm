import gtk
import os
import shutil
import sqlite3

TEAMS = range(30) # If team id's aren't consecutive integers starting with 0, then some things will break
SEASON_LENGTH = 82 # If this isn't 82 the scheduling gets fucked up.  Only set it lower for debugging (faster seasons)

SRC_FOLDER = os.path.dirname(os.path.abspath(__file__))

# basketball_gm.xml should be in the same folder as this file
# GTKBUILDER_PATH = os.path.join(SRC_FOLDER, 'basketball_gm.xml');
GTKBUILDER_PATH = os.path.join(SRC_FOLDER, 'ui', 'basketballgm.glade');

DATA_FOLDER = os.path.join(SRC_FOLDER, 'data')
TEMPLATES_FOLDER = os.path.join(SRC_FOLDER, 'ui', 'templates')
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

def treeview_build_new(treeview, column_types, column_info):
    """Shortcut function to add columns and a liststore to a treeview.

    Args:
        treeview: gtk.treview instance.
        column_types: A list of data types for the columns in the model
        column_info: A list containing four lists of equal size, with each set
            of four elements from those lists corresponding to one visible
            column. 1: title; 2: column ID (corresponds to index in
            column_types); 3: sortable? (boolean); 4: truncate after first
            decimal place? (boolean).
    """
    for i in range(len(column_info[0])):
        add_column(treeview, column_info[0][i], column_info[1][i], column_info[2][i], column_info[3][i])

    liststore = gtk.ListStore(*column_types)
    treeview.set_model(liststore)

def treeview_update_new(treeview, query_ids, params_ids, query_row, params_row, query_row_alt, params_row_alt):
    """Shortcut function to update a list of players in a treeview.

    This function will update a list of players (showing stats, ratings,
    whatever) in a treeview by updating players already in the model, deleting
    players who should no longer be in the model, and adding players who now
    need to be in the model. So if the user switches to viewing another team,
    or new stats are recorded, or a trade happens, etc... this function can
    handle it.

    Args:
        treeview: gtk.treeview instance. Must already have a model, such as if
            treeview_build_new is called first.
        query_ids: SQL query that will return a list of player IDs for the
            players that are to be shown.
        params_ids: A list of parameters used in query_ids.
        query_row: SQL query that will run for each player ID from the other
            query, and return exactly the elements to add to the model for this
            player.
        params_row: A list of parameters used in query_row. NOTE: the first
            parameter in this list should be a dummy/placeholder, as it is
            replaced by the appropriate player ID!
        query_row_alt: SQL query that will run for each player ID in cases when
            there are no stats entered for a player (such as right after the
            draft).
        params_row_alt: A list of parameters used in query_row_alt. NOTE: the
            first parameter in this list should be a dummy/placeholder, as it
            is replaced by the appropriate player ID!
    """
    treeview.freeze_child_notify()

    liststore = treeview.get_model()

    do_not_delete = [] # List of player_id

    for player_id, in DB_CON.execute(query_ids, tuple(params_ids)):
        params_row[0] = player_id
        params_row_alt[0] = player_id
        found_player = False
        for i in xrange(len(liststore)):
            if liststore[i][0] == player_id:
                do_not_delete.append(player_id)
                found_player = True
                break # We found the player in the liststore, so move on to next player

        # Get row contents
        row = DB_CON.execute(query_row, params_row).fetchone()
        if row == None:
            # Run alternative query if necessary, for players with no stats
            row = DB_CON.execute(query_row_alt, params_row_alt).fetchone()
        values = []
        for j in range(0, len(row)):
            if row[j] == None:
                values.append(0.0)
            else:
                values.append(row[j])

        # Add a new row or update an existing row?
        if not found_player:
            liststore.append(values) # Add row
        else:
            liststore[i] = values # Update row

        do_not_delete.append(player_id) # This player was either added to the list or updated

    # Remove rows from model if they shouldn't be showing
    for i in reversed(xrange(len(liststore))): # Search backwards to not fuck things up
        if liststore[i][0] not in do_not_delete:
            del liststore[i]

    treeview.thaw_child_notify()

def add_column(treeview, title, column_id, sort=False, truncate_float=False):
    renderer = gtk.CellRendererText()
    column = gtk.TreeViewColumn(title, renderer, text=column_id)
    if sort:
        column.set_sort_column_id(column_id)
    if truncate_float:
      # Truncate floats to 1 decimal place
        column.set_cell_data_func(renderer, lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, column_id)))
    treeview.append_column(column)

