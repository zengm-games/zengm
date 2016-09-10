const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');

const Dashboard = ({leagues, otherUrl}) => {
    bbgmViewReact.title('Dashboard');

    let otherUrlLink = null;
    if (otherUrl) {
        otherUrlLink = <div>
            <div className="clearfix" />
            <br /><br />
            <span className="alert alert-info"><a href={otherUrl}>Missing some leagues? Click here to find them.</a></span>
            <br /><br />
        </div>;
    }

    return <div>
        <ul className="dashboard-boxes">
            {leagues.map(l => <li key={l.lid}>
                <a className="btn btn-default league" href={`/l/${l.lid}`} title={`${l.lid}. ${l.name}`}>
                    <b>{l.lid}. {l.name}</b><br />
                    {l.teamRegion} {l.teamName}<br />
                    {l.phaseText}
                </a>
                <a className="close" href={`/delete_league/${l.lid}`}>&times;</a>
            </li>)}
            <li className="dashboard-box-new"><a href="/new_league" className="btn btn-primary league"><h2>Create new<br />league</h2></a></li>
        </ul>

        {otherUrlLink}
    </div>;
};

Dashboard.propTypes = {
    leagues: React.PropTypes.arrayOf(React.PropTypes.shape({
        lid: React.PropTypes.number.isRequired,
        name: React.PropTypes.string.isRequired,
        phaseText: React.PropTypes.string.isRequired,
        teamName: React.PropTypes.string.isRequired,
        teamRegion: React.PropTypes.string.isRequired,
    })).isRequired,
    otherUrl: React.PropTypes.string,
};

module.exports = Dashboard;
