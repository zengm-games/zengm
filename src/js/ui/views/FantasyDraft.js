import PropTypes from 'prop-types';
import React from 'react';
import {PHASE} from '../../common';
import {NewWindowLink} from '../components';
import {setTitle, toWorker} from '../util';

class FantasyDraft extends React.Component {
    constructor(props) {
        super(props);
        this.startDraft = this.startDraft.bind(this);
        this.handlePositionChange = this.handlePositionChange.bind(this);

        this.state = {
            position: 'random',
            starting: false,
        };
    }

    startDraft() {
        this.setState({starting: true});
        toWorker('startFantasyDraft', this.state.position);
    }

    handlePositionChange(event) {
        const position = event.target.value === 'random' ? 'random' : parseInt(event.target.value, 10);
        this.setState({position});
    }

    render() {
        setTitle('Fantasy Draft');

        if (this.props.phase === PHASE.DRAFT) {
            return <div>
                <h1>Error</h1>
                <p>You can't start a fantasy draft while a regular draft is already in progress.</p>
            </div>;
        }

        return <div>
            <h1>Fantasy Draft <NewWindowLink /></h1>

            <p>In a "fantasy draft", all non-retired players are put into one big pool and teams take turns drafting players, similar to a fantasy basketball draft. At the beginning of the draft, the order of picks is randomized. During the draft, the order of picks snakes (reverses every other round). For example, the team that picks first in the first round picks last in the second round.</p>

            <p>To make things as fair as possible, all traded draft picks will be returned to their original owners after the fantasy draft.</p>

            <div className="form-group">
                <label htmlFor="position">What position do you want in the draft?</label>
                <select name="position" className="form-control" style={{width: '110px'}} onChange={this.handlePositionChange} value={this.state.position}>
                    <option value="random">Random</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="13">13</option>
                    <option value="14">14</option>
                    <option value="15">15</option>
                    <option value="16">16</option>
                    <option value="17">17</option>
                    <option value="18">18</option>
                    <option value="19">19</option>
                    <option value="20">20</option>
                    <option value="21">21</option>
                    <option value="22">22</option>
                    <option value="23">23</option>
                    <option value="24">24</option>
                    <option value="25">25</option>
                    <option value="26">26</option>
                    <option value="27">27</option>
                    <option value="28">28</option>
                    <option value="29">29</option>
                    <option value="30">30</option>
                </select>
            </div>
            <p>
                <button
                    className="btn btn-large btn-success"
                    disabled={this.state.starting}
                    onClick={this.startDraft}
                >Start Fantasy Draft</button>
            </p>

            <span className="text-danger"><b>Warning:</b> Once you start a fantasy draft, there is no going back!</span>
        </div>;
    }
}

FantasyDraft.propTypes = {
    phase: PropTypes.number.isRequired,
};

export default FantasyDraft;
