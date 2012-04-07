// Play menu
function comet_play_menu(url, status_t, options_t) {
    $play_status = $('#play_status')
    $play_button = $('#play_button')
    status_t = typeof status_t !== 'undefined' ? status_t : 0;
    options_t = typeof options_t !== 'undefined' ? options_t : 0;

    $.ajax({
	    type: 'GET',
	    url: url,
	    cache: false,
        data: {status_t: status_t, options_t: options_t},
	    success: function(data) {
            var json = JSON.parse(data);
            status_t = json['status_t'];
            options_t = json['options_t'];
            if (json['status'] != '') {
    		    $play_status.html(json['status']);
            }
            if (json['button'] != '') {
    		    $play_button.html(json['button']);
            }
		    setTimeout('comet_play_menu(\'' + url + '\', ' + status_t + ', ' + options_t + ')', 1000);
	    },
	    error: function(XMLHttpRequest, textstatus, error) {
		    setTimeout('comet_play_menu(\'' + url + '\')', 15000);
	    }		
    });
}
http://127.0.0.1:5000/13/
$(document).ready(function() {
    // Find URL up to http://domain.com/<int:league_id>/
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

    // Handle league internal URLs
    if (in_league) {
        league_root_url = document.URL.substr(0, end - 1)
        var links = $('a');
        for (i=0; i<links.length; i++) {  
            links[i].onclick = function() {  
                if (this.href.indexOf(league_root_url) !== -1) {
                    var url = this.href;
                    $.getJSON(url, {'json': true}, function (data) {
                        for (var block in data) {
                            if (block == 'title') {
                                $('title').text(data[block]);
                            }
                            else {
                                $('#' + block).html(data[block]);
                            }
                        }
                        history.pushState(data, '', url);
                    });
                    return false;  
                }  
            };
        }
    }

    window.onpopstate = function(event) {  
      alert("location: " + document.location + ", state: " + JSON.stringify(event.state));  
    };
});
