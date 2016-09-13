import g from '../globals';
import player from '../core/player';
import Promise from 'bluebird';
import bbgmViewReact from '../util/bbgmViewReact';
import DraftScouting from './views/DraftScouting';

async function addSeason(season, tid) {
    let playersAll = await g.dbl.players.index('tid').getAll(tid);

    playersAll = player.filter(playersAll, {
        attrs: ["pid", "firstName", "lastName", "age", "watch", "valueFuzz"],
        ratings: ["ovr", "pot", "skills", "fuzz", "pos"],
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    const players = [];
    for (let i = 0; i < playersAll.length; i++) {
        const pa = playersAll[i];

        // Abbreviate first name to prevent overflows
        pa.name = `${pa.firstName.split(" ").map(s => s[0]).join(".")}. ${pa.lastName}`;

        // Attributes
        const p = {pid: pa.pid, name: pa.name, age: pa.age, watch: pa.watch, valueFuzz: pa.valueFuzz};

        // Ratings - just take the only entry
        p.ovr = pa.ratings[0].ovr;
        p.pot = pa.ratings[0].pot;
        p.skills = pa.ratings[0].skills;
        p.pos = pa.ratings[0].pos;

        players.push(p);
    }

    // Rank prospects
    players.sort((a, b) => b.valueFuzz - a.valueFuzz);
    for (let i = 0; i < players.length; i++) {
        players[i].rank = i + 1;
    }

    return {
        players,
        season,
    };
}

async function updateDraftScouting(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        const seasonOffset = g.phase < g.PHASE.FREE_AGENCY ? 0 : 1;

        // In fantasy draft, use temp tid
        const firstUndraftedTid = g.phase === g.PHASE.FANTASY_DRAFT ? g.PLAYER.UNDRAFTED_FANTASY_TEMP : g.PLAYER.UNDRAFTED;

        const seasons = await Promise.all([
            addSeason(g.season + seasonOffset, firstUndraftedTid),
            addSeason(g.season + seasonOffset + 1, g.PLAYER.UNDRAFTED_2),
            addSeason(g.season + seasonOffset + 2, g.PLAYER.UNDRAFTED_3),
        ]);

        return {
            seasons,
        };
    }
}

export default bbgmViewReact.init({
    id: "draftScouting",
    runBefore: [updateDraftScouting],
    Component: DraftScouting,
});
