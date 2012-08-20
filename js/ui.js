define([], function () {
    "use strict";

    function highlightNav(leaguePage) {
        if (leaguePage === "") {
            leaguePage = "league_dashboard";
        }
        $("#league_sidebar li").removeClass("active");
        $("#nav_" + leaguePage).addClass("active");
    }

    function parseLeagueUrl(url) {
        var league_id, league_page, league_root_url, split_url;
        // Returns a list containing the integer league ID (0 if none), the
        // league root URL up to the league ID (empty string if none), and the
        // league page (first URL folder after the ID) (empty string if none).

        league_id = 0;
        league_root_url = "";
        league_page = "";

        split_url = url.split("/", 6);

        // If there's a URL that starts http://domain.com/l/<int:league_id>,
        // split_url will have length 4 or 5, depending on if there is a page after
        // the league ID.

        if (split_url.length >= 5) {
            league_id = parseInt(split_url[4], 10);
            league_root_url = split_url.slice(0, 5).join("/");
        }
        if (split_url.length === 6) {
            // Get rid of any trailing #
            league_page = split_url[5].split("#")[0];
        }

        return [league_id, league_root_url, league_page];
    }

    // For AJAX updating pages
    function ajaxUpdate(data) {
        var league_page, result;

        if (data.hasOwnProperty("title")) {
            $("title").text(data.title + " - Basketball GM");
        }
        if (data.hasOwnProperty("league_content")) {
            $("#league_content").html(data.league_content);
        }
        if (data.hasOwnProperty("content")) {
            $("#content").html(data.content);
        }
        if (data.hasOwnProperty("message")) {
            alert(data.message);
        }

        result = parseLeagueUrl(document.URL);
        league_page = result[2];
        highlightNav(league_page);
    }

    // Data tables
    function datatable(table, sort_col, data) {
        table.dataTable({
            aaData: data,
            aaSorting: [[ sort_col, "desc" ]],
            bDeferRender: true,
            sPaginationType: "bootstrap",
            oLanguage: {
                sLengthMenu: "_MENU_ players per page",
                sInfo: "Showing _START_ to _END_ of _TOTAL_ players",
                sInfoEmpty: "Showing 0 to 0 of 0 players",
                sInfoFiltered: "(filtered from _MAX_ total players)"
            }
        });
    }
    function datatableSinglePage(table, sort_col, data) {
        table.dataTable({
            aaData: data,
            aaSorting: [[ sort_col, "desc" ]],
            bFilter: false,
            bInfo: false,
            bPaginate: false
        });
    }

    // For dropdown menus to change team/season/whatever
    // This should be cleaned up, but it works for now.
    function dropdown(select1, select2) {
        if (arguments.length === 1) {
            select1.change(function (event) {
                var league_page, league_root_url, result, url;

                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = "/l/" + g.lid + "/" + league_page + "/" + select1.val();
                Davis.location.assign(new Davis.Request(url));
            });
        } else if (arguments.length === 2) {
            select1.change(function (event) {
                var league_page, league_root_url, result, url;

                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = "/l/" + g.lid + "/" + league_page + "/" + select1.val() + "/" + select2.val();
                Davis.location.assign(new Davis.Request(url));
            });
            select2.change(function (event) {
                var league_page, league_root_url, result, url;

                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = "/l/" + g.lid + "/" + league_page + "/" + select1.val() + "/" + select2.val();
                Davis.location.assign(new Davis.Request(url));
            });
        }
    }

    $(document).ready(function () {
        var league_id, league_page, league_root_url, result;

        result = parseLeagueUrl(document.URL);
        league_id = result[0];
        league_root_url = result[1];
        league_page = result[2];
        highlightNav(league_page);

        window.onpopstate = function (event) {
            ajaxUpdate(event.state);
        };
    });

    return {
        ajaxUpdate: ajaxUpdate,
        datatable: datatable,
        datatableSinglePage: datatableSinglePage,
        dropdown: dropdown
    };
});