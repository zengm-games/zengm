const React = require('react');
const helpers = require('../../util/helpers');

class SideMenu extends React.Component {
    shouldComponentUpdate(nextProps) {
        return this.props.pageId !== nextProps.pageId;
    }

    render() {
        const pageId = this.props.pageId;

        return <div className="bs-sidebar">
            <ul className="bs-sidenav nav">
                <li className={pageId === 'leagueDashboard' ? 'active' : null}><a href={helpers.leagueUrl([])}>Dashboard</a></li>
                <li className="bs-navheader">League</li>
                <li className={pageId === 'standings' ? 'active' : null}><a href={helpers.leagueUrl(['standings'])}>Standings</a></li>
                <li className={pageId === 'playoffs' ? 'active' : null}><a href={helpers.leagueUrl(['playoffs'])}>Playoffs</a></li>
                <li className={pageId === 'leagueFinances' ? 'active' : null}><a href={helpers.leagueUrl(['league_finances'])}>Finances</a></li>
                <li className={pageId === 'history' || pageId === 'historyAll' ? 'active' : null}><a href={helpers.leagueUrl(['history_all'])}>History</a></li>
                <li className={pageId === 'powerRankings' ? 'active' : null}><a href={helpers.leagueUrl(['power_rankings'])}>Power Rankings</a></li>
                <li className={pageId === 'transactions' ? 'active' : null}><a href={helpers.leagueUrl(['transactions', 'all'])}>Transactions</a></li>
                <li className="bs-navheader">Team</li>
                <li className={pageId === 'roster' ? 'active' : null}><a href={helpers.leagueUrl(['roster'])}>Roster</a></li>
                <li className={pageId === 'schedule' ? 'active' : null}><a href={helpers.leagueUrl(['schedule'])}>Schedule</a></li>
                <li className={pageId === 'teamFinances' ? 'active' : null}><a href={helpers.leagueUrl(['team_finances'])}>Finances</a></li>
                <li className={pageId === 'teamHistory' ? 'active' : null}><a href={helpers.leagueUrl(['team_history'])}>History</a></li>
                <li className="bs-navheader">Players</li>
                <li className={pageId === 'freeAgents' ? 'active' : null}><a href={helpers.leagueUrl(['free_agents'])}>Free Agents</a></li>
                <li className={pageId === 'trade' ? 'active' : null}><a href={helpers.leagueUrl(['trade'])}>Trade</a></li>
                <li className={pageId === 'tradingBlock' ? 'active' : null}><a href={helpers.leagueUrl(['trading_block'])}>Trading Block</a></li>
                <li className={pageId.includes('draft') ? 'active' : null}><a href={helpers.leagueUrl(['draft'])}>Draft</a></li>
                <li className={pageId === 'watchList' ? 'active' : null}><a href={helpers.leagueUrl(['watch_list'])}>Watch List</a></li>
                <li className={pageId === 'hallOfFame' ? 'active' : null}><a href={helpers.leagueUrl(['hall_of_fame'])}>Hall of Fame</a></li>
                <li className="bs-navheader">Stats</li>
                <li className={pageId === 'gameLog' ? 'active' : null}><a href={helpers.leagueUrl(['game_log'])}>Game Log</a></li>
                <li className={pageId === 'leaders' ? 'active' : null}><a href={helpers.leagueUrl(['leaders'])}>League Leaders</a></li>
                <li className={pageId === 'playerRatings' ? 'active' : null}><a href={helpers.leagueUrl(['player_ratings'])}>Player Ratings</a></li>
                <li className={pageId === 'playerStats' ? 'active' : null}><a href={helpers.leagueUrl(['player_stats'])}>Player Stats</a></li>
                <li className={pageId === 'teamStats' ? 'active' : null}><a href={helpers.leagueUrl(['team_stats'])}>Team Stats</a></li>
                <li className={pageId === 'playerFeats' ? 'active' : null}><a href={helpers.leagueUrl(['player_feats'])}>Statistical Feats</a></li>
            </ul>
        </div>;
    }
}

const LeagueWrapper = ({children, pageId}) => {
    return <div className="row">
        <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
            <SideMenu pageId={pageId} />
        </div>
        <div className="col-lg-10 col-xs-12 p402_premium" id="screenshot-league">
            {children}
        </div>
    </div>;
};

module.exports = LeagueWrapper;
