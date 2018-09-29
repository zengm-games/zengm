import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import {
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
} from "reactstrap";
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
    arrayMove,
} from "react-sortable-hoc";
import { PHASE } from "../../common";
import { helpers, logEvent, setTitle, toWorker } from "../util";
import {
    Dropdown,
    HelpPopover,
    NewWindowLink,
    PlayerNameLabels,
    RatingWithChange,
    RecordAndPlayoffs,
} from "../components";
import clickable from "../wrappers/clickable";

const ptStyles = {
    0: {
        backgroundColor: "#a00",
        color: "#fff",
    },
    0.75: {
        backgroundColor: "#ff0",
        color: "#000",
    },
    1: {
        backgroundColor: "#ccc",
        color: "#000",
    },
    1.25: {
        backgroundColor: "#0f0",
        color: "#000",
    },
    1.75: {
        backgroundColor: "#070",
        color: "#fff",
    },
};

const handleAutoSort = async () => {
    await toWorker("autoSortRoster");
};

const handleResetPT = async (tid: number) => {
    await toWorker("resetPlayingTime", tid);
};

// If a player was just drafted by his current team and the regular season hasn't started, then he can be released without paying anything
const justDrafted = (p, phase, season) => {
    return (
        p.tid === p.draft.tid &&
        ((p.draft.year === season && phase >= PHASE.DRAFT) ||
            (p.draft.year === season - 1 && phase < PHASE.REGULAR_SEASON))
    );
};

const handleRelease = async (p, phase, season) => {
    let releaseMessage;
    if (justDrafted(p, phase, season)) {
        releaseMessage = `Are you sure you want to release ${
            p.name
        }?  He will become a free agent and no longer take up a roster spot on your team. Because you just drafted him and the regular season has not started yet, you will not have to pay his contract.`;
    } else {
        releaseMessage = `Are you sure you want to release ${
            p.name
        }?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ${
            p.contract.exp
        }.`;
    }

    if (window.confirm(releaseMessage)) {
        const errorMsg = await toWorker("releasePlayer", p.pid, justDrafted);
        if (errorMsg) {
            logEvent({
                type: "error",
                text: errorMsg,
                saveToDb: false,
            });
        }
    }
};

const handlePtChange = async (p, userTid, event) => {
    const ptModifier = parseFloat(event.currentTarget.value);

    if (Number.isNaN(ptModifier)) {
        return;
    }

    // NEVER UPDATE AI TEAMS
    // This shouldn't be necessary, but just in case...
    if (p.tid !== userTid) {
        return;
    }

    await toWorker("updatePlayingTime", p.pid, ptModifier);
};

const PlayingTime = ({ p, userTid }) => {
    const ptModifiers = [
        { text: "0", ptModifier: "0" },
        { text: "-", ptModifier: "0.75" },
        { text: " ", ptModifier: "1" },
        { text: "+", ptModifier: "1.25" },
        { text: "++", ptModifier: "1.75" },
    ];

    return (
        <select
            className="form-control pt-modifier-select"
            value={p.ptModifier}
            onChange={event => handlePtChange(p, userTid, event)}
            style={ptStyles[String(p.ptModifier)]}
        >
            {ptModifiers.map(({ text, ptModifier }) => {
                return (
                    <option key={ptModifier} value={ptModifier}>
                        {text}
                    </option>
                );
            })}
        </select>
    );
};

PlayingTime.propTypes = {
    p: PropTypes.object.isRequired,
    userTid: PropTypes.number.isRequired,
};

const ReorderHandle = SortableHandle(({ i, isSorting, pid, selectedPid }) => {
    let backgroundColor = "rgb(91, 192, 222)";
    if (selectedPid === pid) {
        backgroundColor = "#d9534f";
    } else if (selectedPid !== undefined) {
        if (i <= 4) {
            backgroundColor = "rgba(66, 139, 202, 0.6)";
        } else {
            backgroundColor = "rgba(91, 192, 222, 0.6)";
        }
    } else if (i <= 4) {
        backgroundColor = "rgb(66, 139, 202)";
    }

    return (
        <td
            className={classNames("roster-handle", {
                "user-select-none": isSorting,
            })}
            style={{ backgroundColor }}
        />
    );
});

ReorderHandle.propTypes = {
    i: PropTypes.number.isRequired,
    isSorting: PropTypes.bool.isRequired,
    pid: PropTypes.number.isRequired,
    selectedPid: PropTypes.number,
};

const RosterRow = SortableElement(
    clickable(props => {
        const {
            clicked,
            currentSeason,
            editable,
            i,
            isSorting,
            p,
            phase,
            season,
            selectedPid,
            showTradeFor,
            toggleClicked,
            userTid,
        } = props;

        return (
            <tr
                key={p.pid}
                className={classNames({ separator: i === 4, warning: clicked })}
                data-pid={p.pid}
            >
                {editable ? (
                    <ReorderHandle
                        i={i}
                        isSorting={isSorting}
                        pid={p.pid}
                        selectedPid={selectedPid}
                    />
                ) : null}
                <td onClick={toggleClicked}>
                    <PlayerNameLabels
                        pid={p.pid}
                        injury={p.injury}
                        skills={p.ratings.skills}
                        watch={p.watch}
                    >
                        {p.name}
                    </PlayerNameLabels>
                </td>
                <td onClick={toggleClicked}>{p.ratings.pos}</td>
                <td onClick={toggleClicked}>{p.age}</td>
                <td onClick={toggleClicked}>{p.stats.yearsWithTeam}</td>
                <td onClick={toggleClicked}>
                    <RatingWithChange change={p.ratings.dovr}>
                        {p.ratings.ovr}
                    </RatingWithChange>
                </td>
                <td onClick={toggleClicked}>
                    <RatingWithChange change={p.ratings.dpot}>
                        {p.ratings.pot}
                    </RatingWithChange>
                </td>
                {season === currentSeason ? (
                    <td
                        style={{
                            fontStyle: justDrafted(p, phase, currentSeason)
                                ? "italic"
                                : "normal",
                        }}
                        title={
                            justDrafted(p, phase, currentSeason)
                                ? "Contracts for drafted players are not guaranteed until the regular season. If you release a drafted player before then, you pay nothing."
                                : null
                        }
                    >
                        {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                        {p.contract.exp}
                    </td>
                ) : null}
                <td onClick={toggleClicked}>{p.stats.gp}</td>
                <td onClick={toggleClicked}>{p.stats.min.toFixed(1)}</td>
                <td onClick={toggleClicked}>{p.stats.pts.toFixed(1)}</td>
                <td onClick={toggleClicked}>{p.stats.trb.toFixed(1)}</td>
                <td onClick={toggleClicked}>{p.stats.ast.toFixed(1)}</td>
                <td onClick={toggleClicked}>{p.stats.per.toFixed(1)}</td>
                {editable ? (
                    <td onClick={toggleClicked}>
                        <PlayingTime p={p} userTid={userTid} />
                    </td>
                ) : null}
                {editable ? (
                    <td onClick={toggleClicked}>
                        <button
                            className="btn btn-light-bordered btn-xs"
                            disabled={!p.canRelease}
                            onClick={() =>
                                handleRelease(p, phase, currentSeason)
                            }
                        >
                            Release
                        </button>
                    </td>
                ) : null}
                {showTradeFor ? (
                    <td onClick={toggleClicked} title={p.untradableMsg}>
                        <button
                            className="btn btn-light-bordered btn-xs"
                            disabled={p.untradable}
                            onClick={() =>
                                toWorker("actions.tradeFor", { pid: p.pid })
                            }
                        >
                            Trade For
                        </button>
                    </td>
                ) : null}
            </tr>
        );
    }),
);

RosterRow.propTypes = {
    currentSeason: PropTypes.number.isRequired,
    editable: PropTypes.bool.isRequired,
    i: PropTypes.number.isRequired,
    isSorting: PropTypes.bool.isRequired,
    p: PropTypes.object.isRequired,
    phase: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    selectedPid: PropTypes.number,
    showTradeFor: PropTypes.bool.isRequired,
    userTid: PropTypes.number.isRequired,
};

const TBody = SortableContainer(
    ({
        currentSeason,
        editable,
        isSorting,
        phase,
        players,
        season,
        selectedPid,
        showTradeFor,
        userTid,
    }) => {
        return (
            <tbody id="roster-tbody">
                {players.map((p, i) => {
                    return (
                        <RosterRow
                            key={p.pid}
                            currentSeason={currentSeason}
                            editable={editable}
                            i={i}
                            index={i}
                            isSorting={isSorting}
                            p={p}
                            phase={phase}
                            season={season}
                            selectedPid={selectedPid}
                            showTradeFor={showTradeFor}
                            userTid={userTid}
                        />
                    );
                })}
            </tbody>
        );
    },
);

TBody.propTypes = {
    currentSeason: PropTypes.number.isRequired,
    editable: PropTypes.bool.isRequired,
    isSorting: PropTypes.bool.isRequired,
    phase: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
    selectedPid: PropTypes.number,
    showTradeFor: PropTypes.bool.isRequired,
    userTid: PropTypes.number.isRequired,
};

class Roster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSorting: false,
            selectedPid: undefined,
            sortedPids: undefined,
        };

        this.handleOnSortEnd = this.handleOnSortEnd.bind(this);
        this.handleOnSortStart = this.handleOnSortStart.bind(this);
    }

    async handleOnSortEnd({ oldIndex, newIndex }) {
        const pids = this.props.players.map(p => p.pid);
        const sortedPids = arrayMove(pids, oldIndex, newIndex);
        this.setState({
            isSorting: false,
            sortedPids,
        });
        await toWorker("reorderRosterDrag", sortedPids);
    }

    handleOnSortStart({ clonedNode, node }) {
        this.setState({ isSorting: true });

        // Ideally, this wouldn't be necessary https://github.com/clauderic/react-sortable-hoc/issues/175
        const clonedChildren = clonedNode.childNodes;
        const children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
            clonedChildren[i].style.padding = "5px";
            clonedChildren[i].style.width = `${children[i].offsetWidth}px`;
        }
    }

    static getDerivedStateFromProps() {
        return {
            sortedPids: undefined,
        };
    }

    render() {
        const {
            abbrev,
            currentSeason,
            editable,
            maxRosterSize,
            numConfs,
            numPlayoffRounds,
            payroll,
            phase,
            players,
            salaryCap,
            season,
            showTradeFor,
            t,
            userTid,
        } = this.props;

        setTitle(`${t.region} ${t.name} Roster - ${season}`);

        const logoStyle = {};
        if (t.imgURL) {
            logoStyle.display = "inline";
            logoStyle.backgroundImage = `url('${t.imgURL}')`;
        }

        // Use the result of drag and drop to sort players, before the "official" order comes back as props
        let playersSorted;
        if (this.state.sortedPids !== undefined) {
            playersSorted = this.state.sortedPids.map(pid => {
                return players.find(p => p.pid === pid);
            });
        } else {
            playersSorted = players;
        }

        const profit = t.seasonAttrs !== undefined ? t.seasonAttrs.profit : 0;

        const recordAndPlayoffs =
            t.seasonAttrs !== undefined ? (
                <span>
                    Record:{" "}
                    <RecordAndPlayoffs
                        abbrev={abbrev}
                        season={season}
                        won={t.seasonAttrs.won}
                        lost={t.seasonAttrs.lost}
                        playoffRoundsWon={t.seasonAttrs.playoffRoundsWon}
                        option="noSeason"
                        numConfs={numConfs}
                        numPlayoffRounds={numPlayoffRounds}
                    />
                </span>
            ) : (
                "Season not found"
            );

        return (
            <div>
                <Dropdown
                    view="roster"
                    fields={["teams", "seasons"]}
                    values={[abbrev, season]}
                />
                <UncontrolledDropdown className="float-right">
                    <DropdownToggle caret className="btn-light-bordered">
                        More Info
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem
                            href={helpers.leagueUrl([
                                "player_stats",
                                abbrev,
                                season,
                            ])}
                        >
                            Player Stats
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl([
                                "player_ratings",
                                abbrev,
                                season,
                            ])}
                        >
                            Player Ratings
                        </DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>

                <h1>
                    {t.region} {t.name} Roster <NewWindowLink />
                </h1>
                <p>
                    More:{" "}
                    <a href={helpers.leagueUrl(["team_finances", abbrev])}>
                        Finances
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["game_log", abbrev, season])}>
                        Game Log
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["team_history", abbrev])}>
                        History
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["transactions", abbrev])}>
                        Transactions
                    </a>
                </p>
                <div className="team-picture" style={logoStyle} />
                <div>
                    <h3>{recordAndPlayoffs}</h3>

                    {season === currentSeason ? (
                        <p>
                            {maxRosterSize - players.length} open roster spots
                            <br />
                            Payroll: {helpers.formatCurrency(payroll, "M")}
                            <br />
                            Salary cap: {helpers.formatCurrency(salaryCap, "M")}
                            <br />
                            Profit: {helpers.formatCurrency(profit, "M")}
                            <br />
                            {showTradeFor ? `Strategy: ${t.strategy}` : null}
                        </p>
                    ) : null}
                </div>
                {editable ? (
                    <p>
                        Drag row handles to move players between the starting
                        lineup (<span className="roster-starter">&#9632;</span>)
                        and the bench (
                        <span className="roster-bench">&#9632;</span>
                        ).
                    </p>
                ) : null}
                {editable ? (
                    <div className="btn-group" style={{ marginBottom: "1em" }}>
                        <button
                            className="btn btn-light-bordered"
                            onClick={handleAutoSort}
                        >
                            Auto sort roster
                        </button>
                        <button
                            className="btn btn-light-bordered"
                            onClick={() => handleResetPT(t.tid)}
                        >
                            Reset playing time
                        </button>
                    </div>
                ) : null}

                <div className="table-responsive">
                    <table className="table table-striped table-bordered table-sm table-hover">
                        <thead>
                            <tr>
                                {editable ? <th /> : null}
                                <th>Name</th>
                                <th title="Position">Pos</th>
                                <th>Age</th>
                                <th title="Years With Team">YWT</th>
                                <th title="Overall Rating">Ovr</th>
                                <th title="Potential Rating">Pot</th>
                                {season === currentSeason ? (
                                    <th>Contract</th>
                                ) : null}
                                <th title="Games Played">GP</th>
                                <th title="Minutes Per Game">Min</th>
                                <th title="Points Per Game">Pts</th>
                                <th title="Rebounds Per Game">Reb</th>
                                <th title="Assists Per Game">Ast</th>
                                <th title="Player Efficiency Rating">PER</th>
                                {editable ? (
                                    <th title="Playing Time Modifier">
                                        PT{" "}
                                        <HelpPopover
                                            placement="left"
                                            title="Playing Time Modifier"
                                        >
                                            <p>
                                                Your coach will divide up
                                                playing time based on ability
                                                and stamina. If you want to
                                                influence his judgement, your
                                                options are:
                                            </p>
                                            <p>
                                                <span style={ptStyles["0"]}>
                                                    0 No Playing Time
                                                </span>
                                                <br />
                                                <span style={ptStyles["0.75"]}>
                                                    - Less Playing Time
                                                </span>
                                                <br />
                                                <span style={ptStyles["1"]}>
                                                    &nbsp;&nbsp;&nbsp; Let Coach
                                                    Decide
                                                </span>
                                                <br />
                                                <span style={ptStyles["1.25"]}>
                                                    + More Playing Time
                                                </span>
                                                <br />
                                                <span style={ptStyles["1.75"]}>
                                                    ++ Even More Playing Time
                                                </span>
                                            </p>
                                        </HelpPopover>
                                    </th>
                                ) : null}
                                {editable ? (
                                    <th>
                                        Release{" "}
                                        <HelpPopover
                                            placement="left"
                                            title="Release Player"
                                        >
                                            <p>
                                                To free up a roster spot, you
                                                can release a player from your
                                                team. You will still have to pay
                                                his salary (and have it count
                                                against the salary cap) until
                                                his contract expires (you can
                                                view your released players'
                                                contracts in your{" "}
                                                <a
                                                    href={helpers.leagueUrl([
                                                        "team_finances",
                                                    ])}
                                                >
                                                    Team Finances
                                                </a>
                                                ).
                                            </p>
                                            <p>
                                                However, if you just drafted a
                                                player and the regular season
                                                has not started yet, his
                                                contract is not guaranteed and
                                                you can release him for free.
                                            </p>
                                        </HelpPopover>
                                    </th>
                                ) : null}
                                {showTradeFor ? <th>Trade For</th> : null}
                            </tr>
                        </thead>
                        <TBody
                            players={playersSorted}
                            currentSeason={currentSeason}
                            editable={editable}
                            isSorting={this.state.isSorting}
                            onSortEnd={this.handleOnSortEnd}
                            onSortStart={this.handleOnSortStart}
                            phase={phase}
                            season={season}
                            selectedPid={this.state.selectedPid}
                            showTradeFor={showTradeFor}
                            transitionDuration={0}
                            useDragHandle
                            userTid={userTid}
                        />
                    </table>
                </div>
            </div>
        );
    }
}

Roster.propTypes = {
    abbrev: PropTypes.string.isRequired,
    currentSeason: PropTypes.number.isRequired,
    editable: PropTypes.bool.isRequired,
    maxRosterSize: PropTypes.number.isRequired,
    numConfs: PropTypes.number.isRequired,
    numPlayoffRounds: PropTypes.number.isRequired,
    payroll: PropTypes.number,
    phase: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    salaryCap: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
    t: PropTypes.object.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default Roster;
