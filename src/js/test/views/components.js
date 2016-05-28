const assert = require('assert');
const g = require('../../globals');
const $ = require('jquery');
const ko = require('knockout');
const components = require('../../views/components');

function testSeasons() {
    assert(document.getElementById("test-form-dropdown-seasons"));
    assert.equal(document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").length, 6);
    //assert.equaldocument.getElementById("test-form-dropdown-seasons").querySelectorAll("option")[5].attributes.selected.value, "selected");
}

function testTeams() {
    assert(document.getElementById("test-form-dropdown-teams"));
    assert.equal(document.getElementById("test-form-dropdown-teams").querySelectorAll("option").length, 30);
    //assert.equal(document.getElementById("test-form-dropdown-teams").querySelectorAll("option")[4].attributes.selected.value, "selected");
}

describe("views/components", () => {
    before(() => {
        $("body").append('<div id="testsWrapper" style="visibility: hidden;"><div data-bind="dropdown: \'test-form\'"></div></div>');
        ko.applyBindings({}, document.getElementById("testsWrapper")); // This is for the dropdown binding

        g.startingSeason = 2013;
        g.season = g.startingSeason + 5;
        g.numTeams = 30;
        g.teamAbbrevsCache = ["ATL", "BAL", "BOS", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "HOU", "LV", "LA", "MXC", "MIA", "MIN", "MON", "NYC", "PHI", "PHO", "PIT", "POR", "SAC", "SD", "SF", "SEA", "STL", "TPA", "TOR", "VAN", "WAS"];
        g.teamRegionsCache = ["Atlanta", "Baltimore", "Boston", "Chicago", "Cincinnati", "Cleveland", "Dallas", "Denver", "Detroit", "Houston", "Las Vegas", "Los Angeles", "Mexico City", "Miami", "Minneapolis", "Montreal", "New York", "Philadelphia", "Phoenix", "Pittsburgh", "Portland", "Sacramento", "San Diego", "San Francisco", "Seattle", "St. Louis", "Tampa", "Toronto", "Vancouver", "Washington"];
        g.teamNamesCache = ["Gold Club", "Crabs", "Massacre", "Whirlwinds", "Riots", "Curses", "Snipers", "High", "Muscle", "Apollos", "Blue Chips", "Earthquakes", "Aztecs", "Cyclones", "Blizzards", "Mounties", "Bankers", "Cheesesteaks", "Vultures", "Rivers", "Roses", "Gold Rush", "Pandas", "Venture Capitalists", "Symphony", "Spirits", "Turtles", "Beavers", "Whalers", "Monuments"];
    });
    after(() => {
        $("#testsWrapper").remove();
    });
    afterEach(() => {
        document.getElementById("test-form-dropdown").dataset.extraParam = "";
        document.getElementById("test-form-dropdown").dataset.idLoaded = "";
        ko.cleanNode(document.getElementById("test-form-dropdown"));
    });

    describe("#dropdown()", () => {
        it("should generate seasons dropdown alone", () => {
            components.dropdown("test-form-dropdown", ["seasons"], [g.season], [], "");
            testSeasons();
            assert(!document.getElementById("test-form-dropdown-teams"));
        });
        it("should generate teams dropdown alone", () => {
            components.dropdown("test-form-dropdown", ["teams"], ["CHI"], [], "");
            testTeams();
            assert(!document.getElementById("test-form-dropdown-seasons"));
        });
        it("should generate seasons and teams dropdowns together", () => {
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "");
            testSeasons();
            testTeams();
        });
        /*it("should not reload menu when called twice, even with different selected values", () => {
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "");
            document.getElementById("test-form-dropdown-seasons").querySelectorAll("option")[5].attributes.selected.value = "fuck";
            document.getElementById("test-form-dropdown-teams").querySelectorAll("option")[4].attributes.selected.value = "shit";
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season - 2, "ATL"], [], "");
            assert.equal(document.getElementById("test-form-dropdown-seasons").querySelectorAll("option")[5].attributes.selected.value, "fuck");
            assert.equal(document.getElementById("test-form-dropdown-teams").querySelectorAll("option")[4].attributes.selected.value, "shit");
        });*/
        it("should add new season on change to preseason phase", () => {
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "");
            assert.equal(document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").length, 6);

            // Preseason phase adds another season
            g.phase = g.PHASE.PRESEASON;
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], ["newPhase"], "");
            assert.equal(document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").length, 7);

            // Draft phase does nothing
            g.phase = g.PHASE.DRAFT;
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], ["newPhase"], "");
            assert.equal(document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").length, 7);

            // Preseason phase adds another season
            g.phase = g.PHASE.PRESEASON;
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], ["newPhase"], "");
            assert.equal(document.getElementById("test-form-dropdown-seasons").querySelectorAll("option").length, 8);
        });
        it("should store extraParam in DOM", () => {
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "cunt");
            assert.equal(document.getElementById("test-form-dropdown").dataset.extraParam, "cunt");
            components.dropdown("test-form-dropdown", ["seasons", "teams"], [g.season, "CHI"], [], "bitch");
            assert.equal(document.getElementById("test-form-dropdown").dataset.extraParam, "bitch");
        });
    });
});
