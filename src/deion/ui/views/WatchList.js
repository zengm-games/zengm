import PropTypes from "prop-types";
import React from "react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import { PLAYER } from "../../common";
import { getCols, helpers, setTitle, toWorker } from "../util";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
    PlayerNameLabels,
    WatchBlock,
} from "../components";

class WatchList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clearing: false,
        };
        this.clearWatchList = this.clearWatchList.bind(this);
    }

    async clearWatchList() {
        this.setState({
            clearing: true,
        });

        await toWorker("clearWatchList");

        this.setState({
            clearing: false,
        });
    }

    render() {
        const { players, playoffs, statType, stats } = this.props;

        setTitle("Watch List");

        const cols = getCols(
            "",
            "Name",
            "Pos",
            "Age",
            "Team",
            "Ovr",
            "Pot",
            "Contract",
            ...stats.map(stat => `stat:${stat}`),
        );

        const rows = players.map(p => {
            let contract;
            if (p.tid === PLAYER.RETIRED) {
                contract = "Retired";
            } else if (p.tid === PLAYER.UNDRAFTED) {
                contract = `${p.draft.year} Draft Prospect`;
            } else {
                contract = `${helpers.formatCurrency(
                    p.contract.amount,
                    "M",
                )} thru ${p.contract.exp}`;
            }

            return {
                key: p.pid,
                data: [
                    <WatchBlock pid={p.pid} watch={p.watch} />,
                    <PlayerNameLabels
                        injury={p.injury}
                        pid={p.pid}
                        skills={p.ratings.skills}
                        watch={p.watch}
                    >
                        {p.name}
                    </PlayerNameLabels>,
                    p.ratings.pos,
                    p.age,
                    <a href={helpers.leagueUrl(["roster", p.abbrev])}>
                        {p.abbrev}
                    </a>,
                    p.ratings.ovr,
                    p.ratings.pot,
                    contract,
                    ...stats.map(stat =>
                        helpers.roundStat(
                            p.stats[stat],
                            stat,
                            statType === "totals",
                        ),
                    ),
                ],
            };
        });

        return (
            <>
                <Dropdown
                    view="watch_list"
                    fields={["statTypes", "playoffs"]}
                    values={[statType, playoffs]}
                />
                <UncontrolledDropdown className="float-right my-1">
                    <DropdownToggle caret className="btn-light-bordered">
                        Other Reports
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem
                            href={helpers.leagueUrl(["player_stats", "watch"])}
                        >
                            Player Stats
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl([
                                "player_ratings",
                                "watch",
                            ])}
                        >
                            Player Ratings
                        </DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
                <h1>
                    Watch List <NewWindowLink />
                </h1>

                <p>
                    Click the watch icon{" "}
                    <span className="glyphicon glyphicon-flag" /> to add or
                    remove a player from this list.
                </p>
                <p>
                    On other pages, you can find the watch icon by clicking the
                    info button <span className="glyphicon glyphicon-stats" />{" "}
                    next to a player's name.
                </p>

                <button
                    className="btn btn-danger mb-3"
                    disabled={this.state.clearing}
                    onClick={this.clearWatchList}
                >
                    Clear Watch List
                </button>

                <DataTable
                    cols={cols}
                    defaultSort={[5, "desc"]}
                    name="WatchList"
                    pagination
                    rows={rows}
                />
            </>
        );
    }
}

WatchList.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    statType: PropTypes.oneOf(["per36", "perGame", "totals"]).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default WatchList;
