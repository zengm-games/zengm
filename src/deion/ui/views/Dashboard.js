// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { DIFFICULTY } from "../../common";
import { setTitle } from "../util";

const difficultyText = (difficulty: number) => {
    let prevText: string | void;
    for (const [text, numeric] of Object.entries(DIFFICULTY)) {
        if (typeof numeric !== "number") {
            throw new Error("Should never happen");
        }

        if (difficulty === numeric) {
            return text;
        }

        // Iteration is in order, so if we're below the value, there will be no direct hit
        if (difficulty < numeric) {
            if (prevText !== undefined) {
                return `${prevText}+`;
            }
            return `${text}-`;
        }

        prevText = text;
    }

    if (prevText !== undefined) {
        return `${prevText}+`;
    }

    return "???";
};

const DifficultyText = ({ difficulty }: { difficulty: number | void }) => {
    if (difficulty === undefined) {
        return null;
    }

    return (
        <span
            className={classNames({
                "font-weight-bold": difficulty > DIFFICULTY.Insane,
                "text-danger": difficulty >= DIFFICULTY.Insane,
            })}
        >
            Difficulty: {difficultyText(difficulty)}
        </span>
    );
};

DifficultyText.propTypes = {
    difficulty: PropTypes.number,
};

type Props = {
    leagues: {
        lid: number,
        name: string,
        phaseText: string,
        teamName: string,
        teamRegion: string,
        difficulty?: number,
    }[],
};

class Dashboard extends React.Component<
    Props,
    {
        activeLid: number | void,
    },
> {
    constructor(props: Props) {
        super(props);
        this.state = {
            activeLid: undefined,
        };
    }

    setActiveLid(lid: number) {
        this.setState({
            activeLid: lid,
        });
    }

    render() {
        const { leagues } = this.props;

        setTitle("Dashboard");

        return (
            <>
                <ul className="dashboard-boxes">
                    {leagues.map(l => (
                        <li key={l.lid}>
                            <a
                                className={classNames(
                                    "btn btn-light-bordered league",
                                    {
                                        "league-active":
                                            l.lid === this.state.activeLid,
                                    },
                                )}
                                href={`/l/${l.lid}`}
                                onClick={() => this.setActiveLid(l.lid)}
                                title={`${l.lid}. ${l.name}`}
                            >
                                {l.lid !== this.state.activeLid ? (
                                    <div>
                                        <b>
                                            {l.lid}. {l.name}
                                        </b>
                                        <br />
                                        {l.teamRegion} {l.teamName}
                                        <br />
                                        {l.phaseText}
                                        <br />
                                        <DifficultyText
                                            difficulty={l.difficulty}
                                        />
                                    </div>
                                ) : (
                                    <div className="dashboard-box-loading">
                                        Loading...
                                    </div>
                                )}
                            </a>
                            <a
                                className="close"
                                href={`/delete_league/${l.lid}`}
                            >
                                &times;
                            </a>
                        </li>
                    ))}
                    <li className="dashboard-box-new">
                        <a
                            href="/new_league"
                            className="btn btn-primary league"
                        >
                            <h2>
                                Create new
                                <br />
                                league
                            </h2>
                        </a>
                    </li>
                    <li>
                        <a
                            href={`https://play.${
                                process.env.SPORT === "football"
                                    ? "basketball"
                                    : "football"
                            }-gm.com/`}
                            className="btn btn-light-bordered league"
                            style={{
                                backgroundImage: `url("https://play.${
                                    process.env.SPORT === "football"
                                        ? "basketball"
                                        : "football"
                                }-gm.com/ico/icon70.png")`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition:
                                    process.env.SPORT === "football"
                                        ? "100px 41px"
                                        : "75px 41px",
                                fontSize: "16px",
                            }}
                        >
                            {process.env.SPORT === "football"
                                ? "Play the original, Basketball GM!"
                                : "Try the brand new Football GM!"}
                        </a>
                    </li>
                </ul>
            </>
        );
    }
}

Dashboard.propTypes = {
    leagues: PropTypes.arrayOf(
        PropTypes.shape({
            difficulty: PropTypes.number,
            lid: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            phaseText: PropTypes.string.isRequired,
            teamName: PropTypes.string.isRequired,
            teamRegion: PropTypes.string.isRequired,
        }),
    ).isRequired,
};

export default Dashboard;
