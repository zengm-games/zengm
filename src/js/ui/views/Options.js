import PropTypes from 'prop-types';
import React from 'react';
import {helpers} from '../../common';
import {HelpPopover, NewWindowLink} from '../components';
import {logEvent, setTitle, toWorker} from '../util';

class GodMode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dirty: false,
            autoDeleteOldBoxScores: props.autoDeleteOldBoxScores,
        };
        this.handleChanges = {
            autoDeleteOldBoxScores: this.handleChange.bind(this, 'autoDeleteOldBoxScores'),
        };
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.dirty) {
            this.setState({
                autoDeleteOldBoxScores: nextProps.autoDeleteOldBoxScores,
            });
        }
    }

    handleChange(name, e) {
        this.setState({
            dirty: true,
            [name]: e.target.value,
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        await toWorker('updateGameAttributes', {
            autoDeleteOldBoxScores: this.state.autoDeleteOldBoxScores === 'true',
        });

        this.setState({
            dirty: false,
        });

        logEvent({
            type: 'success',
            text: 'Options successfully updated.',
            saveToDb: false,
        });
    }

    render() {
        setTitle('Options');

        return <div>
            <h1>Options <NewWindowLink /></h1>

            <form onSubmit={this.handleFormSubmit}>
                <div className="row">
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Auto Delete Old Box Scores <HelpPopover placement="right" title="Injuries">
                        This will automatically delete box scores from previous seasons because box scores use a lot of disk space. See <a href={helpers.leagueUrl(['delete_old_data'])}>Delete Old Data</a> for more.
                        </HelpPopover></label>
                        <select className="form-control" onChange={this.handleChanges.autoDeleteOldBoxScores} value={this.state.autoDeleteOldBoxScores}>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
                </div>

                <button className="btn btn-primary">Save Options</button>
            </form>
        </div>;
    }
}

GodMode.propTypes = {
    autoDeleteOldBoxScores: PropTypes.bool.isRequired,
};

export default GodMode;
