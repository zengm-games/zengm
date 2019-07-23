import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
    arrayMove,
} from "react-sortable-hoc";
import { PHASE } from "../../common";
import { NewWindowLink, ResponsiveTableWrapper } from "../components";
import { helpers, setTitle, toWorker } from "../util";
import clickable from "../wrappers/clickable";

const ReorderHandle = SortableHandle(({ highlight, isSorting }) => {
    return (
        <td
            className={classNames("roster-handle", {
                "table-info": highlight,
                "table-secondary": !highlight,
                "user-select-none": isSorting,
            })}
        />
    );
});

ReorderHandle.propTypes = {
    isSorting: PropTypes.bool.isRequired,
};

const DepthRow = SortableElement(
    clickable(props => {
        const { clicked, highlight, i, isSorting, t, toggleClicked } = props;

        return (
            <tr
                key={t.tid}
                className={classNames({
                    "table-warning": clicked,
                })}
            >
                <ReorderHandle highlight={highlight} isSorting={isSorting} />
                <td>{i + 1}</td>
                <td onClick={toggleClicked}>
                    <a href={helpers.leagueUrl(["roster", t.abbrev])}>
                        {t.region} {t.name}
                    </a>
                </td>
            </tr>
        );
    }),
);

DepthRow.propTypes = {
    highlight: PropTypes.bool.isRequired,
    i: PropTypes.number.isRequired,
    isSorting: PropTypes.bool.isRequired,
    t: PropTypes.shape({
        abbrev: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        region: PropTypes.string.isRequired,
        tid: PropTypes.number.isRequired,
    }),
};

const TBody = SortableContainer(({ isSorting, userTids, teams }) => {
    return (
        <tbody id="roster-tbody">
            {teams.map((t, i) => {
                return (
                    <DepthRow
                        key={t.tid}
                        highlight={userTids.includes(t.tid)}
                        i={i}
                        index={i}
                        isSorting={isSorting}
                        t={t}
                    />
                );
            })}
        </tbody>
    );
});

TBody.propTypes = {
    isSorting: PropTypes.bool.isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            tid: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

// Copied from worker/util/random lol
const randInt = (a: number, b: number): number => {
    return Math.floor(Math.random() * (1 + b - a)) + a;
};
const shuffle = (list: any[]) => {
    const l = list.length;
    for (let i = 1; i < l; i++) {
        const j = randInt(0, i);
        if (j !== i) {
            const t = list[i]; // swap list[i] and list[j]
            list[i] = list[j];
            list[j] = t;
        }
    }
};

class FantasyDraft extends React.Component {
    constructor(props) {
        super(props);
        this.startDraft = this.startDraft.bind(this);
        this.randomize = this.randomize.bind(this);
        this.handleOnSortEnd = this.handleOnSortEnd.bind(this);
        this.handleOnSortStart = this.handleOnSortStart.bind(this);

        this.state = {
            isSorting: false,
            sortedTids: props.teams.map(t => t.tid),
            starting: false,
        };
    }

    randomize() {
        this.setState(prevState => {
            const sortedTids = [...prevState.sortedTids];
            shuffle(sortedTids);
            return {
                sortedTids,
            };
        });
    }

    startDraft() {
        this.setState({ starting: true });
        toWorker("startFantasyDraft", this.state.sortedTids);
    }

    async handleOnSortEnd({ oldIndex, newIndex }) {
        this.setState(prevState => {
            const sortedTids = arrayMove(
                prevState.sortedTids,
                oldIndex,
                newIndex,
            );
            return {
                isSorting: false,
                sortedTids,
            };
        });
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

    render() {
        setTitle("Fantasy Draft");

        if (this.props.phase === PHASE.DRAFT) {
            return (
                <>
                    <h1>Error</h1>
                    <p>
                        You can't start a fantasy draft while a regular draft is
                        already in progress.
                    </p>
                </>
            );
        }

        // Use the result of drag and drop to sort players, before the "official" order comes back as props
        const teamsSorted = this.state.sortedTids.map(tid => {
            return this.props.teams.find(t => t.tid === tid);
        });

        return (
            <>
                <h1>
                    Fantasy Draft <NewWindowLink />
                </h1>

                <p>
                    In a "fantasy draft", all non-retired players are put into
                    one big pool and teams take turns drafting players, similar
                    to a fantasy {process.env.SPORT} draft. At the beginning of
                    the draft, the order of picks is randomized. During the
                    draft, the order of picks snakes (reverses every other
                    round). For example, the team that picks first in the first
                    round picks last in the second round.
                </p>

                <p>
                    To make things as fair as possible, all traded draft picks
                    will be returned to their original owners after the fantasy
                    draft.
                </p>

                <h2>Draft Order</h2>

                <button
                    className="btn btn-light-bordered mb-3"
                    disabled={this.state.starting}
                    onClick={this.randomize}
                >
                    Randomize
                </button>

                <div className="clearfix" />

                <ResponsiveTableWrapper nonfluid>
                    <table className="table table-striped table-bordered table-sm table-hover">
                        <thead>
                            <tr>
                                <th />
                                <th>#</th>
                                <th>Team</th>
                            </tr>
                        </thead>
                        <TBody
                            userTids={this.props.userTids}
                            teams={teamsSorted}
                            isSorting={this.state.isSorting}
                            onSortEnd={this.handleOnSortEnd}
                            onSortStart={this.handleOnSortStart}
                            transitionDuration={0}
                            useDragHandle
                        />
                    </table>
                </ResponsiveTableWrapper>

                <p>
                    <button
                        className="btn btn-large btn-success"
                        disabled={this.state.starting}
                        onClick={this.startDraft}
                    >
                        Start Fantasy Draft
                    </button>
                </p>

                <span className="text-danger">
                    <b>Warning:</b> Once you start a fantasy draft, there is no
                    going back!
                </span>
            </>
        );
    }
}

FantasyDraft.propTypes = {
    phase: PropTypes.number.isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            tid: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default FantasyDraft;
