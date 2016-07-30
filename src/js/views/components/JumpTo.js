const React = require('react');
const LeagueLink = require('./LeagueLink');

module.exports = ({season}) => <div className="btn-group pull-right">
    <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
        Jump To <span className="caret"></span>
    </button>
    <ul className="dropdown-menu">
        <li><LeagueLink parts={['standings', season]}>Standings</LeagueLink></li>
        <li><LeagueLink parts={['playoffs', season]}>Playoffs</LeagueLink></li>
        <li><LeagueLink parts={['history', season]}>Season Summary</LeagueLink></li>
        <li><LeagueLink parts={['league_finances', season]}>Finances</LeagueLink></li>
        <li><LeagueLink parts={['transactions', 'all', season]}>Transactions</LeagueLink></li>
        <li><LeagueLink parts={['draft_summary', season]}>Draft</LeagueLink></li>
        <li><LeagueLink parts={['leaders', season]}>Leaders</LeagueLink></li>
        <li><LeagueLink parts={['team_stats', season]}>Team Stats</LeagueLink></li>
        <li><LeagueLink parts={['player_stats', 'all', season]}>Player Stats</LeagueLink></li>
        <li><LeagueLink parts={['player_ratings', 'all', season]}>Player Ratings</LeagueLink></li>
    </ul>
</div>;
