// For AJAX updating pages
function ajax_update(data, url) {
    $('title').text(data['title']);
    $('#league_content').html(data['league_content']);
    if (arguments.length == 2) { // Only if a url is passed
        history.pushState(data, '', url);
    }
}

// Data tables
function bbgm_data_table(table, col) {
    if(table.length > 0) {
        table.dataTable( {
            "aaSorting": [[ col, "desc" ]],
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ players per page",
                "sInfo": "Showing _START_ to _END_ of _TOTAL_ players",
                "sInfoEmpty": "Showing 0 to 0 of 0 players",
                "sInfoFiltered": "(filtered from _MAX_ total players)"
            }
        } );
    }
}

$(document).ready(function() {
    // Find URL up to http://domain.com/<int:league_id>
    var end = 0;
    var in_league = true;
    for (i=0; i<4; i++) {
        end_old = end;
        end = document.URL.indexOf('/', end)+1;
        if (end == 0) {
            if (i == 3 && end_old != document.URL.length) {
                end = document.URL.length; // http://domain.com/<int:league_id> (no trailing slash)
            }
            else {
                in_league = false;
                break;
            }
        }
    }

    // League variables
    if (in_league) {
        split_url = document.URL.split('/', 4);
        league_root_url = split_url.join('/'); // document.URL.substr(0, end - 1);
        league_id = split_url[3];
    }

    // Handle league internal URLs
    if (in_league) {
        var links = $('a');
        for (i=0; i<links.length; i++) {  
            links[i].onclick = function() {  
                if (this.href.indexOf(league_root_url) !== -1) {
                    //Highlight active page
/*            links[i].parent().parent().children().each(function() {
              $(this).removeClass('active')
            });
            this.addClass('active');
console.log(this)*/

                    // Update content
                    var url = this.href;
                    $.getJSON(url, {'json': true}, function (data) {
                        ajax_update(data, url);
                    });
                    return false;  
                }  
            };
        }
    }
    window.onpopstate = function(event) {
        ajax_update(event.state);
    };

    //Highlight active page in sidebar
    $('#league_sidebar li').click(function(event) {
        $clicked_li = $(this);
        console.log($clicked_li)
        $clicked_li.parent().children().each(function() {
            $(this).removeClass('active');
        });
        $clicked_li.addClass('active');
    });


    // Play button
    if (in_league) {
        $play_status = $('#play_status');
        $play_button = $('#play_button');

        var jug = new Juggernaut;

        // Load cached play menu - this only runs once, which is good, but I'm not sure why.
        jug.on('connect', function(){
            $.get(league_root_url + '/push_play_menu');
        });

        // Listen for updates to play menu
        jug.subscribe(league_id + '_status', function(data){
            $play_status.html(data);
        });
        jug.subscribe(league_id + '_button', function(data){
            $play_button.html(data);
        });
    }
});
