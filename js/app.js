console.log('yo');
    var leagues = [{'lid': 1, 'team': 'Team 1', 'pm_phase': 'Phase 1'},
       {'lid': 2, 'team': 'Team 2', 'pm_phase': 'Phase 2'},
       {'lid': 3, 'team': 'Team 3', 'pm_phase': 'Phase 443'}
    ];

    var teams = [
        {'tid': 0, 'did': 2, 'region': 'Atlanta', 'name': 'Herons', 'abbrev': 'ATL'},
        {'tid': 1, 'did': 0, 'region': 'Boston', 'name': 'Clovers', 'abbrev': 'BOS'},
        {'tid': 2, 'did': 2, 'region': 'Charlotte', 'name': 'Bay Cats', 'abbrev': 'CHA'},
        {'tid': 3, 'did': 1, 'region': 'Chicago', 'name': 'Bullies', 'abbrev': 'CHI'},
        {'tid': 4, 'did': 1, 'region': 'Cleveland', 'name': 'Cobras', 'abbrev': 'CLE'},
        {'tid': 5, 'did': 3, 'region': 'Dallas', 'name': 'Mares', 'abbrev': 'DAL'},
        {'tid': 6, 'did': 4, 'region': 'Denver', 'name': 'Ninjas', 'abbrev': 'DEN'},
        {'tid': 7, 'did': 1, 'region': 'Detroit', 'name': 'Pumps', 'abbrev': 'DET'},
        {'tid': 8, 'did': 5, 'region': 'Golden State', 'name': 'War Machine', 'abbrev': 'GSW'},
        {'tid': 9, 'did': 3, 'region': 'Houston', 'name': 'Rock Throwers', 'abbrev': 'HOU'},
        {'tid': 10, 'did': 1, 'region': 'Indiana', 'name': 'Passers', 'abbrev': 'IND'},
        {'tid': 11, 'did': 5, 'region': 'Los Angeles', 'name': 'Cutters', 'abbrev': 'LAC'},
        {'tid': 12, 'did': 5, 'region': 'Los Angeles', 'name': 'Lagoons', 'abbrev': 'LAL'},
        {'tid': 13, 'did': 3, 'region': 'Memphis', 'name': 'Growls', 'abbrev': 'MEM'},
        {'tid': 14, 'did': 2, 'region': 'Miami', 'name': 'Heatwave', 'abbrev': 'MIA'},
        {'tid': 15, 'did': 1, 'region': 'Milwaukee', 'name': 'Buccaneers', 'abbrev': 'MIL'},
        {'tid': 16, 'did': 4, 'region': 'Minnesota', 'name': 'Trees', 'abbrev': 'MIN'},
        {'tid': 17, 'did': 0, 'region': 'New Jersey', 'name': 'Nests', 'abbrev': 'NJN'},
        {'tid': 18, 'did': 3, 'region': 'New Orleans', 'name': 'Honey Bees', 'abbrev': 'NOR'},
        {'tid': 19, 'did': 0, 'region': 'New York', 'name': 'Knights', 'abbrev': 'NYK'},
        {'tid': 20, 'did': 2, 'region': 'Orlando', 'name': 'Mystery', 'abbrev': 'ORL'},
        {'tid': 21, 'did': 0, 'region': 'Philadelphia', 'name': 'Steaks', 'abbrev': 'PHI'},
        {'tid': 22, 'did': 5, 'region': 'Phoenix', 'name': 'Stars', 'abbrev': 'PHO'},
        {'tid': 23, 'did': 4, 'region': 'Portland', 'name': 'Trailer Park', 'abbrev': 'POR'},
        {'tid': 24, 'did': 5, 'region': 'Sacramento', 'name': 'Killers', 'abbrev': 'SAC'},
        {'tid': 25, 'did': 3, 'region': 'San Antonio', 'name': 'Spurts', 'abbrev': 'SAS'},
        {'tid': 26, 'did': 4, 'region': 'Seattle', 'name': 'Sudoers', 'abbrev': 'SEA'},
        {'tid': 27, 'did': 0, 'region': 'Toronto', 'name': 'Ravens', 'abbrev': 'TOR'},
        {'tid': 28, 'did': 4, 'region': 'Utah', 'name': 'Jugglers', 'abbrev': 'UTA'},
        {'tid': 29, 'did': 2, 'region': 'Washington', 'name': 'Witches', 'abbrev': 'WAS'}
    ];

    $(document).ready(function() {
      var app = Davis(function () {
          this.get('/l/:lid', function (req) {
              $('body').append('<h1>Hello there, ' + req.params['lid'] + '!</h1>');
          });
          this.get('/init_db', views.init_db);
          this.get('/', views.dashboard);
          this.get('/new_league', views.new_league);
          this.post('/new_league', views.new_league);
      });
        app.start();

        // Load appropriate view based on location bar
        Davis.location.assign(new Davis.Request(window.location.pathname));
    });
console.log('yo');
