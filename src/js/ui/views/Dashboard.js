// @flow

import classNames from 'classnames';
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
                        disabled={this.state.activeLid !== undefined}
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
                    disabled={this.state.activeLid !== undefined}
                ><h2>Create new<br />league</h2></a></li>
            </ul>
        </div>;
    }
}

Dashboard.propTypes = {
    leagues: React.PropTypes.arrayOf(React.PropTypes.shape({
        lid: React.PropTypes.number.isRequired,
        name: React.PropTypes.string.isRequired,
        phaseText: React.PropTypes.string.isRequired,
        teamName: React.PropTypes.string.isRequired,
        teamRegion: React.PropTypes.string.isRequired,
    })).isRequired,
};

export default Dashboard;
