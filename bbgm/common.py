import gtk
import os
import sqlite3

# When DEBUG is True:
# - Debugging info (largely related to updating treeviews) is printed to the
#   console
# - The internal "Value" variable is shown when you're making a trade, which
#   lets you see what the CPU team is thinking
DEBUG = True

# If True, will attempt to use numpy for random numbers, which is about 10%
# faster. If numpy is not available, it will automatically fall back on
# Python's random module. So, this should only be set to False for debugging.
NUMPY = True

TEAMS = range(30)  # If team id's aren't consecutive integers starting with 0, then some things will break
SEASON_LENGTH = 82  # If this isn't 82 the scheduling gets fucked up.  Only set it lower for debugging (faster seasons)

SRC_FOLDER = os.path.dirname(os.path.abspath(__file__))

SAVES_FOLDER = os.path.expanduser('~/.basketball-gm')
DB_TEMP_FILENAME = os.path.join(SAVES_FOLDER, 'temp.sqlite')
DB_FILENAME = os.path.join(SAVES_FOLDER, 'temp.sqlite')

if not os.path.exists(SAVES_FOLDER):
    os.mkdir(SAVES_FOLDER, 0755)

DB_CON = ''  # Placeholder. Set by bbgm.views.main_window.connect()

# These are set to real values in basketball_gm.py
PLAYER_TEAM_ID = 3
SEASON = 2011

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


def treeview_build_new(treeview, column_types, column_info, tooltips = []):
    """Shortcut function to add columns and a ListStore to a treeview.

    Args:
        treeview: gtk.treview instance.
        column_types: A list of data types for the columns in the model.
        column_info: A list containing four lists of equal size, with each set
            of four elements from those lists corresponding to one visible
            column. 1: title; 2: column ID (corresponds to index in
            column_types); 3: sortable? (boolean); 4: truncate after first
            decimal place? (boolean).
        tooltips: A vector of the same size as each of the lists in column_info
            (one element for each displayed column) containing the tooltips for
            the column headers. Blank strings mean no tooltip. Also, if no
            vector is given, no tooltips will be shown.
    """
    for i in range(len(column_info[0])):
        if len(tooltips) > 0:
            tooltip = tooltips[i]
        else:
            tooltip = ''

        add_column(treeview, column_info[0][i], column_info[1][i], column_info[2][i], column_info[3][i], tooltip)

    liststore = gtk.ListStore(*column_types)
    treeview.set_model(liststore)


def treeview_update_new(treeview, query_ids, params_ids, query_row, params_row, query_row_alt='', params_row_alt=[-1], query_row_alt_2='', params_row_alt_2=[-1]):
    """Shortcut function to update a list of players in a treeview.

    This function will update a list of, i.e., players (showing stats, ratings,
    whatever) in a treeview by updating players already in the model, deleting
    players who should no longer be in the model, and adding players who now
    need to be in the model. So if the user switches to viewing another team,
    or new stats are recorded, or a trade happens, etc... this function can
    handle it.

    This works most efficiently when all the rows in the model need updating.
    Otherwise, it's somewhat inefficient and I should probably write another
    function optimized for those cases.

    Three queries are used rather than just one because when a player is first
    added to a team (or at the beginning of a season), he doesn't have any
    stats with that team, so that would fuck up queries on player_stats.

    If you're absolutely sure you'll never need them, the last four arguments
    are optional.

    There are a few gotchas, so please read the description of the arguments
    below.

    Args:
        treeview: gtk.treeview instance. Must already have a model, such as if
            treeview_build_new is called first. Also, the first column in the
            model MUST correspond to the IDs returned by query_ids.
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
            there is nothing returned for query_row (i.e. no stats right after
            the draft).
        params_row_alt: Like params_row, but for query_row_alt.
        query_row_alt_2: SQL query that will run for each player ID in cases
            when there is nothing returned for query_row (i.e. no stats right
            after the draft).
        params_row_alt_2: Like params_row, but for query_row_alt_2.
    """
    treeview.freeze_child_notify()

    liststore = treeview.get_model()

    do_not_delete = []  # List of row_id

    for row_id, in DB_CON.execute(query_ids, tuple(params_ids)):
        params_row[0] = row_id
        params_row_alt[0] = row_id
        params_row_alt_2[0] = row_id
        found_row_id = False
        for i in xrange(len(liststore)):
            if liststore[i][0] == row_id:
                do_not_delete.append(row_id)
                found_row_id = True
                break  # We found the row_id in the liststore, so move on to next row

        # Get row contents
        row = DB_CON.execute(query_row, params_row).fetchone()
        if row == None or row[0] == None:
            # Run alternative query if necessary, i.e. for players with no stats
            row = DB_CON.execute(query_row_alt, params_row_alt).fetchone()
        if row == None or row[0] == None:
            # Run second alternative query if necessary, i.e. for players with no stats
            row = DB_CON.execute(query_row_alt_2, params_row_alt_2).fetchone()

        values = []
        for j in range(0, len(row)):
            if row[j] == None:
                values.append(0.0)
            else:
                values.append(row[j])

        # Add a new row or update an existing row?
        if not found_row_id:
            liststore.append(values)  # Add row
        else:
            liststore[i] = values  # Update row

        do_not_delete.append(row_id)  # This row was either added to the list or updated

    # Remove rows from model if they shouldn't be showing
    for i in reversed(xrange(len(liststore))):  # Search backwards to not fuck things up
        if liststore[i][0] not in do_not_delete:
            del liststore[i]

    treeview.thaw_child_notify()


def add_column(treeview, title, column_id, sort=False, truncate_float=False, tooltip=''):
    renderer = gtk.CellRendererText()
    column = gtk.TreeViewColumn()
    column.pack_start(renderer, True)
    column.add_attribute(renderer, 'text', column_id)

    if len(tooltip) > 0:
        tooltips = gtk.Tooltips()
        column_header = gtk.Label(title)
        column_header.show()
        column.set_widget(column_header)
        tooltips.set_tip(column_header, tooltip)
    else:
        column.set_title(title)

    if sort:
        column.set_sort_column_id(column_id)
    if truncate_float:
      # Truncate floats to 1 decimal place
        column.set_cell_data_func(renderer, lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, column_id)))
    treeview.append_column(column)


def roster_auto_sort(team_id, from_button=False):
    """Sort the roster of team_id by overall rating."""
    players = []
    query = 'SELECT player_attributes.player_id, player_ratings.overall, player_ratings.endurance FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC'

    for row in DB_CON.execute(query, (team_id,)):
        players.append(list(row))

    # Order
    players.sort(cmp=lambda x, y: y[1] - x[1])  # Sort by rating

    # Update
    roster_position = 1
    for player in players:
        DB_CON.execute('UPDATE player_ratings SET roster_position = ? WHERE player_id = ?', (roster_position, player[0]))
        roster_position += 1
