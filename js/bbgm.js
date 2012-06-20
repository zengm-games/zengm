define([], function() {
    // Play button
    function play_button(url) {
        $.post(url, function (data) {
            var url = data['url'];

            if (url && url != document.URL) {
                $.getJSON(data['url'], {'json': 1}, function (data) {
                    ajaxUpdate(data, url);
                    var result = parse_league_url(document.URL);
                    var league_page = result[2];
                    highlight_nav(league_page);
                });
            }
            if ((schedule && schedule.length > 0) || playoffs_continue) {
                // Stop game simulation when user leaves the page
                window.onunload = function() {
                    var result = parse_league_url(document.URL);
                    var league_root_url = result[1];
                    $.ajax({
                        type: 'POST',
                        url: league_root_url + '/play/stop',
                        async: false
                    });
                };

                var results = [];
                for (var i=0; i<schedule.length; i++) {
                    gs = new GameSim(schedule[i]['gid'], teams[schedule[i]['home_tid']], teams[schedule[i]['away_tid']]);
                    results.push(gs.run());
                }
                var result = parse_league_url(document.URL);
                var league_root_url = result[1];
                $.post(league_root_url + '/save_results', {'results': JSON.stringify(results)});
                num_days = num_days - 1;
                if (num_days >= 0) {
                    play_button(league_root_url + '/play/' + num_days);
                }
                if (num_days == 0) {
                    window.onunload = function() {};
                }
            }
        }, 'json');
    }

    // For AJAX updating pages
    function ajaxUpdate(data) {
        if (data.hasOwnProperty('title')) {
            $('title').text(data['title'] + ' - Basketball GM');
        }
        if (data.hasOwnProperty('league_content')) {
            $('#league_content').html(data['league_content']);
        }
        if (data.hasOwnProperty('content')) {
            $('#content').html(data['content']);
        }
        if (data.hasOwnProperty('message')) {
            alert(data['message']);
        }
    }

    // Data tables
    function bbgm_datatable(table, sort_col, data) {
        table.dataTable( {
            "aaData": data,
            "aaSorting": [[ sort_col, "desc" ]],
            "bDeferRender": true,
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ players per page",
                "sInfo": "Showing _START_ to _END_ of _TOTAL_ players",
                "sInfoEmpty": "Showing 0 to 0 of 0 players",
                "sInfoFiltered": "(filtered from _MAX_ total players)"
            }
        } );
    }
    function bbgm_datatable_singlepage(table, sort_col, data) {
        table.dataTable( {
            "aaData": data,
            "aaSorting": [[ sort_col, "desc" ]],
            "bFilter": false,
            "bInfo": false,
            "bPaginate": false
        } );
    }

    function parse_league_url(url) {
        // Returns a list containing the integer league ID (0 if none), the
        // league root URL up to the league ID (empty string if none), and the
        // league page (first URL folder after the ID) (empty string if none).

        var league_id = 0;
        var league_root_url = '';
        var league_page = '';

        split_url = url.split('/', 6);

        // If there's a URL that starts http://domain.com/l/<int:league_id>,
        // split_url will have length 4 or 5, depending on if there is a page after
        // the league ID.

        if (split_url.length >= 5) {
            league_id = parseInt(split_url[4]);
            league_root_url = split_url.slice(0, 5).join('/');
        }
        if (split_url.length == 6) {
            // Get rid of any trailing #
            league_page = split_url[5].split('#')[0];
        }

        return [league_id, league_root_url, league_page];
    }

    function highlight_nav(league_page) {
        if (league_page == '') {
            league_page = 'league_dashboard';
        }
        $('#league_sidebar li').removeClass('active');
        $('#nav_' + league_page).addClass('active');
    }

    // For dropdown menus to change team/season/whatever
    // This should be cleaned up, but it works for now.
    function dropdown(select1, select2) {
        if (arguments.length == 1) {
            select1.change(function(event) {
                var result = parse_league_url(document.URL);
                var league_root_url = result[1];
                var league_page = result[2];
                var url = league_root_url + '/' + league_page + '/' + select1.val();
                $.ajax({
                    type: 'GET',
                    url: url,
                    data: {'json': 1},
                    success: function (data) {
                        ajaxUpdate(data, url);
                    },
                    dataType: 'json'
                });
            });
        }
        else if (arguments.length == 2) {
            select1.change(function(event) {
                var result = parse_league_url(document.URL);
                var league_root_url = result[1];
                var league_page = result[2];
                var url = '/l/' + g.lid + '/' + league_page + '/' + select1.val() + '/' + select2.val();
                Davis.location.assign(new Davis.Request(url));
            });
            select2.change(function(event) {
                var result = parse_league_url(document.URL);
                var league_root_url = result[1];
                var league_page = result[2];
                var url = '/l/' + g.lid + '/' + league_page + '/' + select1.val() + '/' + select2.val();
                Davis.location.assign(new Davis.Request(url));
            });
        }
    }

    $(document).ready(function() {
        var result = parse_league_url(document.URL);
        var league_id = result[0];
        var league_root_url = result[1];
        var league_page = result[2];
        highlight_nav(league_page);

        window.onpopstate = function(event) {
            ajaxUpdate(event.state);
        };

        // Play menu
        if (league_id > 0) {
            var play_status = $('#play_status');
            var play_phase = $('#play_phase');
            var play_button = $('#play_button');
    /*
            var jug = new Juggernaut;

            // Load cached play menu - this only runs once, which is good, but I'm not sure why.
            jug.on('connect', function(){
                $.get(league_root_url + '/push_play_menu');
            });

            // Listen for updates to play menu
            jug.subscribe(league_id + '_status', function(data){
                play_status.html(data);

                // Refresh page, as appropriate - maybe this isn't the best place for this
    //            var refresh_pages = ['standings', 'playoffs', 'schedule']
    //            var result = parse_league_url(document.URL);
    //            var league_page = result[2];
    //            if (jQuery.inArray(league_page, refresh_pages) > -1) {
    //                $.getJSON(document.URL, {'json': 1}, function (data) {
    //                    ajaxUpdate(data);
    //                });
    //            }
            });
            jug.subscribe(league_id + '_phase', function(data){
                play_phase.html(data);
            });
            jug.subscribe(league_id + '_button', function(data){
                play_button.html(data);
            });*/
        }
    });

    return {
        ajaxUpdate: ajaxUpdate,
        dropdown: dropdown
    };
});
