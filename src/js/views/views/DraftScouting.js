const backboard = require('backboard');
const Promise = require('bluebird');
const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const draft = require('../../core/draft');
const finances = require('../../core/finances');
const player = require('../../core/player');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, NewWindowLink, PlayerNameLabels} = require('../components');

class DraftScouting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customize: undefined,
        };
    }

    handleCustomize(i) {
        this.setState({
            customize: i,
        });
    }

    handleDraftClass(seasonOffset, e) {
        const file = e.target.files[0];

        // What tid to replace?
        let draftClassTid;
        if (seasonOffset === 0) {
            draftClassTid = g.PLAYER.UNDRAFTED;
        } else if (seasonOffset === 1) {
            draftClassTid = g.PLAYER.UNDRAFTED_2;
        } else if (seasonOffset === 2) {
            draftClassTid = g.PLAYER.UNDRAFTED_3;
        } else {
            throw new Error("Invalid draft class index");
        }

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = async event => {
            const uploadedFile = JSON.parse(event.target.result);

            // Get all players from uploaded files
            let players = uploadedFile.players;

            // Filter out any that are not draft prospects
            players = players.filter(p => p.tid === g.PLAYER.UNDRAFTED);

            // Get scouting rank, which is used in a couple places below
            const teamSeasons = await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([g.userTid, g.season - 2], [g.userTid, g.season]));

            const scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");

            // Delete old players from draft class
            await g.dbl.tx(["players", "playerStats"], "readwrite", async tx => {
                await tx.players.index('tid').iterate(draftClassTid, p => tx.players.delete(p.pid));

                // Find season from uploaded file, for age adjusting
                let uploadedSeason;
                if (uploadedFile.hasOwnProperty("gameAttributes")) {
                    for (let i = 0; i < uploadedFile.gameAttributes.length; i++) {
                        if (uploadedFile.gameAttributes[i].key === "season") {
                            uploadedSeason = uploadedFile.gameAttributes[i].value;
                            break;
                        }
                    }
                } else if (uploadedFile.hasOwnProperty("startingSeason")) {
                    uploadedSeason = uploadedFile.startingSeason;
                }

                let seasonOffset2 = seasonOffset;
                if (g.phase >= g.PHASE.FREE_AGENCY) {
                    // Already generated next year's draft, so bump up one
                    seasonOffset2 += 1;
                }

                const draftYear = g.season + seasonOffset2;

                // Add new players to database
                await Promise.map(players, async p => {
                    // Make sure player object is fully defined
                    p = player.augmentPartialPlayer(p, scoutingRank);

                    // Manually set TID, since at this point it is always g.PLAYER.UNDRAFTED
                    p.tid = draftClassTid;

                    // Manually remove PID, since all it can do is cause trouble
                    if (p.hasOwnProperty("pid")) {
                        delete p.pid;
                    }

                    // Adjust age
                    if (uploadedSeason !== undefined) {
                        p.born.year += g.season - uploadedSeason + seasonOffset2;
                    }

                    // Adjust seasons
                    p.ratings[0].season = draftYear;
                    p.draft.year = draftYear;

                    // Don't want lingering stats vector in player objects, and draft prospects don't have any stats
                    delete p.stats;

                    p = await player.updateValues(tx, p, []);
                    await tx.players.put(p);
                });

                // "Top off" the draft class if <70 players imported
                if (players.length < 70) {
                    await draft.genPlayers(tx, draftClassTid, scoutingRank, 70 - players.length);
                }
            });

            this.setState({
                customize: undefined,
            });

            ui.realtimeUpdate(["dbChange"]);
        };
    }

    render() {
        const {seasons = []} = this.props;

        bbgmViewReact.title('Draft Scouting');

        const cols = getCols('#', 'Name', 'Pos', 'Age', 'Ovr', 'Pot');

        return <div>
            <h1>Draft Scouting <NewWindowLink /></h1>

            <p>More: <a href={helpers.leagueUrl(['draft_summary'])}>Old Draft Summaries</a></p>

            <p>The ratings shown are your scouts' projections for what the players' ratings will be when they enter the draft. The further in the future, the more uncertainty there is in their estimates.</p>

            <div className="row">
                {seasons.map((s, i) => {
                    const rows = s.players.map(p => {
                        return {
                            key: p.pid,
                            data: [
                                p.rank,
                                <PlayerNameLabels
                                    pid={p.pid}
                                    skills={p.skills}
                                    watch={p.watch}
                                >{p.name}</PlayerNameLabels>,
                                p.pos,
                                p.age,
                                p.ovr,
                                p.pot,
                            ],
                        };
                    });

                    return <div key={s.season} className="col-md-4 col-sm-6">
                        <h2>{s.season}</h2>

                        {
                            this.state.customize === i
                        ?
                            <div>
                                <p>To replace this draft class with players from a <a href="https://basketball-gm.com/manual/customization/draft-class/" target="_blank">custom draft class file</a>, select the file below.</p>
                                <p><input type="file" className="custom-draft-class" onChange={e => this.handleDraftClass(i, e)} /></p>
                            </div>
                        :
                            <p><button className="btn btn-default btn-xs" onClick={() => this.handleCustomize(i)}>Customize</button></p>
                        }

                        <DataTable
                            cols={cols}
                            defaultSort={[0, 'asc']}
                            rows={rows}
                        />
                    </div>;
                })}
            </div>
        </div>;
    }
}

module.exports = DraftScouting;
