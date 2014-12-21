/**
 * @name test.views.components
 * @namespace Tests for views.components.
 */
define(["globals", "lib/jquery", "lib/knockout", "views/components"], function (g, $, ko, components) {
    "use strict";

    function testSeasons() {
        should.exist(document.getElementById("test-form-dropdown-seasons"));
        document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").should.have.length(6);
//        document.getElementById("test-form-dropdown-seasons").querySelectorAll("option")[5].attributes.selected.value.should.equal("selected");
    }

    function testTeams() {
        should.exist(document.getElementById("test-form-dropdown-teams"));
        document.getElementById("test-form-dropdown-teams").querySelectorAll("option").should.have.length(30);
//        document.getElementById("test-form-dropdown-teams").querySelectorAll("option")[4].attributes.selected.value.should.equal("selected");
    }

    describe("views/components", function () {
        before(function () {
            $("body").append('<div id="testsWrapper" style="visibility: hidden;"><div data-bind="dropdown: \'test-form\'"></div></div>');
            ko.applyBindings({}, document.getElementById("testsWrapper")); // This is for the dropdown binding

            g.startingSeason = 2013;
            g.season = g.startingSeason + 5;
            g.numTeams = 30;
            g.teamAbbrevsCache = ["ATL", "BAL", "BOS", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "HOU", "LV", "LA", "MXC", "MIA", "MIN", "MON", "NYC", "PHI", "PHO", "PIT", "POR", "SAC", "SD", "SF", "SEA", "STL", "TPA", "TOR", "VAN", "WAS"];
            g.teamRegionsCache = ["Atlanta", "Baltimore", "Boston", "Chicago", "Cincinnati", "Cleveland", "Dallas", "Denver", "Detroit", "Houston", "Las Vegas", "Los Angeles", "Mexico City", "Miami", "Minneapolis", "Montreal", "New York", "Philadelphia", "Phoenix", "Pittsburgh", "Portland", "Sacramento", "San Diego", "San Francisco", "Seattle", "St. Louis", "Tampa", "Toronto", "Vancouver", "Washington"];
            g.teamNamesCache = ["Gold Club", "Crabs", "Massacre", "Whirlwinds", "Riots", "Curses", "Snipers", "High", "Muscle", "Apollos", "Blue Chips", "Earthquakes", "Aztecs", "Cyclones", "Blizzards", "Mounties", "Bankers", "Cheesesteaks", "Vultures", "Rivers", "Roses", "Gold Rush", "Pandas", "Venture Capitalists", "Symphony", "Spirits", "Turtles", "Beavers", "Whalers", "Monuments"];
        });
        after(function () {
            $("#testsWrapper").remove();
        });
        afterEach(function () {
            document.getElementById("test-form-dropdown").dataset.extraParam = "";
            document.getElementById("test-form-dropdown").dataset.idLoaded = "";
            ko.cleanNode(document.getElementById("test-form-dropdown"));
        });

        describe("#dropdown()", function () {
            it("should generate seasons dropdown alone", function () {
                components.dropdown("test-form-dropdown", ["seasons"], [g.season], [], "");
                testSeasons();
                should.not.exist(document.getElementById("test-form-dropdown-teams"));
            });
            it("should generate teams dropdown alone", function () {
                components.dropdown("test-form-dropdown", ["teams"], ["CHI"], [], "");
                testTeams();
                should.not.exist(document.getElementById("test-form-dropdown-seasons"));
            });
            it("should generate seasons and teams dropdowns together", function () {
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "");
                testSeasons();
                testTeams();
            });
            /*it("should not reload menu when called twice, even with different selected values", function () {
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "");
                document.getElementById("test-form-dropdown-seasons").querySelectorAll("option")[5].attributes.selected.value = "fuck";
                document.getElementById("test-form-dropdown-teams").querySelectorAll("option")[4].attributes.selected.value = "shit";
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season - 2, "ATL"], [], "");
                document.getElementById("test-form-dropdown-seasons").querySelectorAll("option")[5].attributes.selected.value.should.equal("fuck");
                document.getElementById("test-form-dropdown-teams").querySelectorAll("option")[4].attributes.selected.value.should.equal("shit");
            });*/
            it("should add new season on change to preseason phase", function () {
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "");
                document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").should.have.length(6);

                // Preseason phase adds another season
                g.phase = g.PHASE.PRESEASON;
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], ["newPhase"], "");
                document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").should.have.length(7);

                // Draft phase does nothing
                g.phase = g.PHASE.DRAFT;
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], ["newPhase"], "");
                document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").should.have.length(7);

                // Preseason phase adds another season
                g.phase = g.PHASE.PRESEASON;
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], ["newPhase"], "");
                document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").should.have.length(8);
            });
            it("should store extraParam in DOM", function () {
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "cunt");
                document.getElementById("test-form-dropdown").dataset.extraParam.should.equal("cunt");
                components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "bitch");
                document.getElementById("test-form-dropdown").dataset.extraParam.should.equal("bitch");
            });
        });
    });
});