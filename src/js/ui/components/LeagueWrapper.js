// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import { helpers } from "../util";

type Props = {
    lid: number | void,
    pageId: string,
};

class SideMenu extends React.Component<Props> {
    shouldComponentUpdate(nextProps) {
        return (
            this.props.pageId !== nextProps.pageId ||
            this.props.lid !== nextProps.lid
        );
    }

    render() {
        const pageId = this.props.pageId;

        return (
            <div className="bg-light sidebar">
                <div className="sidebar-sticky">
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "leagueDashboard",
                                })}
                                href={helpers.leagueUrl([])}
                            >
                                Dashboard
                            </a>
                        </li>
                    </ul>
                    <h6 className="sidebar-heading px-3">League</h6>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "standings",
                                })}
                                href={helpers.leagueUrl(["standings"])}
                            >
                                Standings
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "playoffs",
                                })}
                                href={helpers.leagueUrl(["playoffs"])}
                            >
                                Playoffs
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "leagueFinances",
                                })}
                                href={helpers.leagueUrl(["league_finances"])}
                            >
                                Finances
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active:
                                        pageId === "history" ||
                                        pageId === "historyAll",
                                })}
                                href={helpers.leagueUrl(["history_all"])}
                            >
                                History
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "powerRankings",
                                })}
                                href={helpers.leagueUrl(["power_rankings"])}
                            >
                                Power Rankings
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "transactions",
                                })}
                                href={helpers.leagueUrl([
                                    "transactions",
                                    "all",
                                ])}
                            >
                                Transactions
                            </a>
                        </li>
                    </ul>
                    <h6 className="sidebar-heading">Team</h6>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "roster",
                                })}
                                href={helpers.leagueUrl(["roster"])}
                            >
                                Roster
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "schedule",
                                })}
                                href={helpers.leagueUrl(["schedule"])}
                            >
                                Schedule
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "teamFinances",
                                })}
                                href={helpers.leagueUrl(["team_finances"])}
                            >
                                Finances
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "teamHistory",
                                })}
                                href={helpers.leagueUrl(["team_history"])}
                            >
                                History
                            </a>
                        </li>
                    </ul>
                    <h6 className="sidebar-heading">Players</h6>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "freeAgents",
                                })}
                                href={helpers.leagueUrl(["free_agents"])}
                            >
                                Free Agents
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "trade",
                                })}
                                href={helpers.leagueUrl(["trade"])}
                            >
                                Trade
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "tradingBlock",
                                })}
                                href={helpers.leagueUrl(["trading_block"])}
                            >
                                Trading Block
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId.includes("draft"),
                                })}
                                href={helpers.leagueUrl(["draft"])}
                            >
                                Draft
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "watchList",
                                })}
                                href={helpers.leagueUrl(["watch_list"])}
                            >
                                Watch List
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "hallOfFame",
                                })}
                                href={helpers.leagueUrl(["hall_of_fame"])}
                            >
                                Hall of Fame
                            </a>
                        </li>
                    </ul>
                    <h6 className="sidebar-heading">Stats</h6>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "gameLog",
                                })}
                                href={helpers.leagueUrl(["game_log"])}
                            >
                                Game Log
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "leaders",
                                })}
                                href={helpers.leagueUrl(["leaders"])}
                            >
                                League Leaders
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "playerRatings",
                                })}
                                href={helpers.leagueUrl(["player_ratings"])}
                            >
                                Player Ratings
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "playerStats",
                                })}
                                href={helpers.leagueUrl(["player_stats"])}
                            >
                                Player Stats
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "teamStats",
                                })}
                                href={helpers.leagueUrl(["team_stats"])}
                            >
                                Team Stats
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={classNames("nav-link", {
                                    active: pageId === "playerFeats",
                                })}
                                href={helpers.leagueUrl(["player_feats"])}
                            >
                                Statistical Feats
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

SideMenu.propTypes = {
    lid: PropTypes.number,
    pageId: PropTypes.string.isRequired,
};

const LeagueWrapper = ({
    children,
    lid,
    pageId,
}: {
    children: React.Element<any>,
    lid: number | void,
    pageId: string,
}) => {
    return (
        <div className="row">
            <div className="col-xl-2 d-none d-xl-block">
                <SideMenu lid={lid} pageId={pageId} />
            </div>
            <div
                className="col-xl-10 col-12 p402_premium"
                id="screenshot-league"
            >
                {children}
            </div>
        </div>
    );
};

LeagueWrapper.propTypes = {
    children: PropTypes.any.isRequired,
    lid: PropTypes.number,
    pageId: PropTypes.string.isRequired,
};

export default LeagueWrapper;
