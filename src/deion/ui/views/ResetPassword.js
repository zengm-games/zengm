import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../common";
import { local, realtimeUpdate, setTitle } from "../util";

const ajaxErrorMsg =
    "Error connecting to server. Check your Internet connection or try again later.";

class ResetPassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            globalMessage: "Validating token...", // Because on initial page load you need AJAX request to see if it's valid
            errorMessageOverall: undefined,
            errorMessagePassword: undefined,
            errorMessagePassword2: undefined,
            showForm: false,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async componentDidMount() {
        // First, see if this is a valid token
        try {
            const data = await fetchWrapper({
                url: `${ACCOUNT_API_URL}/reset_password.php`,
                method: "POST",
                data: {
                    action: "check_token",
                    token: this.props.token,
                    sport: process.env.SPORT,
                },
                credentials: "include",
            });

            if (data.success) {
                this.setState({
                    globalMessage: undefined,
                    showForm: true,
                });
            } else {
                this.setState({
                    globalMessage: (
                        <>
                            Invalid password reset token.{" "}
                            <a href="/account/lost_password">
                                Request another and try again.
                            </a>
                        </>
                    ),
                    showForm: false,
                });
            }
        } catch (err) {
            this.setState({
                globalMessage: (
                    <span className="text-danger">{ajaxErrorMsg}</span>
                ),
                showForm: false,
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        this.setState({
            errorMessageOverall: undefined,
            errorMessagePassword: undefined,
            errorMessagePassword2: undefined,
        });

        const formData = new FormData(document.getElementById("resetpw"));

        try {
            const data = await fetchWrapper({
                url: `${ACCOUNT_API_URL}/reset_password.php`,
                method: "POST",
                data: formData,
                credentials: "include",
            });

            if (data.success) {
                local.update({ username: data.username });

                realtimeUpdate([], "/account");
            } else {
                const updatedState = {};

                for (const error of Object.keys(data.errors)) {
                    if (error === "password") {
                        updatedState.errorMessagePassword = data.errors[error];
                    } else if (error === "password2") {
                        updatedState.errorMessagePassword2 = data.errors[error];
                    } else if (error === "passwords") {
                        updatedState.errorMessagePassword =
                            updatedState.errorMessagePassword === undefined
                                ? ""
                                : updatedState.errorMessagePassword; // So it gets highlighted too
                        updatedState.errorMessagePassword2 = data.errors[error];
                    }
                }

                this.setState(updatedState);
            }
        } catch (err) {
            this.setState({
                errorMessageOverall: ajaxErrorMsg,
            });
        }
    }

    render() {
        setTitle("Reset Password");

        const form = (
            <div className="row">
                <div className="col-lg-4 col-md-5 col-sm-6">
                    <p>Enter a new password for your account below.</p>
                    <form id="resetpw" onSubmit={this.handleSubmit}>
                        <input
                            type="hidden"
                            name="sport"
                            value={process.env.SPORT}
                        />
                        <input
                            type="hidden"
                            name="action"
                            value="reset_password"
                        />
                        <input
                            type="hidden"
                            name="token"
                            value={this.props.token}
                        />
                        <div
                            className={classNames("form-group", {
                                "text-danger":
                                    this.state.errorMessagePassword !==
                                    undefined,
                            })}
                        >
                            <label
                                className="col-form-label"
                                htmlFor="resetpw-password"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                className={classNames("form-control", {
                                    "is-invalid":
                                        this.state.errorMessagePassword !==
                                        undefined,
                                })}
                                id="resetpw-password"
                                name="password"
                                required="required"
                            />
                            <span className="form-text">
                                {this.state.errorMessagePassword}
                            </span>
                        </div>
                        <div
                            className={classNames("form-group", {
                                "text-danger":
                                    this.state.errorMessagePassword2 !==
                                    undefined,
                            })}
                        >
                            <label
                                className="col-form-label"
                                htmlFor="resetpw-password2"
                            >
                                Verify Password
                            </label>
                            <input
                                type="password"
                                className={classNames("form-control", {
                                    "is-invalid":
                                        this.state.errorMessagePassword2 !==
                                        undefined,
                                })}
                                id="resetpw-password2"
                                name="password2"
                                required="required"
                            />
                            <span className="form-text">
                                {this.state.errorMessagePassword2}
                            </span>
                        </div>
                        <button type="submit" className="btn btn-primary">
                            Reset Password
                        </button>
                        <p className="text-danger mt-3">
                            {this.state.errorMessageOverall}
                        </p>
                    </form>
                </div>
            </div>
        );

        return (
            <>
                <h1>Reset Password</h1>
                {this.state.showForm ? form : null}
                {this.state.globalMessage ? (
                    <p>{this.state.globalMessage}</p>
                ) : null}
                <p>
                    If you are having trouble with this, please{" "}
                    <a href="mailto:commissioner@basketball-gm.com">
                        email commissioner@basketball-gm.com
                    </a>
                    .
                </p>
            </>
        );
    }
}

ResetPassword.propTypes = {
    token: PropTypes.string.isRequired,
};

export default ResetPassword;
