import PropTypes from "prop-types";
import React from "react";
import {
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
} from "reactstrap";
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
        const { players, playoffs, statType } = this.props;

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
            "G",
            "Min",
            "FG%",
            "3P%",
            "FT%",
            "Reb",
            "Ast",
            "Tov",
            "Stl",
            "Blk",
            "Pts",
            "PER",
            "EWA",
        );

        // Number of decimals for many stats
        const d = statType === "totals" ? 0 : 1;

        const rows = players.map(p => {
            let contract;
            if (p.tid === PLAYER.RETIRED) {
                contract = "Retired";
            } else if (
                p.tid === PLAYER.UNDRAFTED ||
                p.tid === PLAYER.UNDRAFTED_2 ||
                p.tid === PLAYER.UNDRAFTED_3
            ) {
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
                    p.stats.gp,
                    p.stats.min.toFixed(d),
                    p.stats.fgp.toFixed(1),
                    p.stats.tpp.toFixed(1),
                    p.stats.ftp.toFixed(1),
                    p.stats.trb.toFixed(d),
                    p.stats.ast.toFixed(d),
                    p.stats.tov.toFixed(d),
                    p.stats.stl.toFixed(1),
                    p.stats.blk.toFixed(d),
                    p.stats.pts.toFixed(d),
                    p.stats.per.toFixed(1),
                    p.stats.ewa.toFixed(1),
                ],
            };
        });

        return (
            <div>
                <Dropdown
                    view="watch_list"
                    fields={["statTypes", "playoffs"]}
                    values={[statType, playoffs]}
                />
                <UncontrolledDropdown className="float-right">
                    <DropdownToggle caret className="btn-light">
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
                    className="btn btn-danger"
                    disabled={this.state.clearing}
                    onClick={this.clearWatchList}
                >
                    Clear Watch List
                </button>

                <p className="clearfix" />

                <DataTable
                    cols={cols}
                    defaultSort={[5, "desc"]}
                    name="WatchList"
                    pagination
                    rows={rows}
                />
            </div>
        );
    }
}

WatchList.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    statType: PropTypes.oneOf(["per36", "perGame", "totals"]).isRequired,
};

export default WatchList;
