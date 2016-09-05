const React = require('react');
const DropdownButton = require('react-bootstrap/lib/DropdownButton');
const MenuItem = require('react-bootstrap/lib/MenuItem');
const helpers = require('../../util/helpers');

module.exports = ({season}) => <div className="pull-right">
    <DropdownButton id="dropdown-jump-to" title="Jump To">
        <MenuItem href={helpers.leagueUrl(['standings', season])}>Standings</MenuItem>
        <MenuItem href={helpers.leagueUrl(['playoffs', season])}>Playoffs</MenuItem>
        <MenuItem href={helpers.leagueUrl(['history', season])}>Season Summary</MenuItem>
        <MenuItem href={helpers.leagueUrl(['league_finances', season])}>Finances</MenuItem>
        <MenuItem href={helpers.leagueUrl(['transactions', 'all', season])}>Transactions</MenuItem>
        <MenuItem href={helpers.leagueUrl(['draft_summary', season])}>Draft</MenuItem>
        <MenuItem href={helpers.leagueUrl(['leaders', season])}>Leaders</MenuItem>
        <MenuItem href={helpers.leagueUrl(['team_stats', season])}>Team Stats</MenuItem>
        <MenuItem href={helpers.leagueUrl(['player_stats', 'all', season])}>Player Stats</MenuItem>
        <MenuItem href={helpers.leagueUrl(['player_ratings', 'all', season])}>Player Ratings</MenuItem>
    </DropdownButton>
</div>;
