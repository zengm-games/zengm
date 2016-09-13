/* eslint react/jsx-no-bind: "off" */

import faces from 'facesjs';
import React from 'react';
import g from '../../globals';
import ui from '../../ui';
import league from '../../core/league';
import player from '../../core/player';
import bbgmViewReact from '../../util/bbgmViewReact';
import helpers from '../../util/helpers';
import {NewWindowLink, PlayerPicture} from '../components';

const positions = ["PG", "SG", "SF", "PF", "C", "G", "GF", "F", "FC"];
const faceOptions = {
    eyes: [0, 1, 2, 3],
    nose: [0, 1, 2],
    mouth: [0, 1, 2, 3, 4],
    hair: [0, 1, 2, 3, 4],
};

class CustomizePlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            appearanceOption: props.appearanceOption,
            saving: false,
            p: props.p,
        };
        this.handleChangeAppearanceOption = this.handleChangeAppearanceOption.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.randomizeFace = this.randomizeFace.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.setState({
            saving: true,
        });

        let p = this.state.p;

        // Fix draft season
        if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
            if (p.tid === g.PLAYER.UNDRAFTED) {
                p.draft.year = this.props.season;
            } else if (p.tid === g.PLAYER.UNDRAFTED_2) {
                p.draft.year = this.props.season + 1;
            } else if (p.tid === g.PLAYER.UNDRAFTED_3) {
                p.draft.year = this.props.season + 2;
            }

            // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
            if (g.phase >= g.PHASE.FREE_AGENCY) {
                p.draft.year += 1;
            }
        }

        // Set ovr, skills, and bound pot by ovr
        const r = p.ratings.length - 1;
        p.ratings[r].ovr = player.ovr(p.ratings[r]);
        p.ratings[r].skills = player.skills(p.ratings[r]);
        if (p.ratings[r].ovr > p.ratings[r].pot) {
            p.ratings[r].pot = p.ratings[r].ovr;
        }

        // If player was retired, add ratings (but don't develop, because that would change ratings)
        if (this.props.originalTid === g.PLAYER.RETIRED) {
            if (g.season - p.ratings[r].season > 0) {
                p = player.addRatingsRow(p, 15);
            }
        }

        // Only save image URL if it's selected
        if (this.state.appearanceOption !== "Image URL") {
            p.imgURL = "";
        }

        // If we are *creating* a player who is not a draft prospect, make sure he won't show up in the draft this year
        if (p.tid !== g.PLAYER.UNDRAFTED && p.tid !== g.PLAYER.UNDRAFTED_2 && p.tid !== g.PLAYER.UNDRAFTED_3 && g.phase < g.PHASE.FREE_AGENCY) {
            // This makes sure it's only for created players, not edited players
            if (!p.hasOwnProperty("pid")) {
                p.draft.year = g.season - 1;
            }
        }
        // Similarly, if we are editing a draft prospect and moving him to a team, make his draft year in the past
        if ((p.tid !== g.PLAYER.UNDRAFTED && p.tid !== g.PLAYER.UNDRAFTED_2 && p.tid !== g.PLAYER.UNDRAFTED_3) && (this.props.originalTid === g.PLAYER.UNDRAFTED || this.props.originalTid === g.PLAYER.UNDRAFTED_2 || this.props.originalTid === g.PLAYER.UNDRAFTED_3) && g.phase < g.PHASE.FREE_AGENCY) {
            p.draft.year = g.season - 1;
        }

        // Recalculate player values, since ratings may have changed
        p = await player.updateValues(null, p, []);
        let pid;
        await g.dbl.tx(["players", "playerStats"], "readwrite", async tx => {
            // Get pid (primary key) after add, but can't redirect to player page until transaction completes or else it's a race condition
            // When adding a player, this is the only way to know the pid
            pid = await tx.players.put(p);

            // Add regular season or playoffs stat row, if necessary
            if (p.tid >= 0 && p.tid !== this.props.originalTid && g.phase <= g.PHASE.PLAYOFFS) {
                p.pid = pid;

                // If it is the playoffs, this is only necessary if p.tid actually made the playoffs, but causes only cosmetic harm otherwise.
                p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);

                // Add back to database
                await tx.players.put(p);
            }
        });

        league.updateLastDbChange();
        ui.realtimeUpdate([], helpers.leagueUrl(["player", pid]));
    }

    handleChange(type, field, e) {
        let val = e.target.value;
        const p = this.state.p;

        if (type === 'root') {
            if (['hgt', 'tid', 'weight'].includes(field)) {
                val = parseInt(val, 10);
                if (isNaN(val)) {
                    return;
                }
            }

            p[field] = val;
        } else if (type === 'born') {
            if (field === 'year') {
                val = parseInt(val, 10);
                if (isNaN(val)) {
                    return;
                }
            }

            if (field === 'year') {
                p[type].year = g.season - val;
            } else {
                p[type][field] = val;
            }
        } else if (type === 'contract') {
            if (field === 'amount') {
                // Allow any value, even above or below normal limits, but round to $10k
                val = helpers.round(100 * parseFloat(val)) * 10;
                if (isNaN(val)) {
                    val = g.minContract;
                }
            } else if (field === 'exp') {
                val = parseInt(val, 10);
                if (isNaN(val)) {
                    return;
                }

                // No contracts expiring in the past
                if (val < this.props.season) {
                    val = this.props.season;
                }

                // If current season contracts already expired, then current season can't be allowed for new contract
                if (val === this.props.season && g.phase >= g.PHASE.RESIGN_PLAYERS) {
                    val += 1;
                }
            }

            p[type][field] = val;
        } else if (type === 'injury') {
            if (field === 'gamesRemaining') {
                val = parseInt(val, 10);
                if (isNaN(val) || val < 0) {
                    val = 0;
                }
            }

            p[type][field] = val;
        } else if (type === 'rating') {
            if (field !== 'pos') {
                val = helpers.bound(parseInt(val, 10), 0, 100);
                if (isNaN(val)) {
                    val = 0;
                }
            }

            p.ratings[p.ratings.length - 1][field] = val;
        } else if (type === 'face') {
            if (['eyes', 'hair', 'mouth', 'nose'].includes(field)) {
                val = parseInt(val, 10);
                if (isNaN(val)) {
                    return;
                }


                if (field === 'eyes') {
                    p[type][field][0].id = val;
                    p[type][field][1].id = val;
                } else {
                    p[type][field].id = val;
                }
            } else if (['eye-angle', 'fatness'].includes(field)) {
                val = parseFloat(val);
                if (isNaN(val)) {
                    return;
                }

                if (field === 'eye-angle') {
                    p[type].eyes[0].angle = val;
                    p[type].eyes[1].angle = val;
                } else {
                    p[type][field] = val;
                }
            } else if (field === 'color') {
                p[type][field] = val;
            } else if (field === 'nose-flip') {
                p[type].nose.flip = e.target.checked;
            }
        }


        this.setState({
            p,
        });
    }

    handleChangeAppearanceOption(e) {
        this.setState({
            appearanceOption: e.target.value,
        });
    }

    randomizeFace(e) {
        e.preventDefault(); // Don't submit whole form

        const face = faces.generate();

        // Round long decimals
        face.fatness = helpers.round(face.fatness, 2);
        face.eyes[0].angle = helpers.round(face.eyes[0].angle, 1);
        face.eyes[1].angle = helpers.round(face.eyes[1].angle, 1);

        this.state.p.face = face;
        this.setState({
            p: this.state.p,
        });
    }

    render() {
        const {godMode, originalTid, season, teams} = this.props;
        const {appearanceOption, p, saving} = this.state;

        const title = originalTid === undefined ? 'Create Player' : 'Edit Player';

        bbgmViewReact.title(title);

        if (!godMode) {
            return <div>
                <h1>Error</h1>
                <p>You can't customize players unless you enable <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a></p>
            </div>;
        }

        const age = season - p.born.year;

        const r = p.ratings.length - 1;

        let pictureDiv = null;
        if (appearanceOption === 'Cartoon Face') {
            pictureDiv = <div className="row">
                <div className="col-sm-4">
                    <div style={{maxHeight: '225px', maxWidth: '150px'}}>
                        <PlayerPicture face={p.face} />
                    </div>
                    <center>
                        <button className="btn btn-default" onClick={this.randomizeFace}>
                            Randomize
                        </button>
                    </center>
                </div>
                <div className="col-sm-8">
                    <div className="row">
                        <div className="col-xs-6 form-group">
                            <label>Width (0 to 1)</label>
                            <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'face', 'fatness')} value={p.face.fatness} />
                        </div>
                        <div className="col-xs-6 form-group">
                            <label>Skin Color</label>
                            <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'face', 'color')} value={p.face.color} />
                        </div>
                        <div className="col-xs-6 form-group">
                            <label>Eyes</label>
                            <select className="form-control" onChange={this.handleChange.bind(this, 'face', 'eyes')} value={p.face.eyes[0].id}>
                                {faceOptions.eyes.map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                        </div>
                        <div className="col-xs-6 form-group">
                            <label>Eye Angle (-20 to 30)</label>
                            <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'face', 'eye-angle')} value={p.face.eyes[0].angle} />
                        </div>
                        <div className="col-xs-6 form-group">
                            <label>Nose</label>
                            <select className="form-control" onChange={this.handleChange.bind(this, 'face', 'nose')} value={p.face.nose.id}>
                                {faceOptions.nose.map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                        </div>
                        <div className="col-xs-6 form-group">
                            <label>Nose Flip</label>
                            <input type="checkbox" className="form-control" onChange={this.handleChange.bind(this, 'face', 'nose-flip')} checked={p.face.nose.flip} />
                        </div>
                        <div className="col-xs-6 form-group">
                            <label>Mouth</label>
                            <select className="form-control" onChange={this.handleChange.bind(this, 'face', 'mouth')} value={p.face.mouth.id}>
                                {faceOptions.mouth.map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                        </div>
                        <div className="col-xs-6 form-group">
                            <label>Hair</label>
                            <select className="form-control" onChange={this.handleChange.bind(this, 'face', 'hair')} value={p.face.hair.id}>
                                {faceOptions.hair.map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>;
        } else {
            pictureDiv = <div className="form-group">
                <label>Image URL</label>
                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'root', 'imgURL')} value={p.imgURL} />
                <span className="help-block">Your image must be hosted externally. If you need to upload an image, try using <a href="http://imgur.com/">imgur</a>. For ideal display, crop your image so it has a 2:3 aspect ratio (such as 100px wide and 150px tall).</span>
            </div>;
        }

        return <div>
            <h1>{title} <NewWindowLink /></h1>

            <p>Here, you can {originalTid === null ? 'create a custom player with' : 'edit a player to have'} whatever attributes and ratings you want. If you want to make a whole league of custom players, you should probably create a <a href="https://basketball-gm.com/manual/customization/">custom League File</a>.</p>

            <form onSubmit={this.handleSubmit} data-no-davis="true">
                <div className="row">
                    <div className="col-md-7">
                        <h2>Attributes</h2>

                        <div className="row">
                            <div className="col-sm-3 form-group">
                                <label>First Name</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'root', 'firstName')} value={p.firstName} />
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Last Name</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'root', 'lastName')} value={p.lastName} />
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Age</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'born', 'year')} value={age} />
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Team</label>
                                <select className="form-control" onChange={this.handleChange.bind(this, 'root', 'tid')} value={p.tid}>
                                    {teams.map(t => {
                                        return <option key={t.tid} value={t.tid}>{t.text}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Height (inches)</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'root', 'hgt')} value={p.hgt} />
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Weight (lbs)</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'root', 'weight')} value={p.weight} />
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Position</label>
                                <select className="form-control" onChange={this.handleChange.bind(this, 'rating', 'pos')} value={p.ratings[r].pos}>
                                    {positions.map(pos => {
                                        return <option key={pos} value={pos}>{pos}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Hometown</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'born', 'loc')} value={p.born.loc} />
                            </div>
                            <div className="col-sm-6 form-group">
                                <label>Contract Amount</label>
                                <div className="input-group">
                                    <span className="input-group-addon">$</span>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'contract', 'amount')} value={p.contract.amount / 1000} />
                                    <span className="input-group-addon">M per year</span>
                                </div>
                            </div>
                            <div className="col-sm-6 form-group">
                                <label>Contract Expiration</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'contract', 'exp')} value={p.contract.exp} />
                            </div>
                            <div className="col-sm-6 form-group">
                                <label>Injury</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'injury', 'type')} value={p.injury.type} />
                            </div>
                            <div className="col-sm-3 form-group">
                                <label>Games Out</label>
                                <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'injury', 'gamesRemaining')} value={p.injury.gamesRemaining} />
                            </div>
                        </div>

                        <h2>Appearance</h2>

                        <div className="form-group">
                            <label>You can either create a cartoon face or specify the URL to an image.</label>
                            <select className="form-control" onChange={this.handleChangeAppearanceOption} style={{maxWidth: '150px'}} value={appearanceOption}>
                                <option value="Cartoon Face">Cartoon Face</option>
                                <option value="Image URL">Image URL</option>
                            </select>
                        </div>

                        {pictureDiv}
                    </div>

                    <div className="clearfix visible-sm visible-xs" />

                    <div className="col-md-5">
                        <h2>Ratings</h2>

                        <p>All ratings are on a scale of 0 to 100.</p>

                        <div className="row">
                            <div className="col-xs-4">
                                <div className="form-group">
                                    <label>Potential</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'pot')}value={p.ratings[r].pot} />
                                </div>
                            </div>
                            <div className="col-xs-8" />
                        </div>
                        <div className="row">
                            <div className="col-xs-4">
                                <h3>Physical</h3>
                                <div className="form-group">
                                    <label>Height</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'hgt')} value={p.ratings[r].hgt} />
                                </div>
                                <div className="form-group">
                                    <label>Strength</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'stre')} value={p.ratings[r].stre} />
                                </div>
                                <div className="form-group">
                                    <label>Speed</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'spd')} value={p.ratings[r].spd} />
                                </div>
                                <div className="form-group">
                                    <label>Jumping</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'jmp')} value={p.ratings[r].jmp} />
                                </div>
                                <div className="form-group">
                                    <label>Endurance</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'endu')} value={p.ratings[r].endu} />
                                </div>
                            </div>
                            <div className="col-xs-4">
                                <h3>Shooting</h3>
                                <div className="form-group">
                                    <label>Inside</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'ins')} value={p.ratings[r].ins} />
                                </div>
                                <div className="form-group">
                                    <label>Dunks/Layups</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'dnk')} value={p.ratings[r].dnk} />
                                </div>
                                <div className="form-group">
                                    <label>Free Throws</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'ft')} value={p.ratings[r].ft} />
                                </div>
                                <div className="form-group">
                                    <label>Two Pointers</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'fg')} value={p.ratings[r].fg} />
                                </div>
                                <div className="form-group">
                                    <label>Three Pointers</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'tp')} value={p.ratings[r].tp} />
                                </div>
                            </div>
                            <div className="col-xs-4">
                                <h3>Skill</h3>
                                <div className="form-group">
                                    <label>Blocks</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'blk')} value={p.ratings[r].blk} />
                                </div>
                                <div className="form-group">
                                    <label>Steals</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'stl')} value={p.ratings[r].stl} />
                                </div>
                                <div className="form-group">
                                    <label>Dribbling</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'drb')} value={p.ratings[r].drb} />
                                </div>
                                <div className="form-group">
                                    <label>Passing</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'pss')} value={p.ratings[r].pss} />
                                </div>
                                <div className="form-group">
                                    <label>Rebounding</label>
                                    <input type="text" className="form-control" onChange={this.handleChange.bind(this, 'rating', 'reb')} value={p.ratings[r].reb} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <br />
                <center>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                        {title}
                    </button>
                </center>
            </form>
        </div>;
    }
}

CustomizePlayer.propTypes = {
    appearanceOption: React.PropTypes.oneOf([
        'Cartoon Face',
        'Image URL',
    ]).isRequired,
    godMode: React.PropTypes.bool.isRequired,
    originalTid: React.PropTypes.number,
    p: React.PropTypes.object.isRequired,
    season: React.PropTypes.number.isRequired,
    teams: React.PropTypes.arrayOf(React.PropTypes.shape({
        text: React.PropTypes.string.isRequired,
        tid: React.PropTypes.number.isRequired,
    })).isRequired,
};

export default CustomizePlayer;
