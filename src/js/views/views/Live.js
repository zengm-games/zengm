const classNames = require('classnames');
const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const {liveGame} = require('../../util/actions');
const {NewWindowLink} = require('../components');

const Live = ({games = [], gamesInProgress}) => {
    bbgmViewReact.title('Live Game Simulation');

    return <div>
        <h1>Live Game Simulation <NewWindowLink /></h1>

        <p>To view a live play-by-play summary of a game, select one of tomorrow's games below.</p>

        {gamesInProgress ? <p className="text-danger">Stop the current game simulation to select a play-by-play game.</p> : null}

        {games.map(gm => {
            return <button
                key={gm.gid}
                className={classNames('btn', 'btn-default', {'btn-success': gm.highlight})}
                disabled={gamesInProgress}
                onClick={() => liveGame(gm.gid)}
                style={{float: 'left', margin: '0 1em 1em 0'}}
            >
                {gm.awayRegion} {gm.awayName} at<br />
                {gm.homeRegion} {gm.homeName}
            </button>;
        })}
    </div>;
};

module.exports = Live;
