/**
 * @name views.singleGame
 * @namespace Simulate a single game and display output in CSV format.
 */
define(["globals", "ui", "core/game", "core/gameSim", "core/player", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, game, gameSim, player, $, ko, bbgmView, helpers, viewHelpers) {
    "use strict";

    function get(req) {
        return {
            result: req.raw.result
        };
    }

    function post(req) {
        var buttonEl;

        buttonEl = document.getElementById("simulate-game");
        buttonEl.textContent = "Simulating...";
        buttonEl.disabled = true;

        game.loadTeams(g.dbl.transaction(["players", "teams"]), function (teams) {
            var gs, result;

            teams.sort(function (a, b) {  return a.id - b.id; });  // Order teams by tid
            gs = new gameSim.GameSim(666, teams[parseInt(req.params["tid-home"], 10)], teams[parseInt(req.params["tid-away"], 10)]);
            result = gs.run();

            ui.realtimeUpdate(["singleGameSim"], helpers.leagueUrl(["single_game"]), function () {
                buttonEl.textContent = "Simulate Game";
                buttonEl.disabled = false;
            }, {
                result: result
            });
        });
    }

    function InitViewModel() {
        this.csv = ko.observable("");
    }

    function updateForm(inputs, updateEvents) {
        var i, teams;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
            teams = [];
            for (i = 0; i < 24; i++) {
                teams.push({
                    tid: i,
                    name: g.teamRegionsCache[i] + " " + g.teamNamesCache[i]
                });
            }
            return {
                teams: teams
            };
        }
    }

    function updateResults(inputs, updateEvents, vm) {
        var csv, i, injuries, injury, j, p, r, t, deferred;

        if (updateEvents.indexOf("singleGameSim") >= 0) {
            deferred = $.Deferred();

            csv = "";
            injuries = [];
            r = inputs.result;

            for (i = r.team.length - 1; i >= 0; i--) {
                t = r.team[i];
                csv += g.teamRegionsCache[t.id] + "," + t.stat.ptsQtrs.join(",") + "," + t.stat.pts + "\n";
            }
            csv += "\n";

            for (i = r.team.length - 1; i >= 0; i--) {
                t = r.team[i];

                csv += g.teamRegionsCache[t.id] + "\n";
                csv += ["Name", "Pos", "Min", "FGM", "FGA", "3PtM", "3PtA", "FTM", "FTA", "Off", "Reb", "Ast", "TO", "Stl", "Blk", "PF", "Pts"].join(",") + "\n";

                for (j = 0; j < t.player.length; j++) {
                    p = t.player[j];
                    csv += [p.name, p.pos, helpers.round(p.stat.min, 1), p.stat.fg, + p.stat.fga, p.stat.tp, + p.stat.tpa, p.stat.ft, + p.stat.fta, p.stat.orb, p.stat.orb + p.stat.drb, p.stat.ast, p.stat.tov, p.stat.stl, p.stat.blk, p.stat.pf, p.stat.pts].join(",") + "\n";
                    if (p.injured) {
                        injury = player.injury(15);
                        injuries.push(p.name + " was injured (" + injury.type + ") and will miss " + injury.gamesRemaining + " games.");
                    }
                }

                csv += ["Total", "", helpers.round(t.stat.min), t.stat.fg, t.stat.fga, t.stat.tp, t.stat.tpa, t.stat.ft, t.stat.fta, t.stat.orb, t.stat.orb + t.stat.drb, t.stat.ast, t.stat.tov, t.stat.stl, t.stat.blk, t.stat.pf, t.stat.pts].join(",") + "\n";

                csv += "\n";
            }

            if (injuries.length > 0) {
                csv += injuries.join("\n") + "\n";
            }
            for (i = injuries.length; i < 4; i++) {
                csv += "\n";
            }

            $("#download-link").html('<a href="data:application/json;base64,' + base64EncArr(strToUTF8Arr(csv)) + '" download="boxscore-' + r.team[0].id + '-' + r.team[1].id + '.csv">Download CSV</a>');

            deferred.resolve({
                csv: csv
            });

            return deferred.promise();
        }
    }

    function uiFirst() {
        ui.title("Single Game Simulation");
    }







    // Below is to handle non-ASCII names in the download link, which window.btoa breaks on

    /*\
    |*|
    |*|  Base64 / binary data / UTF-8 strings utilities
    |*|
    |*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
    |*|
    \*/

    /* Array of bytes to base64 string decoding */

    function b64ToUint6 (nChr) {

      return nChr > 64 && nChr < 91 ?
          nChr - 65
        : nChr > 96 && nChr < 123 ?
          nChr - 71
        : nChr > 47 && nChr < 58 ?
          nChr + 4
        : nChr === 43 ?
          62
        : nChr === 47 ?
          63
        :
          0;

    }

    function base64DecToArr (sBase64, nBlocksSize) {

      var
        sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

      for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
          for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
            taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
          }
          nUint24 = 0;

        }
      }

      return taBytes;
    }

    /* Base64 string to array encoding */

    function uint6ToB64 (nUint6) {

      return nUint6 < 26 ?
          nUint6 + 65
        : nUint6 < 52 ?
          nUint6 + 71
        : nUint6 < 62 ?
          nUint6 - 4
        : nUint6 === 62 ?
          43
        : nUint6 === 63 ?
          47
        :
          65;

    }

    function base64EncArr (aBytes) {

      var nMod3, sB64Enc = "";

      for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
        nMod3 = nIdx % 3;
        if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
        nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
        if (nMod3 === 2 || aBytes.length - nIdx === 1) {
          sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
          nUint24 = 0;
        }
      }

      return sB64Enc.replace(/A(?=A$|$)/g, "=");

    }

    /* UTF-8 array to DOMString and vice versa */

    function UTF8ArrToStr (aBytes) {

      var sView = "";

      for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
        nPart = aBytes[nIdx];
        sView += String.fromCharCode(
          nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
            /* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
            (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
            (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
            (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
            (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
            (nPart - 192 << 6) + aBytes[++nIdx] - 128
          : /* nPart < 127 ? */ /* one byte */
            nPart
        );
      }

      return sView;

    }

    function strToUTF8Arr (sDOMStr) {

      var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

      /* mapping... */

      for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
        nChr = sDOMStr.charCodeAt(nMapIdx);
        nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
      }

      aBytes = new Uint8Array(nArrLen);

      /* transcription... */

      for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
        nChr = sDOMStr.charCodeAt(nChrIdx);
        if (nChr < 128) {
          /* one byte */
          aBytes[nIdx++] = nChr;
        } else if (nChr < 0x800) {
          /* two bytes */
          aBytes[nIdx++] = 192 + (nChr >>> 6);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x10000) {
          /* three bytes */
          aBytes[nIdx++] = 224 + (nChr >>> 12);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x200000) {
          /* four bytes */
          aBytes[nIdx++] = 240 + (nChr >>> 18);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x4000000) {
          /* five bytes */
          aBytes[nIdx++] = 248 + (nChr >>> 24);
          aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else /* if (nChr <= 0x7fffffff) */ {
          /* six bytes */
          aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
          aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        }
      }

      return aBytes;

    }



















    return bbgmView.init({
        id: "singleGame",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        runBefore: [updateForm, updateResults],
        uiFirst: uiFirst
    });
});