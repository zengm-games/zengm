const Promise = require('bluebird');
const classNames = require('classnames');
const $ = require('jquery');
const React = require('react');
const DropdownButton = require('react-bootstrap/lib/DropdownButton');
const MenuItem = require('react-bootstrap/lib/MenuItem');
const g = require('../../globals');
const ui = require('../../ui');
const league = require('../../core/league');
const player = require('../../core/player');
const team = require('../../core/team');
const {tradeFor} = require('../../util/actions');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {Dropdown, HelpPopover, NewWindowLink, PlayerNameLabels, RatingWithChange, RecordAndPlayoffs} = require('../components');
const clickable = require('../wrappers/clickable');

const ptStyles = {
    '0': {
        backgroundColor: '#a00',
        color: '#fff',
    },
    '0.75': {
        backgroundColor: '#ff0',
        color: '#000',
    },
    '1': {
        backgroundColor: '#ccc',
        color: '#000',
    },
    '1.25': {
        backgroundColor: '#0f0',
        color: '#000',
    },
    '1.75': {
        backgroundColor: '#070',
        color: '#fff',
    },
};

const handleAutoSort = async () => {
    // Explicitly make sure writing is done before rosterAutoSort
    await g.dbl.tx("players", "readwrite", tx => team.rosterAutoSort(tx, g.userTid));

    ui.realtimeUpdate(["playerMovement"]);
    league.updateLastDbChange();
};

const doRelease = (pid, justDrafted) => {
    return g.dbl.tx(["players", "releasedPlayers", "teamSeasons"], "readwrite", async tx => {
        const numPlayersOnRoster = await tx.players.index('tid').count(g.userTid);
        if (numPlayersOnRoster <= 5) {
            return "You must keep at least 5 players on your roster.";
        }

        const p = await tx.players.get(pid);

        // Don't let the user update CPU-controlled rosters
        if (p.tid !== g.userTid) {
            return "You aren't allowed to do this.";
        }

        await player.release(tx, p, justDrafted);
        league.updateLastDbChange();
    });
};

const handleRelease = async p => {
    // If a player was just drafted by his current team and the regular season hasn't started, then he can be released without paying anything
    const justDrafted = p.tid === p.draft.tid && ((p.draft.year === g.season && g.phase >= g.PHASE.DRAFT) || (p.draft.year === g.season - 1 && g.phase < g.PHASE.REGULAR_SEASON));

    let releaseMessage;
    if (justDrafted) {
        releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team. Because you just drafted him and the regular season has not started yet, you will not have to pay his contract.`;
    } else {
        releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ${p.contract.exp}.`;
    }

    if (window.confirm(releaseMessage)) {
        const errorMsg = await doRelease(p.pid, justDrafted);
        if (errorMsg) {
            helpers.errorNotify(errorMsg);
        } else {
            ui.realtimeUpdate(["playerMovement"]);
        }
    }
};

const handlePtChange = async (p, event) => {
    const ptModifier = parseFloat(event.target.value);

    if (isNaN(ptModifier)) {
        return;
    }

    // NEVER UPDATE AI TEAMS
    // This shouldn't be necessary, but just in case...
    if (p.tid !== g.userTid) {
        return;
    }

    // Update ptModifier in database
    const p2 = await g.dbl.players.get(p.pid);
    if (p2.ptModifier !== ptModifier) {
        p2.ptModifier = ptModifier;
        await g.dbl.players.put(p2);

        ui.realtimeUpdate(["playerMovement"]);
        league.updateLastDbChange();
    }
};

const PlayingTime = ({p}) => {
    const ptModifiers = [
        {text: "0", ptModifier: "0"},
        {text: "-", ptModifier: "0.75"},
        {text: " ", ptModifier: "1"},
        {text: "+", ptModifier: "1.25"},
        {text: "++", ptModifier: "1.75"},
    ];

    return <select
        className="form-control pt-modifier-select"
        value={p.ptModifier}
        onChange={event => handlePtChange(p, event)}
        style={ptStyles[String(p.ptModifier)]}
    >
        {ptModifiers.map(({text, ptModifier}) => {
            return <option key={ptModifier} value={ptModifier}>{text}</option>;
        })}
    </select>;
};

const ReorderHandle = ({i, onClick, pid, selectedPid}) => {
    let backgroundColor = 'rgb(91, 192, 222)';
    if (selectedPid === pid) {
        backgroundColor = '#d9534f';
    } else if (selectedPid) {
        if (i <= 4) {
            backgroundColor = 'rgba(66, 139, 202, 0.6)';
        } else {
            backgroundColor = 'rgba(91, 192, 222, 0.6)';
        }
    } else if (i <= 4) {
        backgroundColor = 'rgb(66, 139, 202)';
    }

    return <td className="roster-handle" style={{backgroundColor}} onClick={onClick} />;
};

// This needs to look at all players, because rosterOrder is not guaranteed to be unique after free agent signings and trades
const swapRosterOrder = async (sortedPlayers, pid1, pid2) => {
    await g.dbl.tx("players", "readwrite", async tx => {
        const rosterOrder1 = sortedPlayers.findIndex(p => p.pid === pid1);
        const rosterOrder2 = sortedPlayers.findIndex(p => p.pid === pid2);
        const promises = sortedPlayers.map(async (sortedPlayer, i) => {
            const pid = sortedPlayers[i].pid;
            const p = await tx.players.get(pid);
            let rosterOrder = i;
            if (pid === pid1) {
                rosterOrder = rosterOrder2;
            } else if (pid === pid2) {
                rosterOrder = rosterOrder1;
            }

            if (p.rosterOrder !== rosterOrder) {
                p.rosterOrder = rosterOrder;
                await tx.players.put(p);
            }
        });

        await Promise.all(promises);

        ui.realtimeUpdate(["playerMovement"]);
        league.updateLastDbChange();
    });
};

const handleReorderDrag = async sortedPids => {
    await g.dbl.tx("players", "readwrite", async tx => {
        const promises = sortedPids.map(async (pid, rosterOrder) => {
            const p = await tx.players.get(pid);
            if (p.rosterOrder !== rosterOrder) {
                p.rosterOrder = rosterOrder;
                await tx.players.put(p);
            }
        });

        await Promise.all(promises);

        ui.realtimeUpdate(["playerMovement"]);
        league.updateLastDbChange();
    });
};

const RosterRow = clickable(props => {
    const {clicked, editable, handleReorderClick, i, p, season, selectedPid, showTradeFor, toggleClicked} = props;
    return <tr key={p.pid} className={classNames({separator: i === 4, warning: clicked})} data-pid={p.pid}>
        {editable ? <ReorderHandle i={i} pid={p.pid} onClick={handleReorderClick} selectedPid={selectedPid} /> : null}
        <td onClick={toggleClicked}>
            <PlayerNameLabels
                pid={p.pid}
                injury={p.injury}
                skills={p.ratings.skills}
                watch={p.watch}
            >{p.name}</PlayerNameLabels>
        </td>
        <td onClick={toggleClicked}>{p.ratings.pos}</td>
        <td onClick={toggleClicked}>{p.age}</td>
        <td onClick={toggleClicked}>{p.stats.yearsWithTeam}</td>
        <td onClick={toggleClicked}>
            <RatingWithChange change={p.ratings.dovr}>{p.ratings.ovr}</RatingWithChange>
        </td>
        <td onClick={toggleClicked}>
            <RatingWithChange change={p.ratings.dpot}>{p.ratings.pot}</RatingWithChange>
        </td>
        {season === g.season ? <td>
            {helpers.formatCurrency(p.contract.amount, 'M')} thru {p.contract.exp}
        </td> : null}
        <td onClick={toggleClicked}>{p.stats.gp}</td>
        <td onClick={toggleClicked}>{helpers.round(p.stats.min, 1)}</td>
        <td onClick={toggleClicked}>{helpers.round(p.stats.pts, 1)}</td>
        <td onClick={toggleClicked}>{helpers.round(p.stats.trb, 1)}</td>
        <td onClick={toggleClicked}>{helpers.round(p.stats.ast, 1)}</td>
        <td onClick={toggleClicked}>{helpers.round(p.stats.per, 1)}</td>
        {editable ? <td onClick={toggleClicked}><PlayingTime p={p} /></td> : null}
        {editable ? <td onClick={toggleClicked}>
            <button
                className="btn btn-default btn-xs"
                disabled={!p.canRelease}
                onClick={() => handleRelease(p)}
            >
                Release
            </button>
        </td> : null}
        {showTradeFor ? <td onClick={toggleClicked} title={p.untradableMsg}>
            <button
                className="btn btn-default btn-xs"
                disabled={p.untradable}
                onClick={() => tradeFor({pid: p.pid})}
            >Trade For</button>
        </td> : null}
    </tr>;
});

class Roster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedPid: undefined,
        };
    }

    async handleReorderClick(pid) {
        if (this.state.selectedPid === undefined) {
            this.setState({selectedPid: pid});
        } else if (this.state.selectedPid === pid) {
            this.setState({selectedPid: undefined});
        } else {
            await swapRosterOrder(this.props.players, pid, this.state.selectedPid);
            this.setState({selectedPid: undefined});
        }
    }

    initSortable() {
        const rosterTbody = $("#roster-tbody");

        // The first this is called, set up sorting, but disable it by default
        if (!rosterTbody.is(":ui-sortable")) {
            rosterTbody.sortable({
                helper(e, ui) {
                    // Return helper which preserves the width of table cells being reordered
                    ui.children().each(function () {
                        $(this).width($(this).width());
                    });
                    return ui;
                },
                cursor: "move",
                async update() {
                    const sortedPids = $(this).sortable("toArray", {attribute: "data-pid"});
                    for (let i = 0; i < sortedPids.length; i++) {
                        sortedPids[i] = parseInt(sortedPids[i], 10);
                    }

                    await handleReorderDrag(sortedPids);
                },
                handle: ".roster-handle",
                disabled: true,
            });
        }

        if (this.props.editable) {
            rosterTbody.sortable("enable");
        } else {
            rosterTbody.sortable("disable");
        }
    }

    componentDidMount() {
        this.initSortable();
    }

    componentDidUpdate() {
        this.initSortable();
    }

    render() {
        const {abbrev, editable, payroll, players, salaryCap, season, showTradeFor, team} = this.props;

        bbgmViewReact.title(`${team.region} ${team.name} Roster - ${season}`);

        const logoStyle = {};
        if (team.imgURL) {
            logoStyle.display = "inline";
            logoStyle.backgroundImage = `url('${team.imgURL}')`;
        }

        return <div>
            <Dropdown view="roster" fields={["teams", "seasons"]} values={[abbrev, season]} />
            <div className="pull-right">
                <DropdownButton id="dropdown-more-info" title="More Info">
                    <MenuItem href={helpers.leagueUrl(['player_stats', abbrev, season])}>Player Stats</MenuItem>
                    <MenuItem href={helpers.leagueUrl(['player_ratings', abbrev, season])}>Player Ratings</MenuItem>
                </DropdownButton>
            </div>

            <h1>{team.region} {team.name} Roster <NewWindowLink /></h1>
            <p>More: <a href={helpers.leagueUrl(['team_finances', abbrev])}>Finances</a> | <a href={helpers.leagueUrl(['game_log', abbrev, season])}>Game Log</a> | <a href={helpers.leagueUrl(['team_history', abbrev])}>History</a> | <a href={helpers.leagueUrl(['transactions', abbrev])}>Transactions</a></p>
            <div className="team-picture" style={logoStyle} />
            <div>
                <h3>
                    Record: <RecordAndPlayoffs
                        abbrev={abbrev}
                        season={season}
                        won={team.won}
                        lost={team.lost}
                        playoffRoundsWon={team.playoffRoundsWon}
                        option="noSeason"
                    />
                </h3>

                {season === g.season ? <p>
                    {15 - players.length} open roster spots<br />
                    Payroll: {helpers.formatCurrency(payroll, 'M')}<br />
                    Salary cap: {helpers.formatCurrency(salaryCap, 'M')}<br />
                    Profit: {helpers.formatCurrency(team.profit, 'M')}<br />
                    {showTradeFor ? `Strategy: ${team.strategy}` : null}
                </p> : null}
            </div>
            {editable ? <p>Click or drag row handles to move players between the starting lineup (<span className="roster-starter">&#9632;</span>) and the bench (<span className="roster-bench">&#9632;</span>).</p> : null}
            {editable ? <p><button className="btn btn-default" onClick={handleAutoSort}>Auto sort roster</button>
            </p> : null}

            <div className="table-responsive">
                <table className="table table-striped table-bordered table-condensed table-hover">
                    <thead>
                        <tr>
                            {editable ? <th /> : null}
                            <th>Name</th>
                            <th title="Position">Pos</th>
                            <th>Age</th>
                            <th title="Years With Team">YWT</th>
                            <th title="Overall Rating">Ovr</th>
                            <th title="Potential Rating">Pot</th>
                            {season === g.season ? <th>Contract</th> : null}
                            <th title="Games Played">GP</th>
                            <th title="Minutes Per Game">Min</th>
                            <th title="Points Per Game">Pts</th>
                            <th title="Rebounds Per Game">Reb</th>
                            <th title="Assists Per Game">Ast</th>
                            <th title="Player Efficiency Rating">PER</th>
                            {editable ? <th title="Playing Time Modifier">PT <HelpPopover placement="left" title="Playing Time Modifier">
                                <p>Your coach will divide up playing time based on ability and stamina. If you want to influence his judgement, your options are:</p>
                                <p>
                                    <span style={ptStyles['0']}>0 No Playing Time</span><br />
                                    <span style={ptStyles['0.75']}>- Less Playing Time</span><br />
                                    <span style={ptStyles['1']}>&nbsp;&nbsp;&nbsp; Let Coach Decide</span><br />
                                    <span style={ptStyles['1.25']}>+ More Playing Time</span><br />
                                    <span style={ptStyles['1.75']}>++ Even More Playing Time</span>
                                </p>
                            </HelpPopover></th> : null}
                            {editable ? <th>Release <HelpPopover placement="left" title="Release Player">
                                <p>To free up a roster spot, you can release a player from your team. You will still have to pay his salary (and have it count against the salary cap) until his contract expires (you can view your released players' contracts in your <a href={helpers.leagueUrl(["team_finances"])}>Team Finances</a>).</p>
                                <p>However, if you just drafted a player and the regular season has not started yet, his contract is not guaranteed and you can release him for free.</p>
                            </HelpPopover></th> : null}
                            {showTradeFor ? <th>Trade For</th> : null}
                        </tr>
                    </thead>
                    <tbody id="roster-tbody">
                        {players.map((p, i) => {
                            const handleReorderClick = this.handleReorderClick.bind(this, p.pid);
                            return <RosterRow
                                key={p.pid}
                                editable={editable}
                                handleReorderClick={handleReorderClick}
                                i={i}
                                p={p}
                                season={season}
                                selectedPid={this.state.selectedPid}
                                showTradeFor={showTradeFor}
                            />;
                        })}
                    </tbody>
                </table>
            </div>
        </div>;
    }
}
Roster.defaultProps = {players: [], team: {}};

module.exports = Roster;
