// @flow

import classNames from "classnames";
import React from "react";
import { SPORT, fetchWrapper } from "../../../common";
import { local, realtimeUpdate, setTitle, toWorker } from "../../util";

type Props = {
    ajaxErrorMsg: string,
};

type State = {
    errorMessageEmail: string | void,
    errorMessageOverall: string | void,
    errorMessagePassword: string | void,
    errorMessagePassword2: string | void,
    errorMessageUsername: string | void,
};

class Register extends React.Component<Props, State> {
    handleSubmit: Function;

    constructor(props: Props) {
        super(props);
        this.state = {
            errorMessageEmail: undefined,
            errorMessageOverall: undefined,
            errorMessagePassword: undefined,
            errorMessagePassword2: undefined,
            errorMessageUsername: undefined,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();

        this.setState({
            errorMessageEmail: undefined,
            errorMessageOverall: undefined,
            errorMessagePassword: undefined,
            errorMessagePassword2: undefined,
            errorMessageUsername: undefined,
        });

        const formData = new FormData(document.getElementById("register"));

        try {
            const data = await fetchWrapper({
                url: `//account.basketball-gm.${window.tld}/register.php`,
                method: "POST",
                data: formData,
                credentials: "include",
            });

            if (data.success) {
                local.update({ username: data.username });

                await toWorker("checkParticipationAchievement", true);
                realtimeUpdate([], "/account");
            } else {
                const updatedState = {};

                for (const error of Object.keys(data.errors)) {
                    if (error === "username") {
                        updatedState.errorMessageUsername = data.errors[error];
                    } else if (error === "email") {
                        updatedState.errorMessageEmail = data.errors[error];
                    } else if (error === "password") {
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
                errorMessageOverall: this.props.ajaxErrorMsg,
            });
        }
    }

    render() {
        setTitle("Login or Register");

        return (
            <>
                <h1>Register</h1>
                <form onSubmit={this.handleSubmit} id="register">
                    <input type="hidden" name="sport" value={SPORT} />
                    <div
                        className={classNames("form-group", {
                            "has-error":
                                this.state.errorMessageUsername !== null,
                        })}
                    >
                        <label htmlFor="register-username">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="register-username"
                            name="username"
                            required="required"
                            maxLength="15"
                            pattern="[A-Za-z-0-9-_]+"
                            title="Letters, numbers, dashes (-), and underscores (_) only"
                        />
                        <span className="form-text text-muted">
                            Letters, numbers, dashes (-), and underscores (_)
                            only. Max 15 characters.
                        </span>
                        <span className="form-text text-danger">
                            {this.state.errorMessageUsername}
                        </span>
                    </div>
                    <div
                        className={classNames("form-group", {
                            "has-error": this.state.errorMessageEmail !== null,
                        })}
                    >
                        <label htmlFor="register-email">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            id="register-email"
                            name="email"
                            required="required"
                        />
                        <span className="form-text text-danger">
                            {this.state.errorMessageEmail}
                        </span>
                    </div>
                    <div
                        className={classNames("form-group", {
                            "has-error":
                                this.state.errorMessagePassword !== null,
                        })}
                    >
                        <label htmlFor="register-password">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="register-password"
                            name="password"
                            required="required"
                        />
                        <span className="form-text text-danger">
                            {this.state.errorMessagePassword}
                        </span>
                    </div>
                    <div
                        className={classNames("form-group", {
                            "has-error":
                                this.state.errorMessagePassword2 !== null,
                        })}
                    >
                        <label htmlFor="register-password2">
                            Verify Password
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="register-password2"
                            name="password2"
                            required="required"
                        />
                        <span className="form-text text-danger">
                            {this.state.errorMessagePassword2}
                        </span>
                    </div>
                    <div className="form-group form-check">
                        <input
                            type="checkbox"
                            defaultChecked="checked"
                            className="form-check-input"
                            id="register-mailinglist"
                        />
                        <label
                            className="form-check-label"
                            htmlFor="register-mailinglist"
                        >
                            Join BBGM Mailing List (Only major announcements,
                            about once/year)
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-light-bordered btn-primary"
                    >
                        Create New Account
                    </button>
                    <p className="text-danger mt-3">
                        {this.state.errorMessageOverall}
                    </p>
                </form>
            </>
        );
    }
}

export default Register;
