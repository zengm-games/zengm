const Promise = require('bluebird');
const React = require('react');
const ui = require('../../ui');
const league = require('../../core/league');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');

const PopText = ({teams, tid}) => {
    let msg = <span>Region population: ?<br />Difficulty: ?</span>;
    if (tid >= 0) {
        const t = teams.find(t => t.tid === tid);
        if (t) {
            let difficulty;
            if (t.popRank <= 3) {
                difficulty = "very easy";
            } else if (t.popRank <= 8) {
                difficulty = "easy";
            } else if (t.popRank <= 16) {
                difficulty = "normal";
            } else if (t.popRank <= 24) {
                difficulty = "hard";
            } else {
                difficulty = "very hard";
            }

            msg = <span>Region population: {t.pop} million, #{t.popRank} leaguewide<br />Difficulty: {difficulty}</span>;
        }
    }

    return <span className="help-block">{msg}</span>;
};

class NewLeague extends React.Component {
    constructor(props) {
        super(props);

        const teams = helpers.getTeamsDefault();
        teams.unshift({
            tid: -1,
            region: "Random",
            name: "Team",
        });

        this.state = {
            creating: false,
            dirty: false,
            customize: 'random',
            invalidLeagueFile: false,
            name: props.name,
            randomizeRosters: false,
            teams,
            tid: props.lastSelectedTid,
        };

        this.handleCustomizeChange = this.handleCustomizeChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.dirty) {
            this.setState({
                name: nextProps.name,
                tid: nextProps.lastSelectedTid,
            });
        }
    }

    handleChange(name, e) {
        let val = e.target.value;
        if (name === 'tid') {
            val = parseInt(e.target.value, 10);
        } else if (name === 'randomizeRosters') {
            val = e.target.checked;
        }
console.log('handleChange', name, val);
        this.setState({
            dirty: true,
            [name]: val,
        });
    }

    handleCustomizeChange(e) {
        this.setState({
            customize: e.target.value,
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
//        this.setState({creating: true});

        let startingSeason = 2016;
        localStorage.lastSelectedTid = this.state.tid;

console.log(this.state.name, this.state.tid, 'leagueFile', startingSeason, this.state.randomizeRosters);
        let leagueFile;
/*        if (req.params.rosters === "custom-rosters") {
            const file = document.getElementById("custom-rosters-file").files[0];
            if (file !== undefined) {
                await new Promise((resolve, reject) => {
                    const reader = new window.FileReader();
                    reader.readAsText(file);
                    reader.onload = event => {
                        leagueFile = JSON.parse(event.target.result);
                        startingSeason = leagueFile.startingSeason !== undefined ? leagueFile.startingSeason : startingSeason;

                        resolve();
                    };
                    reader.onerror = event => {
                        console.log('error', event);
                        reject();
                    };
                    reader.onabort = event => {
                        console.log('abort', event);
                        reject();
                    };
                });
            }
        }

        const lid = await league.create(this.state.name, this.state.tid, leagueFile, startingSeason, randomizeRosters);
        ui.realtimeUpdate([], `/l/${lid}`, () => {
            // Show helpful information if this is the first league
            if (lid === 1) {
                ui.highlightPlayButton();
            }
        });*/
    }

    render() {
        const {creating, customize, invalidLeagueFile, name, randomizeRosters, teams, tid} = this.state;

        bbgmViewReact.title('Create New League');

        return <div>
            <h1>Create New League</h1>

            <form onSubmit={this.handleSubmit} data-no-davis="true">
                <div className="row">
                    <div className="form-group col-md-4 col-sm-5">
                        <label>League name</label>
                        <input className="form-control" type="text" value={name} onChange={this.handleChange.bind(this, 'name')} />
                    </div>

                    <div className="clearfix visible-xs"></div>

                    <div className="form-group col-md-4 col-sm-5">
                        <label>Which team do you want to manage?</label>
                        <select className="form-control" value={tid} onChange={this.handleChange.bind(this, 'tid')}>
                            {teams.map(t => {
                                return <option key={t.tid} value={t.tid}>
                                    {t.region} {t.name}
                                </option>;
                            })}
                        </select>
                        <PopText tid={tid} teams={teams} />
                    </div>

                    <div className="clearfix visible-sm"></div>

                    <div className="col-md-4 col-sm-5">
                        <div className="form-group">
                            <label>Customize</label>
                            <select
                                className="form-control"
                                onChange={this.handleCustomizeChange}
                                value={customize}
                            >
                                <option value="random">Random Players</option>
                                <option value="custom-rosters">Upload League File</option>
                            </select>
                            <span className="help-block">Teams in your new league can either be filled by randomly-generated players or by players from a <a href="https://basketball-gm.com/manual/customization/">custom League File</a> you upload.</span>
                        </div>
                        {
                            customize === 'custom-rosters'
                        ?
                            <div>
                                <div>
                                    <input type="file" name="custom-rosters" />
                                    {invalidLeagueFile ? <p className="text-danger" style={{marginTop: '1em'}}>Error: Invalid League File</p> : null}
                                </div>
                                <div className="checkbox">
                                    <label>
                                        <input onChange={this.handleChange.bind(this, 'randomizeRosters')} type="checkbox" value={randomizeRosters} /> Shuffle Rosters
                                    </label>
                                </div>
                            </div>
                        :
                            null
                        }

                    </div>

                    <div className="clearfix visible-xs"></div>

                    <div className="col-md-12 col-sm-5 text-center">
                        <div className="visible-sm invisible-xs"><br /><br /></div>
                        <button type="submit" className="btn btn-lg btn-primary" disabled={creating}>
                            Create New League
                        </button>
                    </div>
                </div>
            </form>
        </div>;
    }
}

module.exports = NewLeague;
