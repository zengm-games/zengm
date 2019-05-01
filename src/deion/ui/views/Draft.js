import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle, toWorker } from "../util";
import {
    DataTable,
    DraftAbbrev,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";

const DraftButtons = ({ userRemaining, usersTurn }) => {
    const untilText = userRemaining ? "your next pick" : "end of draft";
    return (
        <div className="btn-group mb-3">
            <button
                className="btn btn-light-bordered"
                disabled={usersTurn}
                onClick={async () => {
                    await toWorker("actions.playMenu.onePick");
                }}
            >
                Sim one pick
            </button>
            <button
                className="btn btn-light-bordered"
                disabled={usersTurn}
                onClick={async () => {
                    await toWorker("actions.playMenu.untilYourNextPick");
                }}
            >
                Sim until {untilText}
            </button>
        </div>
    );
};

DraftButtons.propTypes = {
    userRemaining: PropTypes.bool.isRequired,
    usersTurn: PropTypes.bool.isRequired,
};

const TradeButton = ({ disabled, dpid, tid, visible }) => {
    return visible ? (
        <button
            className="btn btn-xs btn-light-bordered"
            disabled={disabled}
            onClick={async () => {
                await toWorker("actions.tradeFor", { dpid, tid });
            }}
        >
            Trade For Pick
        </button>
    ) : null;
};

TradeButton.propTypes = {
    disabled: PropTypes.bool.isRequired,
    dpid: PropTypes.number.isRequired,
    tid: PropTypes.number.isRequired,
    visible: PropTypes.bool.isRequired,
};

const scrollLeft = (pos: number) => {
    // https://blog.hospodarets.com/native_smooth_scrolling
    if ("scrollBehavior" in document.documentElement.style) {
        window.scrollTo({
            left: pos,
            top: document.body.scrollTop,
            behavior: "smooth",
        });
    } else {
        window.scrollTo(pos, document.body.scrollTop);
    }
};

const viewDrafted = () => {
    scrollLeft(document.body.scrollWidth - document.body.clientWidth);
};
const viewUndrafted = () => {
    scrollLeft(0);
};

class Draft extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            drafting: false,
        };
    }

    async draftUser(pid, simToNextUserPick = false) {
        this.setState({ drafting: true });
        await toWorker("draftUser", pid);
        this.setState({ drafting: false });

        if (simToNextUserPick) {
            await toWorker("actions.playMenu.untilYourNextPick");
        }
    }

    render() {
        const {
            draftType,
            drafted,
            fantasyDraft,
            stats,
            undrafted,
            userTids,
        } = this.props;

        setTitle("Draft");

        const remainingPicks = drafted.filter(p => p.pid < 0);
        const nextPick = remainingPicks[0];
        const usersTurn = nextPick && userTids.includes(nextPick.draft.tid);
        const userRemaining = remainingPicks.some(p =>
            userTids.includes(p.draft.tid),
        );

        const colsUndrafted = getCols(
            "Name",
            "Pos",
            "Age",
            "Ovr",
            "Pot",
            "Draft",
        );
        colsUndrafted[0].width = "100%";

        if (fantasyDraft) {
            colsUndrafted.splice(
                5,
                0,
                ...getCols("Contract", ...stats.map(stat => `stat:${stat}`)),
            );
        }

        const rowsUndrafted = undrafted.map(p => {
            const data = [
                <PlayerNameLabels
                    pid={p.pid}
                    injury={p.injury}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >
                    {p.name}
                </PlayerNameLabels>,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                <div className="btn-group" style={{ display: "flex" }}>
                    <button
                        className="btn btn-xs btn-primary"
                        disabled={!usersTurn || this.state.drafting}
                        onClick={() => this.draftUser(p.pid)}
                        title="Draft player"
                    >
                        Draft
                    </button>
                    <button
                        className="btn btn-xs btn-light-bordered"
                        disabled={!usersTurn || this.state.drafting}
                        onClick={() => this.draftUser(p.pid, true)}
                        title="Draft player and sim to your next pick or end of draft"
                    >
                        And Sim
                    </button>
                </div>,
            ];

            if (fantasyDraft) {
                data.splice(
                    5,
                    0,
                    `${helpers.formatCurrency(p.contract.amount, "M")} thru ${
                        p.contract.exp
                    }`,
                    ...stats.map(stat =>
                        p.pid >= 0 &&
                        p.stats &&
                        typeof p.stats[stat] === "number"
                            ? helpers.roundStat(p.stats[stat], stat)
                            : p.stats[stat],
                    ),
                );
            }

            return {
                key: p.pid,
                data,
            };
        });

        const colsDrafted = getCols("Pick", "Team").concat(
            colsUndrafted.slice(0, -1),
        );

        const rowsDrafted = drafted.map((p, i) => {
            const data = [
                `${p.draft.round}-${p.draft.pick}`,
                <DraftAbbrev
                    originalTid={p.draft.originalTid}
                    tid={p.draft.tid}
                >
                    {p.draft.tid} {p.draft.originalTid}
                </DraftAbbrev>,
                p.pid >= 0 ? (
                    <PlayerNameLabels
                        pid={p.pid}
                        injury={p.injury}
                        skills={p.ratings.skills}
                        watch={p.watch}
                    >
                        {p.name}
                    </PlayerNameLabels>
                ) : (
                    <TradeButton
                        dpid={p.draft.dpid}
                        disabled={this.state.drafting}
                        tid={p.draft.tid}
                        visible={
                            !fantasyDraft && !userTids.includes(p.draft.tid)
                        }
                    />
                ),
                p.pid >= 0 ? p.ratings.pos : null,
                p.pid >= 0 ? p.age : null,
                p.pid >= 0 ? p.ratings.ovr : null,
                p.pid >= 0 ? p.ratings.pot : null,
            ];

            if (fantasyDraft) {
                data.splice(
                    7,
                    0,
                    p.pid >= 0
                        ? `${helpers.formatCurrency(
                              p.contract.amount,
                              "M",
                          )} thru ${p.contract.exp}`
                        : null,
                    ...stats.map(stat =>
                        p.pid >= 0 &&
                        p.stats &&
                        typeof p.stats[stat] === "number"
                            ? helpers.roundStat(p.stats[stat], stat)
                            : null,
                    ),
                );
            }

            return {
                key: i,
                data,
                classNames: { "table-info": userTids.includes(p.draft.tid) },
            };
        });

        const buttonClasses = classNames("btn", "btn-info", "btn-xs", {
            "d-sm-none": !fantasyDraft,
        });

        const wrapperClasses = classNames(
            "row",
            "row-offcanvas",
            "row-offcanvas-right",
            {
                "row-offcanvas-force": fantasyDraft,
                "row-offcanvas-right-force": fantasyDraft,
            },
        );

        const colClass = fantasyDraft ? "col-12" : "col-sm-6";
        const undraftedColClasses = classNames(colClass);
        const draftedColClasses = classNames("sidebar-offcanvas", colClass, {
            "sidebar-offcanvas-force": fantasyDraft,
        });

        return (
            <>
                <h1>
                    Draft <NewWindowLink />
                </h1>

                <p>
                    More:{" "}
                    <a href={helpers.leagueUrl(["draft_scouting"])}>
                        Future Draft Scouting
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["draft_summary"])}>
                        Draft Summary
                    </a>{" "}
                    |{" "}
                    {draftType !== "noLottery" ? (
                        <>
                            <a href={helpers.leagueUrl(["draft_lottery"])}>
                                Draft Lottery
                            </a>{" "}
                            |{" "}
                        </>
                    ) : null}
                    <a href={helpers.leagueUrl(["draft_team_history"])}>
                        Team History
                    </a>
                </p>

                <p>
                    When your turn in the draft comes up, select from the list
                    of available players on the left.
                </p>

                <DraftButtons
                    userRemaining={userRemaining}
                    usersTurn={usersTurn}
                />

                <div className={wrapperClasses}>
                    <div className={undraftedColClasses}>
                        <h2>
                            Undrafted Players
                            <span className="float-right">
                                <button
                                    type="button"
                                    className={buttonClasses}
                                    onClick={viewDrafted}
                                >
                                    View Drafted
                                </button>
                            </span>
                        </h2>

                        <DataTable
                            cols={colsUndrafted}
                            defaultSort={[4, "desc"]}
                            name="Draft:Undrafted"
                            pagination={rowsDrafted.length > 100}
                            rows={rowsUndrafted}
                        />
                    </div>
                    <div className={draftedColClasses}>
                        <h2>
                            Draft Results
                            <span className="float-right">
                                <button
                                    type="button"
                                    className={buttonClasses}
                                    onClick={viewUndrafted}
                                >
                                    View Undrafted
                                </button>
                            </span>
                        </h2>

                        <DataTable
                            cols={colsDrafted}
                            defaultSort={[0, "asc"]}
                            name="Draft:Drafted"
                            pagination={rowsDrafted.length > 100}
                            rows={rowsDrafted}
                        />
                    </div>
                </div>
            </>
        );
    }
}

Draft.propTypes = {
    draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery"]),
    drafted: PropTypes.arrayOf(PropTypes.object).isRequired,
    fantasyDraft: PropTypes.bool.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    undrafted: PropTypes.arrayOf(PropTypes.object).isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default Draft;
