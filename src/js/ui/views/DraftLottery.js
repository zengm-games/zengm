// @flow

import classNames from "classnames";
import range from "lodash/range";
import PropTypes from "prop-types";
import * as React from "react";
import { helpers, setTitle, toWorker } from "../util";
import { DraftAbbrev, Dropdown, JumpTo, NewWindowLink } from "../components";
import type { DraftLotteryResultArray } from "../../common/types";

const getProbs = (result: DraftLotteryResultArray): (number | void)[][] => {
    const probs = [];

    const topThreeCombos = new Map();

    // Top three picks
    for (let i = 0; i < result.length; i++) {
        probs[i] = [];
        probs[i][0] = result[i].chances / 1000; // First pick
        probs[i][1] = 0; // Second pick
        probs[i][2] = 0; // Third pick
        for (let k = 0; k < result.length; k++) {
            if (k !== i) {
                probs[i][1] +=
                    ((result[k].chances / 1000) * result[i].chances) /
                    (1000 - result[k].chances);

                for (let l = 0; l < result.length; l++) {
                    if (l !== i && l !== k) {
                        const combosTemp =
                            ((result[k].chances / 1000) *
                                (result[l].chances /
                                    (1000 - result[k].chances)) *
                                result[i].chances) /
                            (1000 - result[k].chances - result[l].chances);
                        const topThreeKey = JSON.stringify([i, k, l].sort());
                        if (!topThreeCombos.has(topThreeKey)) {
                            topThreeCombos.set(topThreeKey, combosTemp);
                        } else {
                            topThreeCombos.set(
                                topThreeKey,
                                topThreeCombos.get(topThreeKey) + combosTemp,
                            );
                        }

                        probs[i][2] += combosTemp;
                    }
                }
            }
        }
    }

    // Fill in picks 4+
    for (let i = 0; i < result.length; i++) {
        const skipped = [0, 0, 0, 0]; // Probabilities of being "skipped" (lower prob team in top 3) 0/1/2/3 times

        for (const [key, prob] of topThreeCombos.entries()) {
            const inds = JSON.parse(key);
            let skipCount = 0;
            for (const ind of inds) {
                if (ind > i) {
                    skipCount += 1;
                }
            }
            if (!inds.includes(i)) {
                skipped[skipCount] += prob;
            }
        }

        // Fill in table after first 3 picks
        for (let j = 0; j < 4; j++) {
            if (i + j > 2 && i + j < result.length) {
                probs[i][i + j] = skipped[j];
            }
        }
    }

    return probs;
};

type Props = {
    result: DraftLotteryResultArray | void,
    season: number,
    type: "completed" | "projected" | "readyToRun",
    userTid: number,
};

type State = {
    result: DraftLotteryResultArray | void,
    started: boolean,
    toReveal: number[], // Values are indexes of this.props.result, starting with the 14th pick and ending with the 1st pick
    indRevealed: number,
};

class DraftLottery extends React.Component<Props, State> {
    componentIsMounted: boolean;

    constructor(props: Props) {
        super(props);

        this.state = {
            result: undefined,
            started: false,
            toReveal: [],
            indRevealed: -1,
        };
    }

    revealPick() {
        if (!this.componentIsMounted) {
            return;
        }

        this.setState(
            prevState => ({ indRevealed: prevState.indRevealed + 1 }),
            () => {
                if (this.state.indRevealed < this.state.toReveal.length - 1) {
                    setTimeout(() => {
                        this.revealPick();
                    }, 1000);
                }
            },
        );
    }

    async startLottery() {
        this.setState({
            started: true,
        });

        const result = await toWorker("draftLottery");

        const toReveal = [];
        for (let i = 0; i < result.length; i++) {
            const pick = result[i].pick;
            toReveal[pick - 1] = i;
            result[i].pick = undefined;
        }
        toReveal.reverse();

        this.setState(
            {
                result,
                toReveal,
                indRevealed: -1,
            },
            () => {
                this.revealPick();
            },
        );
    }

    componentDidMount() {
        this.componentIsMounted = true;
    }

    componentWillUnmount() {
        this.componentIsMounted = false;
    }

    render() {
        const { season, type, userTid } = this.props;
        const result =
            this.state.result !== undefined
                ? this.state.result
                : this.props.result;

        setTitle(`${season} Draft Lottery`);

        const probs = result !== undefined ? getProbs(result) : undefined;

        const NUM_PICKS = result !== undefined ? result.length : 14; // I don't think result can ever be undefined, but Flow does

        let table;
        if (result && probs) {
            // Checking both is redundant, but flow wants it
            table = (
                <div className="table-responsive">
                    <table className="table table-striped table-bordered table-sm table-hover">
                        <thead>
                            <tr>
                                <th colSpan="3" />
                                <th colSpan={NUM_PICKS} className="text-center">
                                    Pick Probabilities
                                </th>
                            </tr>
                            <tr>
                                <th>Team</th>
                                <th>Record</th>
                                <th>Chances</th>
                                {result.map((row, i) => (
                                    <th key={i}>{helpers.ordinal(i + 1)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {result.map(
                                (
                                    {
                                        tid,
                                        originalTid,
                                        chances,
                                        pick,
                                        won,
                                        lost,
                                    },
                                    i,
                                ) => {
                                    const pickCols = range(NUM_PICKS).map(j => {
                                        const prob = probs[i][j];
                                        const pct =
                                            prob !== undefined
                                                ? `${(prob * 100).toFixed(1)}%`
                                                : undefined;

                                        let highlighted = false;
                                        if (pick !== undefined) {
                                            highlighted = pick === j + 1;
                                        } else if (
                                            NUM_PICKS - 1 - j <=
                                            this.state.indRevealed
                                        ) {
                                            // Has this round been revealed?
                                            // Is this pick revealed?
                                            const ind = this.state.toReveal.findIndex(
                                                ind2 => ind2 === i,
                                            );
                                            if (ind === NUM_PICKS - 1 - j) {
                                                highlighted = true;
                                            }
                                        }

                                        return (
                                            <td
                                                className={classNames({
                                                    "table-success": highlighted,
                                                })}
                                                key={j}
                                            >
                                                {pct}
                                            </td>
                                        );
                                    });

                                    const row = (
                                        <tr key={originalTid}>
                                            <td
                                                className={classNames({
                                                    "table-info":
                                                        tid === userTid,
                                                })}
                                            >
                                                <DraftAbbrev
                                                    tid={tid}
                                                    originalTid={originalTid}
                                                    season={season}
                                                />
                                            </td>
                                            <td>
                                                <a
                                                    href={helpers.leagueUrl([
                                                        "standings",
                                                        season,
                                                    ])}
                                                >
                                                    {won}-{lost}
                                                </a>
                                            </td>
                                            <td>{chances}</td>
                                            {pickCols}
                                        </tr>
                                    );
                                    return row;
                                },
                            )}
                        </tbody>
                    </table>
                </div>
            );
        } else {
            table = <p>Can't find draft lottery results for {season}.</p>;
        }

        return (
            <>
                <Dropdown
                    view="draft_lottery"
                    fields={["seasons"]}
                    values={[season]}
                />
                <JumpTo season={season} />
                <h1>
                    {season} Draft Lottery <NewWindowLink />
                </h1>

                <p>
                    More:{" "}
                    <a href={helpers.leagueUrl(["draft_scouting"])}>
                        Future Draft Scouting
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["draft_summary", season])}>
                        Draft Summary
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["draft_team_history"])}>
                        Team History
                    </a>
                </p>

                {type === "projected" ? (
                    <p>
                        This is what the draft lottery probabilities would be if
                        the lottery was held right now.
                    </p>
                ) : null}

                {type === "readyToRun" && !this.state.started ? (
                    <p>
                        <button
                            className="btn btn-large btn-success"
                            onClick={() => this.startLottery()}
                        >
                            Start Draft Lottery
                        </button>
                    </p>
                ) : null}

                {table}
            </>
        );
    }
}

DraftLottery.propTypes = {
    result: PropTypes.arrayOf(
        PropTypes.shape({
            tid: PropTypes.number.isRequired,
            originalTid: PropTypes.number.isRequired,
            chances: PropTypes.number.isRequired,
            pick: PropTypes.number,
            won: PropTypes.number.isRequired,
            lost: PropTypes.number.isRequired,
        }),
    ),
    season: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default DraftLottery;
