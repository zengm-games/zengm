// @flow

import classNames from "classnames";
import range from "lodash/range";
import PropTypes from "prop-types";
import React from "react";
import {
    DraftAbbrev,
    Dropdown,
    JumpTo,
    NewWindowLink,
    ResponsiveTableWrapper,
} from "../components";
import { helpers, setTitle, toWorker } from "../util";
import type { DraftLotteryResultArray } from "../../common/types";

const getProbs = (
    result: DraftLotteryResultArray,
    draftType: "nba1994" | "nba2019",
): (number | void)[][] => {
    const probs = [];

    const topNCombos = new Map();

    const totalChances = result.reduce(
        (total, { chances }) => total + chances,
        0,
    );

    // Top N picks
    for (let i = 0; i < result.length; i++) {
        probs[i] = [];
        probs[i][0] = result[i].chances / totalChances; // First pick
        probs[i][1] = 0; // Second pick
        probs[i][2] = 0; // Third pick
        if (draftType === "nba2019") {
            probs[i][3] = 0; // Fourth pick
        }

        for (let k = 0; k < result.length; k++) {
            if (k !== i) {
                probs[i][1] +=
                    ((result[k].chances / totalChances) * result[i].chances) /
                    (totalChances - result[k].chances);

                for (let l = 0; l < result.length; l++) {
                    if (l !== i && l !== k) {
                        const combosTemp =
                            ((result[k].chances / totalChances) *
                                (result[l].chances /
                                    (totalChances - result[k].chances)) *
                                result[i].chances) /
                            (totalChances -
                                result[k].chances -
                                result[l].chances);
                        probs[i][2] += combosTemp;

                        if (draftType === "nba2019") {
                            // Go one level deeper
                            for (let m = 0; m < result.length; m++) {
                                if (m !== i && m !== k && m !== l) {
                                    const combosTemp2 =
                                        ((result[k].chances / totalChances) *
                                            (result[l].chances /
                                                (totalChances -
                                                    result[k].chances)) *
                                            (result[m].chances /
                                                (totalChances -
                                                    result[k].chances -
                                                    result[l].chances)) *
                                            result[i].chances) /
                                        (totalChances -
                                            result[k].chances -
                                            result[l].chances -
                                            result[m].chances);
                                    probs[i][3] += combosTemp2;
                                    const topFourKey = JSON.stringify(
                                        [i, k, l, m].sort(),
                                    );
                                    if (!topNCombos.has(topFourKey)) {
                                        topNCombos.set(topFourKey, combosTemp2);
                                    } else {
                                        topNCombos.set(
                                            topFourKey,
                                            topNCombos.get(topFourKey) +
                                                combosTemp2,
                                        );
                                    }
                                }
                            }
                        } else {
                            const topThreeKey = JSON.stringify(
                                [i, k, l].sort(),
                            );
                            if (!topNCombos.has(topThreeKey)) {
                                topNCombos.set(topThreeKey, combosTemp);
                            } else {
                                topNCombos.set(
                                    topThreeKey,
                                    topNCombos.get(topThreeKey) + combosTemp,
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // Fill in picks (N+1)+
    for (let i = 0; i < result.length; i++) {
        const skipped = [0, 0, 0, 0, 0]; // Probabilities of being "skipped" (lower prob team in top N) 0/1/2/3/4 times

        for (const [key, prob] of topNCombos.entries()) {
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

        // Fill in table after first N picks
        for (let j = 0; j < (draftType === "nba2019" ? 5 : 4); j++) {
            if (
                i + j > (draftType === "nba2019" ? 3 : 2) &&
                i + j < result.length
            ) {
                probs[i][i + j] = skipped[j];
            }
        }
    }

    return probs;
};

type Props = {
    draftType: "nba1994" | "nba2019" | "noLottery",
    result: DraftLotteryResultArray | void,
    season: number,
    ties: boolean,
    type: "completed" | "projected" | "readyToRun",
    userTid: number,
};

type State = {
    draftType: "nba1994" | "nba2019" | "noLottery" | void,
    result: DraftLotteryResultArray | void,
    season: number,
    started: boolean,
    toReveal: number[], // Values are indexes of this.props.result, starting with the 14th pick and ending with the 1st pick
    indRevealed: number,
};

class DraftLottery extends React.Component<Props, State> {
    componentIsMounted: boolean;

    constructor(props: Props) {
        super(props);

        this.state = {
            draftType: undefined,
            result: undefined,
            started: false,
            toReveal: [],
            indRevealed: -1,
            season: props.season,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.season !== prevState.season) {
            return {
                draftType: undefined,
                result: undefined,
                started: false,
                toReveal: [],
                indRevealed: -1,
                season: nextProps.season,
            };
        }

        return null;
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

        const { draftType, result } = await toWorker("draftLottery");

        const toReveal = [];
        for (let i = 0; i < result.length; i++) {
            const pick = result[i].pick;
            toReveal[pick - 1] = i;
            result[i].pick = undefined;
        }
        toReveal.reverse();

        this.setState(
            {
                draftType,
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
        const { season, ties, type, userTid } = this.props;

        setTitle(`${season} Draft Lottery`);

        const result =
            this.state.result !== undefined
                ? this.state.result
                : this.props.result;
        const draftType =
            this.state.draftType !== undefined
                ? this.state.draftType
                : this.props.draftType;

        const probs =
            result !== undefined &&
            (draftType === "nba2019" || draftType === "nba1994")
                ? getProbs(result, draftType)
                : undefined;

        const NUM_PICKS = result !== undefined ? result.length : 14; // I don't think result can ever be undefined, but Flow does

        let table;
        if (result && probs) {
            // Checking both is redundant, but flow wants it
            table = (
                <ResponsiveTableWrapper>
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
                                        tied,
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
                                                    {ties ? <>-{tied}</> : null}
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
                </ResponsiveTableWrapper>
            );
        } else {
            table = <p>No draft lottery results for {season}.</p>;
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
    draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery"]),
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
    ties: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default DraftLottery;
