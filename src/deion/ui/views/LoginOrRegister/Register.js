// @flow

import classNames from "classnames";
import React from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { helpers, local, realtimeUpdate, setTitle, toWorker } from "../../util";

const sport = helpers.upperCaseFirstLetter(process.env.SPORT);
const otherSport =
    process.env.SPORT === "basketball" ? "Football" : "Basketball";

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

    async handleSubmit(e: SyntheticEvent<>) {
        e.preventDefault();

        this.setState({
            errorMessageEmail: undefined,
            errorMessageOverall: undefined,
            errorMessagePassword: undefined,
            errorMessagePassword2: undefined,
            errorMessageUsername: undefined,
        });

        const el = document.getElementById("register");
        if (!el) {
            return;
        }

        // $FlowFixMe
        const formData = new FormData(el);

        try {
            const data = await fetchWrapper({
                url: `${ACCOUNT_API_URL}/register.php`,
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
            console.log(err);
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
                <p className="alert alert-primary">
                    Accounts are shared between {sport} GM and{" "}
                    <a
                        href={`https://play.${otherSport.toLowerCase()}-gm.com/`}
                    >
                        {otherSport} GM
                    </a>
                    , so if you already have a{" "}
                    <a
                        href={`https://play.${otherSport.toLowerCase()}-gm.com/`}
                    >
                        {otherSport} GM
                    </a>{" "}
                    account, you don't need to create a new one.
                </p>
                <form onSubmit={this.handleSubmit} id="register">
                    <input
                        type="hidden"
                        name="sport"
                        value={process.env.SPORT}
                    />
                    <div
                        className={classNames("form-group", {
                            "text-danger":
                                this.state.errorMessageUsername !== undefined,
                        })}
                    >
                        <label htmlFor="register-username">Username</label>
                        <input
                            type="text"
                            className={classNames("form-control", {
                                "is-invalid":
                                    this.state.errorMessageUsername !==
                                    undefined,
                            })}
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
                        <span className="form-text">
                            {this.state.errorMessageUsername}
                        </span>
                    </div>
                    <div
                        className={classNames("form-group", {
                            "text-danger":
                                this.state.errorMessageEmail !== undefined,
                        })}
                    >
                        <label htmlFor="register-email">Email Address</label>
                        <input
                            type="email"
                            className={classNames("form-control", {
                                "is-invalid":
                                    this.state.errorMessageEmail !== undefined,
                            })}
                            id="register-email"
                            name="email"
                            required="required"
                        />
                        <span className="form-text">
                            {this.state.errorMessageEmail}
                        </span>
                    </div>
                    <div
                        className={classNames("form-group", {
                            "text-danger":
                                this.state.errorMessagePassword !== undefined,
                        })}
                    >
                        <label htmlFor="register-password">Password</label>
                        <input
                            type="password"
                            className={classNames("form-control", {
                                "is-invalid":
                                    this.state.errorMessagePassword !==
                                    undefined,
                            })}
                            id="register-password"
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
                                this.state.errorMessagePassword2 !== undefined,
                        })}
                    >
                        <label htmlFor="register-password2">
                            Verify Password
                        </label>
                        <input
                            type="password"
                            className={classNames("form-control", {
                                "is-invalid":
                                    this.state.errorMessagePassword2 !==
                                    undefined,
                            })}
                            id="register-password2"
                            name="password2"
                            required="required"
                        />
                        <span className="form-text">
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
                            Join the mailing list (Only major announcements,
                            about once/year)
                        </label>
                    </div>
                    <button type="submit" className="btn btn-primary">
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
