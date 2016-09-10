const React = require('react');
const DropdownButton = require('react-bootstrap/lib/DropdownButton');
const MenuItem = require('react-bootstrap/lib/MenuItem');
const g = require('../../globals');
const ui = require('../../ui');
const league = require('../../core/league');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, NewWindowLink, PlayerNameLabels} = require('../components');

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

        await g.dbl.tx("players", "readwrite", tx => {
            return tx.players.iterate(p => {
                if (p.watch) {
                    p.watch = false;
                    return p;
                }
            });
        });

        league.updateLastDbChange();
        ui.realtimeUpdate(["clearWatchList"]);

        this.setState({
            clearing: false,
        });
    }

    render() {
        const {players, playoffs, statType} = this.props;

        bbgmViewReact.title('Watch List');

        const cols = getCols('Name', 'Pos', 'Age', 'Team', 'Ovr', 'Pot', 'Contract', 'GP', 'Min', 'FG%', 'TP%', 'FT%', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'Pts', 'PER', 'EWA');

        // Number of decimals for many stats
        const d = statType === "totals" ? 0 : 1;

        const rows = players.map(p => {
            // HACKS to show right stats, info
            if (playoffs === "playoffs") {
                p.stats = p.statsPlayoffs;

                // If no playoff stats, blank them
                ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa"].forEach(category => {
                    if (p.stats[category] === undefined) {
                        p.stats[category] = 0;
                    }
                });
            }

            let contract;
            if (p.tid === g.PLAYER.RETIRED) {
                contract = "Retired";
            } else if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
                contract = `${p.draft.year} Draft Prospect`;
            } else {
                contract = `${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`;
            }

            return {
                key: p.pid,
                data: [
                    <PlayerNameLabels injury={p.injury} pid={p.pid} skills={p.ratings.skills} watch={p.watch}>{p.name}</PlayerNameLabels>,
                    p.ratings.pos,
                    p.age,
                    <a href={helpers.leagueUrl(["roster", p.abbrev])}>{p.abbrev}</a>,
                    p.ratings.ovr,
                    p.ratings.pot,
                    contract,
                    p.stats.gp, helpers.round(p.stats.min, d),
                    helpers.round(p.stats.fgp, 1),
                    helpers.round(p.stats.tpp, 1),
                    helpers.round(p.stats.ftp, 1),
                    helpers.round(p.stats.trb, d),
                    helpers.round(p.stats.ast, d),
                    helpers.round(p.stats.tov, d),
                    helpers.round(p.stats.stl, 1),
                    helpers.round(p.stats.blk, d),
                    helpers.round(p.stats.pts, d),
                    helpers.round(p.stats.per, 1),
                    helpers.round(p.stats.ewa, 1),
                ],
            };
        });

        return <div>
            <Dropdown view="watch_list" fields={['statTypes', 'playoffs']} values={[statType, playoffs]} />
            <div className="pull-right">
                <DropdownButton id="dropdown-other-reports" title="Other Reports">
                    <MenuItem href={helpers.leagueUrl(['player_stats', 'watch'])}>Player Stats</MenuItem>
                    <MenuItem href={helpers.leagueUrl(['player_ratings', 'watch'])}>Player Ratings</MenuItem>
                </DropdownButton>
            </div>
            <h1>Watch List <NewWindowLink /></h1>

            <p>Click the watch icon <span className="glyphicon glyphicon-flag" /> next to a player's name to add or remove him from this list.</p>

            <button className="btn btn-danger" disabled={this.state.clearing} onClick={this.clearWatchList}>Clear Watch List</button>

            <p className="clearfix" />

            <DataTable
                cols={cols}
                defaultSort={[0, 'asc']}
                pagination
                rows={rows}
            />
        </div>;
    }
}

WatchList.propTypes = {
    players: React.PropTypes.array.isRequired,
    playoffs: React.PropTypes.oneOf(['playoffs', 'regular_season']).isRequired,
    statType: React.PropTypes.oneOf(['per_36', 'per_game', 'totals']).isRequired,
};

module.exports = WatchList;
