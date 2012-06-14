define(["g"], function(g) {
    return {
        /*Set the options to be shown in the play button.

        Arguments:
            keys: A list of strings identifying the options to be shown. If left
                blank, the default options are shown based on the game state.

        Returns:
            A list of dicts, each dict containing the properties needed to build the
            play button.
         */
        options: function (keys) {
            all_options = [{id: "stop", url: "/l/" + g.lid + "/play/stop", label: "Stop", normal_link: false},
                           {id: "day", url: "/l/" + g.lid + "/play/day", label: "One day", normal_link: false},
                           {id: "week", url: "/l/" + g.lid + "/play/week", label: "One week", normal_link: false},
                           {id: "month", url: "/l/" + g.lid + "/play/month", label: "One month", normal_link: false},
                           {id: "until_playoffs", url: "/l/" + g.lid + "/play/until_playoffs", label: "Until playoffs", normal_link: false},
                           {id: "through_playoffs", url: "/l/" + g.lid + "/play/through_playoffs", label: "Through playoffs", normal_link: false},
                           {id: "until_draft", url: "/l/" + g.lid + "/play/until_draft", label: "Until draft", normal_link: false},
                           {id: "view_draft", url: "/l/" + g.lid + "/draft", label: "View draft", normal_link: true},
                           {id: "until_resign_players", url: "/l/" + g.lid + "/play/until_resign_players", label: "Resign players with expiring contracts", normal_link: false},
                           {id: "until_free_agency", url: "/l/" + g.lid + "/play/until_free_agency", label: "Until free agency", normal_link: false},
                           {id: "until_preseason", url: "/l/" + g.lid + "/play/until_preseason", label: "Until preseason", normal_link: false},
                           {id: "until_regular_season", url: "/l/" + g.lid + "/play/until_regular_season", label: "Until regular season", normal_link: false},
                           {id: "contract_negotiation", url: "/l/" + g.lid + "/negotiation_list", label: "Continue contract negotiation", normal_link: true},
                           {id: "contract_negotiation_list", url: "/l/" + g.lid + "/negotiation_list", label: "Continue resigning players", normal_link: true}]
    /*
            if (keys === undefined) {
                // Preseason
                if (g.phase == c.PHASE_PRESEASON) {
                    keys = ["until_regular_season"];
                }
                // Regular season - pre trading deadline
                else if (g.phase == c.PHASE_REGULAR_SEASON) {
                    keys = ["day", "week", "month", "until_playoffs"];
                // Regular season - post trading deadline
                }
                else if (g.phase == c.PHASE_AFTER_TRADE_DEADLINE) {
                    keys = ["day", "week", "month", "until_playoffs"];
                }
                // Playoffs
                else if (g.phase == c.PHASE_PLAYOFFS) {
                    keys = ["day", "week", "month", "through_playoffs"];
                }
                // Offseason - pre draft
                else if (g.phase == c.PHASE_BEFORE_DRAFT) {
                    keys = ["until_draft"];
                }
                // Draft
                else if (g.phase == c.PHASE_DRAFT) {
                    keys = ["view_draft"];
                }
                // Offseason - post draft
                else if (g.phase == c.PHASE_AFTER_DRAFT) {
                    keys = ["until_resign_players"];
                }
                // Offseason - resign players
                else if (g.phase == c.PHASE_RESIGN_PLAYERS) {
                    keys = ["contract_negotiation_list", "until_free_agency"];
                }
                // Offseason - free agency
                else if (g.phase == c.PHASE_FREE_AGENCY) {
                    keys = ["until_preseason"];
                }

                if (lock.games_in_progress()) {
                    keys = ["stop"];
                }
                if (lock.negotiation_in_progress() and g.phase != c.PHASE_RESIGN_PLAYERS) {
                    keys = ["contract_negotiation"];
                }
            }

            // This code is very ugly. Basically I just want to filter all_options into
            // some_options based on if the ID matches one of the keys.
            ids = [o[id] for o in all_options]
            some_options = []
            for key in keys:
                i = 0
                for id_ in ids:
                    if id_ == key:
                        some_options.append(all_options[i])
                        break
                    i += 1
    */
            some_options = all_options;
            return some_options;
        },

        /*Save status to database and push to client.

        If no status is given, load the last status from the database and push that
        to the client.

        Args:
            status: A string containing the current status message to be pushed to
                the client.
        */
        setStatus: function (status) {
    //        r = g.dbex("SELECT pm_status FROM game_attributes WHERE season = :season", season=g.season)
    //        old_status, = r.fetchone()
    old_status = 'fuck';

            if (status === undefined) {
                status = old_status;
                document.getElementById("playStatus").innerHTML = status;
            }
            if (status != old_status) {
    //            g.dbex("UPDATE game_attributes SET pm_status = :pm_status WHERE season = :season", pm_status=status, season=g.season)
                document.getElementById("playStatus").innerHTML = status;
                console.log("Set status: " + status);
            }
        },

        /*Save phase text to database and push to client.

        If no phase text is given, load the last phase text from the database and
        push that to the client.

        Args:
            phase_text: A string containing the current phase text to be pushed to
                the client.
        */
        setPhase: function (phase_text) {
    //        r = g.dbex("SELECT pm_phase FROM game_attributes WHERE season = :season", season=g.season)
    //        old_phase_text, = r.fetchone()
    old_phase_text = 'phuck';

            if (phase_text === undefined) {
                phase_text = old_phase_text;
                document.getElementById("playPhase").innerHTML = phase_text;
            }
            if (phase_text != old_phase_text) {
    //            g.dbex("UPDATE game_attributes SET pm_phase = :pm_phase WHERE season = :season", pm_phase=phase_text, season=g.season)
                document.getElementById("playPhase").innerHTML = phase_text;
                console.log("Set phase: " + phase_text);
            }
        },

        /*Get current options based on game state and push rendered play button
        to client.
        */
        refreshOptions: function () {
    //        button = render_template("play_button.html", lid=g.lid, options=options());
            template = Handlebars.templates['playButton'];
            button = template({options: playMenu.options()});
            document.getElementById("playButton").innerHTML = button;
        }
    };
});
