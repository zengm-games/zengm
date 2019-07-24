import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
    arrayMove,
} from "react-sortable-hoc";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import { PHASE } from "../../../common";
import {
    Dropdown,
    HelpPopover,
    NewWindowLink,
    PlayerNameLabels,
    RatingWithChange,
    ResponsiveTableWrapper,
} from "../../components";
import {
    confirm,
    getCols,
    helpers,
    logEvent,
    setTitle,
    toWorker,
} from "../../util";
import PlayingTime, { ptStyles } from "./PlayingTime";
import TopStuff from "./TopStuff";
import clickable from "../../wrappers/clickable";

// If a player was just drafted and the regular season hasn't started, then he can be released without paying anything
const justDrafted = (p, phase, season) => {
    return (
        (p.draft.year === season && phase >= PHASE.DRAFT) ||
        (p.draft.year === season - 1 && phase < PHASE.REGULAR_SEASON)
    );
};

const handleRelease = async (p, phase, season) => {
    const wasPlayerJustDrafted = justDrafted(p, phase, season);

    let releaseMessage;
    if (wasPlayerJustDrafted) {
        releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team. Because you just drafted him and the regular season has not started yet, you will not have to pay his contract.`;
    } else {
        releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ${p.contract.exp}.`;
    }

    const proceed = await confirm(releaseMessage);
    if (proceed) {
        const errorMsg = await toWorker(
            "releasePlayer",
            p.pid,
            wasPlayerJustDrafted,
        );
        if (errorMsg) {
            logEvent({
                type: "error",
                text: errorMsg,
                saveToDb: false,
            });
        }
    }
};

const ReorderHandle = SortableHandle(({ i, isSorting }) => {
    return (
        <td
            className={classNames("roster-handle", {
                "table-info": i <= 4,
                "table-secondary": i > 4,
                "user-select-none": isSorting,
            })}
        />
    );
});

ReorderHandle.propTypes = {
    i: PropTypes.number.isRequired,
    isSorting: PropTypes.bool.isRequired,
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
            showRelease,
            showTradeFor,
            stats,
            toggleClicked,
            userTid,
        } = props;

        return (
            <tr
                key={p.pid}
                className={classNames({
                    separator: process.env.SPORT === "basketball" && i === 4,
                    "table-warning": clicked,
                    "table-danger": p.hof,
                })}
                data-pid={p.pid}
            >
                {editable ? (
                    <ReorderHandle i={i} isSorting={isSorting} />
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
                {stats.map(stat => (
                    <td key={stat} onClick={toggleClicked}>
                        {helpers.roundStat(p.stats[stat], stat)}
                    </td>
                ))}
                {editable ? (
                    <td onClick={toggleClicked}>
                        <PlayingTime p={p} userTid={userTid} />
                    </td>
                ) : null}
                {showRelease ? (
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
    showRelease: PropTypes.bool.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
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
        showRelease,
        showTradeFor,
        stats,
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
                            showRelease={showRelease}
                            showTradeFor={showTradeFor}
                            stats={stats}
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
    showRelease: PropTypes.bool.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number.isRequired,
};

class Roster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSorting: false,
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
            showRelease,
            showTradeFor,
            stats,
            t,
            userTid,
        } = this.props;

        setTitle(`${t.region} ${t.name} Roster - ${season}`);

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

        const statCols = getCols(...stats.map(stat => `stat:${stat}`));

        return (
            <>
                <Dropdown
                    view="roster"
                    fields={["teams", "seasons"]}
                    values={[abbrev, season]}
                />
                <UncontrolledDropdown className="float-right my-1">
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
                    {process.env.SPORT === "football" ? (
                        <>
                            <a href={helpers.leagueUrl(["depth", abbrev])}>
                                Depth Chart
                            </a>{" "}
                            |{" "}
                        </>
                    ) : null}
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

                <TopStuff
                    abbrev={abbrev}
                    currentSeason={currentSeason}
                    editable={editable}
                    numConfs={numConfs}
                    numPlayoffRounds={numPlayoffRounds}
                    openRosterSpots={maxRosterSize - players.length}
                    players={players}
                    season={season}
                    payroll={payroll}
                    profit={profit}
                    salaryCap={salaryCap}
                    showTradeFor={showTradeFor}
                    t={t}
                />

                <div className="clearfix" />

                <ResponsiveTableWrapper nonfluid>
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
                                {statCols.map(({ desc, title }) => (
                                    <th key={title} title={desc}>
                                        {title}
                                    </th>
                                ))}
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
                                {showRelease ? (
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
                            showRelease={showRelease}
                            showTradeFor={showTradeFor}
                            stats={stats}
                            transitionDuration={0}
                            useDragHandle
                            userTid={userTid}
                        />
                    </table>
                </ResponsiveTableWrapper>
            </>
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
    showRelease: PropTypes.bool.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    t: PropTypes.object.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default Roster;
