import os

class Config:
    def __init__(self):
        self.teams = range(30) # If team id's aren't consecutive integers starting with 0, then some things will break
        self.season_len = 82 # If this isn't 82 the scheduling gets fucked up.  Only set it lower for debugging (faster seasons)

        self.launch_dir = os.path.dirname(os.path.abspath(__file__))
        self.source_dir = self.launch_dir
        self.gtkbuilder_path = os.path.join(self.source_dir, 'basketball_gm.glade');
        self.data_dir = os.path.join(self.source_dir, 'data');
        self.saves_dir = os.path.expanduser("~/.basketball-gm")

        # Make saves if it doesn't exist
        if not os.path.exists(self.saves_dir):
            os.mkdir(self.saves_dir, 0755)

        self.t_id = -1 # Placeholder team ID

        self.year_initial = 2011
        self.year = 2011

        # These should probably be defined somewhere else (user settings)
        self.salary_cap = 60000
        self.ticket_price = 45

