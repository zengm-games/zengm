const React = require('react');
const helpers = require('../../util/helpers');

module.exports = ({season}) => <div className="btn-group pull-right">
    <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
        Jump To <span className="caret"></span>
    </button>
    <ul className="dropdown-menu">
        <li><a href={helpers.leagueUrl(['standings', season])}>Standings</a></li>
        <li><a href={helpers.leagueUrl(['playoffs', season])}>Playoffs</a></li>
        <li><a href={helpers.leagueUrl(['history', season])}>Season Summary</a></li>
        <li><a href={helpers.leagueUrl(['league_finances', season])}>Finances</a></li>
        <li><a href={helpers.leagueUrl(['transactions', 'all', season])}>Transactions</a></li>
        <li><a href={helpers.leagueUrl(['draft_summary', season])}>Draft</a></li>
        <li><a href={helpers.leagueUrl(['leaders', season])}>Leaders</a></li>
        <li><a href={helpers.leagueUrl(['team_stats', season])}>Team Stats</a></li>
        <li><a href={helpers.leagueUrl(['player_stats', 'all', season])}>Player Stats</a></li>
        <li><a href={helpers.leagueUrl(['player_ratings', 'all', season])}>Player Ratings</a></li>
    </ul>
</div>;
