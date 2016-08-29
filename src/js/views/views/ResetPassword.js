const $ = require('jquery');
const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const bbgmViewReact = require('../../util/bbgmViewReact');

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

    componentDidMount() {
        // First, see if this is a valid token
        $.ajax({
            type: "POST",
            url: `//account.basketball-gm.${g.tld}/reset_password.php`,
            data: {action: "check_token", token: this.props.token, sport: g.sport},
            dataType: "json",
            xhrFields: {
                withCredentials: true,
            },
            success: data => {
                if (data.success) {
                    this.state = {
                        globalErrorMsg: null,
                        showForm: true,
                    };
                } else {
                    this.setState({
                        globalErrorMsg: <span>Invalid password reset token. <a href="/account/lost_password">Request another and try again.</a></span>,
                        showForm: false,
                    });
                }
            },
            error: () => {
                this.setState({
                    globalErrorMsg: ajaxErrorMsg,
                    showForm: false,
                });
            },
        });
    }

    handleSubmit(e) {
        e.preventDefault();

        this.setState({
            resetpwError: null,
            resetpwPasswordError: null,
            resetpwPassword2Error: null,
        });

        const $resetpw = $('#resetpw');

        $.ajax({
            type: "POST",
            url: `//account.basketball-gm.${g.tld}/reset_password.php`,
            data: `${$resetpw.serialize()}&sport=${g.sport}`,
            dataType: "json",
            xhrFields: {
                withCredentials: true,
            },
            success: data => {
                if (data.success) {
                    g.vm.topMenu.username(data.username);

                    ui.realtimeUpdate([], "/account");
                } else {
                    const updatedState = {
                        resetpwError: null,
                        resetpwPasswordError: null,
                        resetpwPassword2Error: null,
                    };

                    for (const error in data.errors) {
                        if (data.errors.hasOwnProperty(error)) {
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
                }
            },
            error: () => {
                this.setState({
                    resetpwError: ajaxErrorMsg,
                    resetpwPasswordError: null,
                    resetpwPassword2Error: null,
                });
            },
        });
    }

    render() {
        bbgmViewReact.title('Reset Password');

        const form = <div>
            <p>Enter a new password for your account below.</p>
            <form id="resetpw" onSubmit={this.handleSubmit} data-no-davis="true">
                <input type="hidden" name="action" value="reset_password" />
                <input type="hidden" name="token" value={this.props.token} />
                <div className="form-group">
                    <label className="control-label" htmlFor="resetpw-password">Password</label>
                    <input type="password" className="form-control" id="resetpw-password" name="password" required="required" />
                    <span className="help-block" id="resetpw-password-error"></span>
                </div>
                <div className="form-group">
                    <label className="control-label" htmlFor="resetpw-password2">Verify Password</label>
                    <input type="password" className="form-control" id="resetpw-password2" name="password2" required="required" />
                    <span className="help-block" id="resetpw-password2-error"></span>
                </div>
                <button type="submit" className="btn btn-default btn-primary">Reset Password</button>
                <p className="text-danger" style={{marginTop: '1em'}}>{this.state.resetpwError}</p>
            </form>
        </div>;

        return <div>
            <div className="row">
                <div className="col-lg-4 col-md-4 col-sm-3 hidden-xs"></div>
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

module.exports = ResetPassword;
