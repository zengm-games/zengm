import React from 'react';
import {helpers} from '../../common';
import {DataTable, NewWindowLink, PlayerNameLabels} from '../components';
import {getCols, setTitle, toWorker} from '../util';

class DraftScouting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customize: undefined,
        };
    }

    handleCustomize(i) {
        this.setState({
            customize: i,
        });
    }

    handleDraftClass(seasonOffset, e) {
        const file = e.target.files[0];

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = async event => {
            const uploadedFile = JSON.parse(event.target.result);

            await toWorker('handleUploadedDraftClass', uploadedFile, seasonOffset);

            this.setState({
                customize: undefined,
            });
        };
    }

    render() {
        const {seasons} = this.props;

        setTitle('Draft Scouting');

        const cols = getCols('#', 'Name', 'Pos', 'Age', 'Ovr', 'Pot');

        return <div>
            <h1>Draft Scouting <NewWindowLink /></h1>

            <p>More: <a href={helpers.leagueUrl(['draft_summary'])}>Old Draft Summaries</a></p>

            <p>The ratings shown are your scouts' projections for what the players' ratings will be when they enter the draft. The further in the future, the more uncertainty there is in their estimates.</p>

            <div className="row">
                {seasons.map((s, i) => {
                    const rows = s.players.map(p => {
                        return {
                            key: p.pid,
                            data: [
                                p.rank,
                                <PlayerNameLabels
                                    pid={p.pid}
                                    skills={p.skills}
                                    watch={p.watch}
                                    ratings={p.ratings}
                                >{p.name}</PlayerNameLabels>,
                                p.pos,
                                p.age,
                                p.ovr,
                                p.pot,
                            ],
                        };
                    });

                    return <div key={s.season} className="col-md-4 col-sm-6">
                        <h2>{s.season}</h2>

                        {this.state.customize === i ? <div>
                            <p>To replace this draft class with players from a <a href="https://basketball-gm.com/manual/customization/draft-class/" rel="noopener noreferrer" target="_blank">custom draft class file</a>, select the file below.</p>
                            <p><input type="file" className="custom-draft-class" onChange={e => this.handleDraftClass(i, e)} /></p>
                        </div> : <p>
                            <button className="btn btn-default btn-xs" onClick={() => this.handleCustomize(i)}>
                            Customize</button>
                        </p>}

                        <DataTable
                            cols={cols}
                            defaultSort={[0, 'asc']}
                            name={`DraftScouting:${i}`}
                            rows={rows}
                        />
                    </div>;
                })}
            </div>
        </div>;
    }
}

DraftScouting.propTypes = {
    seasons: React.PropTypes.arrayOf(React.PropTypes.shape({
        players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
        season: React.PropTypes.number.isRequired,
    })).isRequired,
};

export default DraftScouting;
