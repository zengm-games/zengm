/**
 * @name test.views.components
 * @namespace Tests for views.components.
 */
define(["globals", "lib/jquery", "views/components"], function (g, $, components) {
    "use strict";

    function testSeasons() {
        should.exist(document.getElementById("test-form-seasons"));
        document.getElementById("test-form-seasons").querySelectorAll("option").should.have.length(6);
        document.getElementById("test-form-seasons").querySelectorAll("option")[5].attributes.selected.value.should.equal("selected");
    }

    function testTeams() {
        should.exist(document.getElementById("test-form-teams"));
        document.getElementById("test-form-teams").querySelectorAll("option").should.have.length(30);
        document.getElementById("test-form-teams").querySelectorAll("option")[4].attributes.selected.value.should.equal("selected");
    }

    describe("views/components", function () {
        before(function () {
            $("body").append('<div id="testsWrapper" style="visibility: hidden;"><form id="test-form"></form></div>');

            g.startingSeason = 2013;
            g.season = g.startingSeason + 5;
        });
        after(function () {
            $("#testsWrapper").remove();
        });
        afterEach(function () {
            document.getElementById("test-form").dataset.extraParam = "";
            document.getElementById("test-form").innerHTML = "";
        });

        describe("#dropdown()", function () {
            it("should generate seasons dropdown alone", function () {
                components.dropdown("test-form", ["seasons"], [g.season], "", "");
                testSeasons();
                should.not.exist(document.getElementById("test-form-teams"));
            });
            it("should generate teams dropdown alone", function () {
                components.dropdown("test-form", ["teams"], ["CHI"], "", "");
                testTeams();
                should.not.exist(document.getElementById("test-form-seasons"));
            });
            it("should generate seasons and teams dropdowns together", function () {
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "", "");
                testSeasons();
                testTeams();
            });
            it("should not reload menu when called twice, even with different selected values", function () {
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "", "");
                document.getElementById("test-form-seasons").querySelectorAll("option")[5].attributes.selected.value = "fuck";
                document.getElementById("test-form-teams").querySelectorAll("option")[4].attributes.selected.value = "shit";
                components.dropdown("test-form", ["seasons", "teams"], [g.season - 2, "ATL"], "", "");
                document.getElementById("test-form-seasons").querySelectorAll("option")[5].attributes.selected.value.should.equal("fuck");
                document.getElementById("test-form-teams").querySelectorAll("option")[4].attributes.selected.value.should.equal("shit");
            });
            it("should add new season on change to preseason phase", function () {
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "", "");
                document.getElementById("test-form-seasons").querySelectorAll("option").should.have.length(6);

                // Preseason phase adds another season
                g.phase = g.PHASE.PRESEASON;
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "newPhase", "");
                document.getElementById("test-form-seasons").querySelectorAll("option").should.have.length(7);

                // Draft phase does nothing
                g.phase = g.PHASE.DRAFT;
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "newPhase", "");
                document.getElementById("test-form-seasons").querySelectorAll("option").should.have.length(7);

                // Preseason phase adds another season
                g.phase = g.PHASE.PRESEASON;
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "newPhase", "");
                document.getElementById("test-form-seasons").querySelectorAll("option").should.have.length(8);
            });
            it("should store extraParam in DOM", function () {
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "", "cunt");
                document.getElementById("test-form").dataset.extraParam.should.equal("cunt");
                components.dropdown("test-form", ["seasons", "teams"], [g.season, "CHI"], "", "bitch");
                document.getElementById("test-form").dataset.extraParam.should.equal("bitch");
            });
        });
    });
});