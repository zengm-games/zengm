var views = (function() {
    return {
        dashboard: function() {
            var data = {'title': 'Dashboard'};
            var url = '/';

leagues = [{'lid': 1, 'team': 'Team 1', 'pm_phase': 'Phase 1'},
           {'lid': 2, 'team': 'Team 2', 'pm_phase': 'Phase 2'},
           {'lid': 3, 'team': 'Team 3', 'pm_phase': 'Phase 3'},
           {'lid': 4, 'team': 'Team 4', 'pm_phase': 'Phase 4'}
          ]

            template = Handlebars.templates['dashboard'];
            context = {'leagues': leagues};
            data['content'] = template(context);

            ajax_update(data, url);
        }
    };
})();
