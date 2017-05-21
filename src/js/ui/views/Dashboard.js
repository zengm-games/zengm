// @flow

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {setTitle} from '../util';

type Props = {
    leagues: {
        lid: number,
        name: string,
        phaseText: string,
        teamName: string,
        teamRegion: string,
    }[]
};

class Dashboard extends React.Component {
    props: Props;

    state: {
        activeLid: number | void,
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            activeLid: undefined,
        };
    }

    setActiveLid(lid: number) {
        this.setState({
            activeLid: lid,
        });
    }

    render() {
        const {leagues} = this.props;

        setTitle('Dashboard');

        return <div>
            <ul className="dashboard-boxes">
                {leagues.map(l => <li key={l.lid}>
                    <a
                        className={classNames('btn btn-default league', {'league-active': l.lid === this.state.activeLid})}
                        href={`/l/${l.lid}`}
                        onClick={() => this.setActiveLid(l.lid)}
                        title={`${l.lid}. ${l.name}`}
                    >
                        {
                            l.lid !== this.state.activeLid
                        ?
                            <div>
                                <b>{l.lid}. {l.name}</b><br />
                                {l.teamRegion} {l.teamName}<br />
                                {l.phaseText}
                            </div>
                        :
                            <div>
                                <br />
                                <b>Loading...</b><br />
                            </div>
                        }
                    </a>
                    <a className="close" href={`/delete_league/${l.lid}`}>&times;</a>
                </li>)}
                <li className="dashboard-box-new"><a
                    href="/new_league"
                    className="btn btn-primary league"
                ><h2>Create new<br />league</h2></a></li>
            </ul>
        </div>;
    }
}

Dashboard.propTypes = {
    leagues: PropTypes.arrayOf(PropTypes.shape({
        lid: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        phaseText: PropTypes.string.isRequired,
        teamName: PropTypes.string.isRequired,
        teamRegion: PropTypes.string.isRequired,
    })).isRequired,
};

export default Dashboard;
