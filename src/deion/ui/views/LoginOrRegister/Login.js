// @flow

import React from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { local, realtimeUpdate, toWorker } from "../../util";

type Props = {
    ajaxErrorMsg: string,
};

type State = {
    errorMessage: string | void,
};

class Login extends React.Component<Props, State> {
    handleSubmit: Function;

    constructor(props: Props) {
        super(props);
        this.state = {
            errorMessage: undefined,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async handleSubmit(e: SyntheticEvent<>) {
        e.preventDefault();

        this.setState({ errorMessage: undefined });

        const el = document.getElementById("login");
        if (!el) {
            return;
        }

        // $FlowFixMe
        const formData = new FormData(el);

        try {
            const data = await fetchWrapper({
                url: `${ACCOUNT_API_URL}/login.php`,
                method: "POST",
                data: formData,
                credentials: "include",
            });

            if (data.success) {
                const currentTimestamp = Math.floor(Date.now() / 1000);
                local.update({
                    gold: currentTimestamp <= data.gold_until,
                    username: data.username,
                });

                // Check for participation achievement, if this is the first time logging in to this sport
                await toWorker("checkParticipationAchievement", false);
                realtimeUpdate(["account"], "/account");
            } else {
                this.setState({
                    errorMessage: "Invalid username or password.",
                });
            }
        } catch (err) {
            this.setState({ errorMessage: this.props.ajaxErrorMsg });
        }
    }

    render() {
        return (
            <>
                <h1>Login</h1>
                <form onSubmit={this.handleSubmit} id="login">
                    <input
                        type="hidden"
                        name="sport"
                        value={process.env.SPORT}
                    />
                    <div className="form-group">
                        <label htmlFor="login-username">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="login-username"
                            name="username"
                            required="required"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="login-password"
                            name="password"
                            required="required"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Login
                    </button>
                    <p className="text-danger mt-3">
                        {this.state.errorMessage}
                    </p>
                </form>
                <a href="/account/lost_password">Lost password?</a>
            </>
        );
    }
}

export default Login;
