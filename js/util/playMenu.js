define(["util/helpers", "util/lock"], function (helpers, lock) {
    /*Set the options to be shown in the play button.

    Arguments:
        keys: A list of strings identifying the options to be shown. If left
            blank, the default options are shown based on the game state.

    Returns:
        A list of dicts, each dict containing the properties needed to build the
        play button.
     */
    "use strict";

    function options(keys) {
        var allOptions, i, ids, j, someOptions;

        allOptions = [{id: "stop", url: 'javascript:api.play("stop");', label: "Stop", normal_link: false},
                       {id: "day", url: 'javascript:api.play("day");', label: "One day", normal_link: false},
                       {id: "week", url: 'javascript:api.play("week");', label: "One week", normal_link: false},
                       {id: "month", url: 'javascript:api.play("month");', label: "One month", normal_link: false},
                       {id: "until_playoffs", url: 'javascript:api.play("until_playoffs");', label: "Until playoffs", normal_link: false},
                       {id: "through_playoffs", url: 'javascript:api.play("through_playoffs");', label: "Through playoffs", normal_link: false},
                       {id: "until_draft", url: 'javascript:api.play("until_draft");', label: "Until draft", normal_link: false},
                       {id: "view_draft", url: "/l/" + g.lid + "/draft", label: "View draft", normal_link: true},
                       {id: "until_resign_players", url: 'javascript:api.play("until_resign_players");', label: "Resign players with expiring contracts", normal_link: false},
                       {id: "until_free_agency", url: 'javascript:api.play("until_free_agency");', label: "Until free agency", normal_link: false},
                       {id: "until_preseason", url: 'javascript:api.play("until_preseason");', label: "Until preseason", normal_link: false},
                       {id: "until_regular_season", url: 'javascript:api.play("until_regular_season");', label: "Until regular season", normal_link: false},
                       {id: "contract_negotiation", url: "/l/" + g.lid + "/negotiation", label: "Continue contract negotiation", normal_link: true},
                       {id: "contract_negotiation_list", url: "/l/" + g.lid + "/negotiation", label: "Continue resigning players", normal_link: true}];

        if (typeof keys === "undefined") {
            if (g.phase === c.PHASE_PRESEASON) {
                // Preseason
                keys = ["until_regular_season"];
            } else if (g.phase === c.PHASE_REGULAR_SEASON) {
                // Regular season - pre trading deadline
                keys = ["day", "week", "month", "until_playoffs"];
            } else if (g.phase === c.PHASE_AFTER_TRADE_DEADLINE) {
                // Regular season - post trading deadline
                keys = ["day", "week", "month", "until_playoffs"];
            } else if (g.phase === c.PHASE_PLAYOFFS) {
                // Playoffs
                keys = ["day", "week", "month", "through_playoffs"];
            } else if (g.phase === c.PHASE_BEFORE_DRAFT) {
                // Offseason - pre draft
                keys = ["until_draft"];
            } else if (g.phase === c.PHASE_DRAFT) {
                // Draft
                keys = ["view_draft"];
            } else if (g.phase === c.PHASE_AFTER_DRAFT) {
                // Offseason - post draft
                keys = ["until_resign_players"];
            } else if (g.phase === c.PHASE_RESIGN_PLAYERS) {
                // Offseason - resign players
                keys = ["contract_negotiation_list", "until_free_agency"];
            } else if (g.phase === c.PHASE_FREE_AGENCY) {
                // Offseason - free agency
                keys = ["until_preseason"];
            }

            if (lock.games_in_progress()) {
                keys = ["stop"];
            }
            if (lock.negotiationInProgress() && g.phase !== c.PHASE_RESIGN_PLAYERS) {
                keys = ["contract_negotiation"];
            }
        }

        // This code is very ugly. Basically I just want to filter all_options into
        // some_options based on if the ID matches one of the keys.
        ids = [];
        for (i = 0; i < allOptions.length; i++) {
            ids.push(allOptions[i].id);
        }
        someOptions = [];
        for (i = 0; i < keys.length; i++) {
            for (j = 0; j < ids.length; j++) {
                if (ids[j] === keys[i]) {
                    someOptions.push(allOptions[j]);
                    break;
                }
            }
        }

//        some_options = all_options;
        return someOptions;
    }

    /*Save status to database and push to client.

    If no status is given, load the last status from the database and push that
    to the client.

    Args:
        status: A string containing the current status message to be pushed to
            the client.
    */
    function setStatus(status) {
        var oldStatus;

        oldStatus = g.pmStatus;
        if (typeof status === "undefined") {
            status = oldStatus;
            document.getElementById("playStatus").innerHTML = status;
        }
        if (status !== oldStatus) {
            helpers.setGameAttributes({pmStatus: status});
            document.getElementById("playStatus").innerHTML = status;
            console.log("Set status: " + status);
        }
    }

    /*Save phase text to database and push to client.

    If no phase text is given, load the last phase text from the database and
    push that to the client.

    Args:
        phaseText: A string containing the current phase text to be pushed to
            the client.
    */
    function setPhase(phaseText) {
        var oldPhaseText;

        oldPhaseText = g.pmPhase;
        if (typeof phaseText === "undefined") {
            phaseText = oldPhaseText;
            document.getElementById("playPhase").innerHTML = phaseText;
        }
        if (phaseText !== oldPhaseText) {
            helpers.setGameAttributes({pmPhase: phaseText});
            document.getElementById("playPhase").innerHTML = phaseText;
            console.log("Set phase: " + phaseText);
        }
    }


    /*Get current options based on game state and push rendered play button
    to client.
    */
    function refreshOptions() {
        var button, template;

        template = Handlebars.templates.playButton;
        button = template({options: options()});
        document.getElementById("playButton").innerHTML = button;
    }

    return {
        options: options,
        setStatus: setStatus,
        setPhase: setPhase,
        refreshOptions: refreshOptions
    };
});
