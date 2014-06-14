/**
 * @name views.exportRosters
 * @namespace Export rosters.
 */
define(["globals", "ui", "core/league", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, league, $, ko, bbgmView, helpers, viewHelpers) {
    "use strict";

    // Google Drive stuff based on https://developers.google.com/drive/web/quickstart/quickstart-js
    var CLIENT_ID = '366669155555-p808mqgci64di9ir366q5lpo82n6umj8.apps.googleusercontent.com';
    var SCOPES = 'https://www.googleapis.com/auth/drive';

    function checkAndHandleAuth(vm, blob, fileName) {
      var checkAuth, handleAuthResult;

      // Google Drive stuff based on https://developers.google.com/drive/web/quickstart/quickstart-js
      checkAuth = function() {
        gapi.auth.authorize(
            {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
            handleAuthResult);
      };
      handleAuthResult = function(authResult) {
        if (authResult && !authResult.error) {
          // Access token has been successfully retrieved, requests can be sent to the API.
          vm.authorized(true);
          document.getElementById("save").onclick = function() {
            vm.gdSaving(true);
            vm.gdSaved(false);
            insertBlob(vm, blob, fileName);
          };
        } else {
          // No access token could be retrieved, show the button to start the authorization flow.
          vm.authorized(false);
          document.getElementById("authorize").onclick = function() {
              gapi.auth.authorize(
                  {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
                  handleAuthResult);
          };
        }
      };

      checkAuth();
    }

    function insertBlob(vm, blob, fileName) {
      var boundary = '-------314159265358979323846';
      var delimiter = "\r\n--" + boundary + "\r\n";
      var close_delim = "\r\n--" + boundary + "--";

      var reader = new FileReader();
      reader.readAsBinaryString(blob);
      reader.onload = function(e) {
        var contentType = blob.type || 'application/octet-stream';
        var metadata = {
          'title': fileName,
          'mimeType': contentType
        };

        var base64Data = btoa(reader.result);
        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
              'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});

        request.execute(function (file) {
          // After it's all done
          vm.gdSaving(false);
          vm.gdSaved(true);
        });
      }
    }

    function InitViewModel() {
        this.generating = ko.observable(false);
        this.generated = ko.observable(false);
        this.expired = ko.observable(false);

        this.fileName = ko.observable("");
        this.url = ko.observable("");

        this.gdSaving = ko.observable(false);
        this.gdSaved = ko.observable(false);

        this.authorized = ko.observable(false);
    }

    function get(req) {
        if (req.raw.hasOwnProperty("objectStores")) {
            return {
                objectStores: req.raw.objectStores
            };
        }
    }

    function post(req) {
        ui.realtimeUpdate([], helpers.leagueUrl(["export_league"]), undefined, {
            objectStores: req.params.objectStores.join(",").split(",")
        });
    }

    function updateExportLeague(inputs, updateEvents, vm) {
        var categories;

        if (updateEvents.indexOf("firstRun") >= 0) {
            categories = [
                {
                    objectStores: "players,releasedPlayers,awards",
                    name: "Players",
                    desc: "All player info, stats, ratings, and awards.",
                    checked: true
                },
                {
                    objectStores: "teams",
                    name: "Teams",
                    desc: "All team info and stats.",
                    checked: true
                },
                {
                    objectStores: "schedule,playoffSeries",
                    name: "Schedule",
                    desc: "Current regular season schedule and playoff series.",
                    checked: true
                },
                {
                    objectStores: "draftPicks",
                    name: "Draft Picks",
                    desc: "Traded draft picks.",
                    checked: true
                },
                {
                    objectStores: "trade,negotiations,gameAttributes,draftOrder,messages,events",
                    name: "Game State",
                    desc: "Interactions with the owner, current contract negotiations, current game phase, etc. Useful for saving or backing up a game, but not for creating custom rosters.",
                    checked: true
                },
                {
                    objectStores: "games",
                    name: "Box Scores",
                    desc: '<span class="text-danger">If you\'ve played more than a few seasons, this takes up a ton of space!</span>',
                    checked: false
                }
            ];
            return {categories: categories};
        }

        if (inputs.hasOwnProperty("objectStores")) {
            vm.generated(false);
            vm.generating(true);
            vm.expired(false);
            vm.gdSaving(false);
            vm.gdSaved(false);

            league.export_(inputs.objectStores, function (data) {
                var blob, fileName, json, url;

                json = JSON.stringify(data, undefined, 2);
                blob = new Blob([json], {type: "application/json"});
                url = window.URL.createObjectURL(blob);

                // First set the download link
                fileName = data.meta !== undefined ? data.meta.name : "League";
                vm.fileName("BBGM - " + fileName + ".json");
                vm.url(url);

                // Then do the Google Drive stuff
                checkAndHandleAuth(vm, blob, fileName);

                vm.generating(false);
                vm.generated(true);
                vm.expired(false);

                // Delete object, eventually
                window.setTimeout(function () {
                    window.URL.revokeObjectURL(url);
                    json = null;
                    blob = null;
                    vm.url("");

                    vm.generated(false);
                    vm.expired(true);
                }, 60 * 1000);
            });
        }
    }

    function uiFirst(vm) {
        ui.title("Export League");

        checkAndHandleAuth(vm);
    }

    return bbgmView.init({
        id: "exportLeague",
        InitViewModel: InitViewModel,
        get: get,
        post: post,
        runBefore: [updateExportLeague],
        uiFirst: uiFirst
    });
});