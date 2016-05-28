const g = require('../globals');
const ui = require('../ui');
const finances = require('../core/finances');
const league = require('../core/league');
const player = require('../core/player');
const team = require('../core/team');
const backboard = require('backboard');
const faces = require('facesjs');
const ko = require('knockout');
const komapping = require('knockout.mapping');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');

// Same as faces.generate, but round of long decimals
function generateFace() {
    const face = faces.generate();
    face.fatness = helpers.round(face.fatness, 2);
    face.eyes[0].angle = helpers.round(face.eyes[0].angle, 1);
    face.eyes[1].angle = helpers.round(face.eyes[1].angle, 1);

    return face;
}

function get(req) {
    if (!g.godMode) {
        return {
            errorMessage: `You can't customize players unless you enable <a href="${helpers.leagueUrl(["god_mode"])}">God Mode</a>.`
        };
    }

    if (req.params.hasOwnProperty("pid")) {
        return {
            pid: parseInt(req.params.pid, 10)
        };
    }

    return {
        pid: null
    };
}

function InitViewModel() {
    this.p = {
        face: ko.observable(),
        ratings: ko.observableArray(),
        born: {
            year: ko.observable()
        },
        contract: {
            amount: ko.observable(),
            exp: ko.observable()
        },
        injury: {
            type: ko.observable(),
            gamesRemaining: ko.observable()
        }
    };
    this.positions = [];

    // Used to kepe track of the TID for an edited player
    this.originalTid = ko.observable(null);

    // Easy access to ratings array, since it could have any number of entries and we only want the last one
    this.ratings = {};
    const ratingKeys = ["pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
    ratingKeys.forEach(function (ratingKey) {
        this.ratings[ratingKey] = ko.computed({
            read() {
                // Critical: this will always call p.ratings() so it knows to update after player is loaded
                if (this.p.ratings().length > 0) {
                    return this.p.ratings()[this.p.ratings().length - 1][ratingKey]();
                }
                return 0;
            },
            write(value) {
                let rating = helpers.bound(parseInt(value, 10), 0, 100);
                if (isNaN(rating)) { rating = 0; }
                this.p.ratings()[this.p.ratings().length - 1][ratingKey](rating);
            },
            owner: this
        });
    }, this);

    // Set born.year based on age input
    this.age = ko.computed({
        read() {
            return g.season - this.p.born.year();
        },
        write(value) {
            let age = parseInt(value, 10);
            if (age !== age) { age = 25; } // NaN check
            this.p.born.year(g.season - age);
        },
        owner: this
    });

    // Set position for latest season
    this.pos = ko.computed({
        read() {
            // Critical: this will always call p.ratings() so it knows to update after player is loaded
            if (this.p.ratings().length > 0) {
                return this.p.ratings()[this.p.ratings().length - 1].pos();
            }
            return 'F';
        },
        write(value) {
            this.p.ratings()[this.p.ratings().length - 1].pos(value);
        },
        owner: this
    });

    // Contract stuff
    this.contract = {
        amount: ko.computed({
            read() {
                return this.p.contract.amount() / 1000;
            },
            write(value) {
                // Allow any value, even above or below normal limits, but round to $10k
                let amount = helpers.round(100 * parseFloat(value)) * 10;
                if (isNaN(amount)) { amount = g.minContract; }
                this.p.contract.amount(amount);
            },
            owner: this
        }),
        exp: ko.computed({
            read() {
                return this.p.contract.exp();
            },
            write(value) {
                let season = parseInt(value, 10);
                if (isNaN(season)) { season = g.season; }

                // No contracts expiring in the past
                if (season < g.season) {
                    season = g.season;
                }

                // If current season contracts already expired, then current season can't be allowed for new contract
                if (season === g.season && g.phase >= g.PHASE.RESIGN_PLAYERS) {
                    season += 1;
                }

                this.p.contract.exp(season);
            },
            owner: this
        })
    };

    // Injury stuff
    this.injury = {
        type: ko.computed({
            read() {
                return this.p.injury.type();
            },
            write(value) {
                this.p.injury.type(value);
            },
            owner: this
        }),
        gamesRemaining: ko.computed({
            read() {
                return this.p.injury.gamesRemaining();
            },
            write(value) {
                let gamesRemaining = parseInt(value, 10);
                if (isNaN(gamesRemaining)) { gamesRemaining = 0; }

                if (gamesRemaining < 0) { gamesRemaining = 0; }

                this.p.injury.gamesRemaining(gamesRemaining);
            },
            owner: this
        })
    };
}

const mapping = {
    teams: {
        create: options => options.data
    }
};

async function updateCustomizePlayer(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0) {
        const teams = await team.filter({
            attrs: ["tid", "region", "name"],
            season: g.season
        });

        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        const seasonOffset = g.phase < g.PHASE.FREE_AGENCY ? 0 : 1;

        for (let i = 0; i < teams.length; i++) {
            teams[i].text = `${teams[i].region} ${teams[i].name}`;
        }
        teams.unshift({
            tid: g.PLAYER.RETIRED,
            text: "Retired"
        });
        teams.unshift({
            tid: g.PLAYER.UNDRAFTED_3,
            text: `${g.season + seasonOffset + 2} Draft Prospect`
        });
        teams.unshift({
            tid: g.PLAYER.UNDRAFTED_2,
            text: `${g.season + seasonOffset + 1} Draft Prospect`
        });
        teams.unshift({
            tid: g.PLAYER.UNDRAFTED,
            text: `${g.season + seasonOffset} Draft Prospect`
        });
        teams.unshift({
            tid: g.PLAYER.FREE_AGENT,
            text: "Free Agent"
        });

        const positions = ["PG", "SG", "SF", "PF", "C", "G", "GF", "F", "FC"];

        const vars = {
            appearanceOptions: ["Cartoon Face", "Image URL"],
            faceOptions: {
                eyes: [0, 1, 2, 3],
                nose: [0, 1, 2],
                mouth: [0, 1, 2, 3, 4],
                hair: [0, 1, 2, 3, 4]
            },
            positions,
            teams
        };

        if (inputs.pid === null) {
            // Generate new player as basis
            const teamSeasons = await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([g.userTid, g.season - 2], [g.userTid, g.season]));
            const scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");

            const p = player.generate(g.PLAYER.FREE_AGENT,
                20,
                null,
                50,
                50,
                g.season,
                false,
                scoutingRank);

            p.face.fatness = helpers.round(p.face.fatness, 2);
            p.face.eyes[0].angle = helpers.round(p.face.eyes[0].angle, 1);
            p.face.eyes[1].angle = helpers.round(p.face.eyes[1].angle, 1);

            vars.appearanceOption = "Cartoon Face";
            p.imgURL = "http://";

            vars.p = p;
        } else {
            // Load a player to edit
            const p = await g.dbl.players.get(inputs.pid);
            if (p.imgURL.length > 0) {
                vars.appearanceOption = "Image URL";
            } else {
                vars.appearanceOption = "Cartoon Face";
                p.imgURL = "http://";
            }

            vars.originalTid = p.tid;
            vars.p = p;
        }

        return vars;
    }
}

function uiFirst(vm) {
    if (vm.originalTid() === null) {
        ui.title("Create A Player");
    } else {
        ui.title("Edit Player");
    }

    document.getElementById("randomize-face").addEventListener("click", () => {
        vm.p.face(komapping.fromJS(generateFace()));
    });

    // Since there are two eyes and the updated observable is the first one, update the second in parallel
    ko.computed(() => {
        vm.p.face().eyes()[1].id(vm.p.face().eyes()[0].id());
    }).extend({throttle: 1});
    ko.computed(() => {
        vm.p.face().eyes()[1].angle(vm.p.face().eyes()[0].angle());
    }).extend({throttle: 1});

    // Update picture display
    ko.computed(() => {
        // This ensures it's not drawn when not visible (like if defaulting to Image URL for a
        // player), and it also ensures that this computed is called when appearanceOption
        // changes. Without this "if", it hows a corrupted display for some reason if Image URL
        // is default and the face is switched to.
        if (vm.appearanceOption() === "Cartoon Face") {
            faces.display("picture", ko.toJS(vm.p.face));
        }
    }).extend({throttle: 1});

    document.getElementById("create-a-player").addEventListener("click", async () => {
        let p = komapping.toJS(vm.p);

        // Fix integers that Knockout may have mangled
        p.tid = parseInt(p.tid, 10);
        p.hgt = parseInt(p.hgt, 10);
        p.weight = parseInt(p.weight, 10);
        p.face.fatness = parseFloat(p.face.fatness);
        p.face.eyes[0].angle = parseFloat(p.face.eyes[0].angle);
        p.face.eyes[1].angle = parseFloat(p.face.eyes[1].angle);

        // Fix draft season
        if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
            if (p.tid === g.PLAYER.UNDRAFTED) {
                p.draft.year = g.season;
            } else if (p.tid === g.PLAYER.UNDRAFTED_2) {
                p.draft.year = g.season + 1;
            } else if (p.tid === g.PLAYER.UNDRAFTED_3) {
                p.draft.year = g.season + 2;
            }

            // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
            if (g.phase >= g.PHASE.FREE_AGENCY) {
                p.draft.year += 1;
            }
        }

        // Set ovr, skills, and bound pot by ovr
        const r = p.ratings.length - 1;
        p.ratings[r].ovr = player.ovr(p.ratings[r]);
        p.ratings[r].skills = player.skills(p.ratings[r]);
        if (p.ratings[r].ovr > p.ratings[r].pot) {
            p.ratings[r].pot = p.ratings[r].ovr;
        }

        // If player was retired, add ratings (but don't develop, because that would change ratings)
        if (vm.originalTid() === g.PLAYER.RETIRED) {
            if (g.season - p.ratings[r].season > 0) {
                p = player.addRatingsRow(p, 15);
            }
        }

        // Only save image URL if it's selected
        if (vm.appearanceOption() !== "Image URL") {
            p.imgURL = "";
        }

        // If we are *creating* a player who is not a draft prospect, make sure he won't show up in the draft this year
        if (p.tid !== g.PLAYER.UNDRAFTED && p.tid !== g.PLAYER.UNDRAFTED_2 && p.tid !== g.PLAYER.UNDRAFTED_3 && g.phase < g.PHASE.FREE_AGENCY) {
            // This makes sure it's only for created players, not edited players
            if (!p.hasOwnProperty("pid")) {
                p.draft.year = g.season - 1;
            }
        }
        // Similarly, if we are editing a draft prospect and moving him to a team, make his draft year in the past
        if ((p.tid !== g.PLAYER.UNDRAFTED && p.tid !== g.PLAYER.UNDRAFTED_2 && p.tid !== g.PLAYER.UNDRAFTED_3) && (vm.originalTid() === g.PLAYER.UNDRAFTED || vm.originalTid() === g.PLAYER.UNDRAFTED_2 || vm.originalTid() === g.PLAYER.UNDRAFTED_3) && g.phase < g.PHASE.FREE_AGENCY) {
            p.draft.year = g.season - 1;
        }

        // Recalculate player values, since ratings may have changed
        p = await player.updateValues(null, p, []);
        let pid;
        await g.dbl.tx(["players", "playerStats"], "readwrite", async tx => {
            // Get pid (primary key) after add, but can't redirect to player page until transaction completes or else it's a race condition
            // When adding a player, this is the only way to know the pid
            pid = await tx.players.put(p);

            // Add regular season or playoffs stat row, if necessary
            if (p.tid >= 0 && p.tid !== vm.originalTid() && g.phase <= g.PHASE.PLAYOFFS) {
                p.pid = pid;

                // If it is the playoffs, this is only necessary if p.tid actually made the playoffs, but causes only cosmetic harm otherwise.
                p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);

                // Add back to database
                await tx.players.put(p);
            }
        });

        league.updateLastDbChange();
        ui.realtimeUpdate([], helpers.leagueUrl(["player", pid]));
    });
}

module.exports = bbgmView.init({
    id: "customizePlayer",
    get,
    InitViewModel,
    mapping,
    runBefore: [updateCustomizePlayer],
    uiFirst
});
