import PropTypes from 'prop-types';
import React from 'react';
import {SPORT, fetchWrapper} from '../../common';
import {emitter, realtimeUpdate, setTitle} from '../util';

const ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

class ResetPassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            globalErrorMsg: 'Validating token...', // Because on initial page load you need AJAX request to see if it's valid
            resetpwError: null,
            resetpwPasswordError: null,
            resetpwPassword2Error: null,
            showForm: false,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    // I think the react/no-did-mount-set-state warning is a bug, it isn't considered bad practice to setState after
    // waiting for an HTTP request, just when used synchronously:
    // https://facebook.github.io/react/docs/react-component.html#componentdidmount
    /* eslint-disable react/no-did-mount-set-state */
    async componentDidMount() {
        // First, see if this is a valid token
        try {
            const data = await fetchWrapper({
                url: `//account.basketball-gm.${window.tld}/reset_password.php`,
                method: 'POST',
                data: {action: "check_token", token: this.props.token, sport: SPORT},
                credentials: 'include',
            });

            if (data.success) {
                this.setState({
                    globalErrorMsg: null,
                    showForm: true,
                });
            } else {
                this.setState({
                    globalErrorMsg: <span>Invalid password reset token. <a href="/account/lost_password">Request another and try again.</a></span>,
                    showForm: false,
                });
            }
        } catch (err) {
            this.setState({
                globalErrorMsg: ajaxErrorMsg,
                showForm: false,
            });
        }
    }
    /* eslint-enable react/no-did-mount-set-state */

    async handleSubmit(e) {
        e.preventDefault();

        this.setState({
            resetpwError: null,
            resetpwPasswordError: null,
            resetpwPassword2Error: null,
        });

        const formData = new FormData(document.getElementById('resetpw'));
        formData.set('sport', SPORT);

        try {
            const data = await fetchWrapper({
                url: `//account.basketball-gm.${window.tld}/reset_password.php`,
                method: 'POST',
                data: formData,
                credentials: 'include',
            });

            if (data.success) {
                emitter.emit('updateTopMenu', {username: data.username});

                realtimeUpdate([], "/account");
            } else {
                const updatedState = {
                    resetpwError: null,
                    resetpwPasswordError: null,
                    resetpwPassword2Error: null,
                };

                for (const error of Object.keys(data.errors)) {
                    if (error === "password") {
                        updatedState.resetpwPasswordError = data.errors[error];
                    } else if (error === "password2") {
                        updatedState.resetpwPassword2Error = data.errors[error];
                    } else if (error === "passwords") {
                        updatedState.resetpwPasswordError = updatedState.resetpwPasswordError === null ? '' : updatedState.resetpwPasswordError; // So it gets highlighted too
                        updatedState.resetpwPassword2Error = data.errors[error];
                    }
                }
            }
        } catch (err) {
            this.setState({
                resetpwError: ajaxErrorMsg,
                resetpwPasswordError: null,
                resetpwPassword2Error: null,
            });
        }
    }

    render() {
        setTitle('Reset Password');

        const form = <div>
            <p>Enter a new password for your account below.</p>
            <form id="resetpw" onSubmit={this.handleSubmit}>
                <input type="hidden" name="action" value="reset_password" />
                <input type="hidden" name="token" value={this.props.token} />
                <div className="form-group">
                    <label className="control-label" htmlFor="resetpw-password">Password</label>
                    <input type="password" className="form-control" id="resetpw-password" name="password" required="required" />
                    <span className="help-block" id="resetpw-password-error" />
                </div>
                <div className="form-group">
                    <label className="control-label" htmlFor="resetpw-password2">Verify Password</label>
                    <input type="password" className="form-control" id="resetpw-password2" name="password2" required="required" />
                    <span className="help-block" id="resetpw-password2-error" />
                </div>
                <button type="submit" className="btn btn-default btn-primary">Reset Password</button>
                <p className="text-danger" style={{marginTop: '1em'}}>{this.state.resetpwError}</p>
            </form>
        </div>;

        return <div>
            <div className="row">
                <div className="col-lg-4 col-md-4 col-sm-3 hidden-xs" />
                <div className="col-lg-4 col-md-4 col-sm-6">
                    <h1>Reset Password</h1>
                    {this.state.showForm ? form : null}
                    {this.state.globalErrorMsg ? <p>{this.state.globalErrorMsg}</p> : null}
                    <p>If you are having trouble with this, please <a href="mailto:commissioner@basketball-gm.com">email commissioner@basketball-gm.com</a>.</p>
                </div>
            </div>
        </div>;
    }
}

ResetPassword.propTypes = {
    token: PropTypes.string.isRequired,
};

export default ResetPassword;
