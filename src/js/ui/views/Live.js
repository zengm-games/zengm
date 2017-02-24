import classNames from 'classnames';
import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import {liveGame} from '../../util/actions';
import {NewWindowLink} from '../components';

const Live = ({games, gamesInProgress}) => {
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

Live.propTypes = {
    games: React.PropTypes.arrayOf(React.PropTypes.shape({
        awayName: React.PropTypes.string.isRequried,
        awayRegion: React.PropTypes.string.isRequried,
        gid: React.PropTypes.number.isRequried,
        highlight: React.PropTypes.bool.isRequried,
        homeName: React.PropTypes.string.isRequried,
        homeRegion: React.PropTypes.string.isRequried,
    })),
    gamesInProgress: React.PropTypes.bool,
};

export default Live;
