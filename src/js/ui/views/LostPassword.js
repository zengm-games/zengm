import React from "react";
import { SPORT, fetchWrapper } from "../../common";
import { setTitle } from "../util";

const ajaxErrorMsg =
    "Error connecting to server. Check your Internet connection or try again later.";

class LostPassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lostpwError: null,
            lostpwSuccess: null,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(document.getElementById("lostpw"));

        this.setState({
            lostpwError: null,
            lostpwSuccess: null,
        });

        try {
            const data = await fetchWrapper({
                url: `//account.basketball-gm.${window.tld}/lost_password.php`,
                method: "POST",
                data: formData,
                credentials: "include",
            });

            if (data.success) {
                this.setState({
                    lostpwSuccess: "Check your email for further instructions.",
                });
            } else {
                this.setState({ lostpwError: "Account not found." });
            }
        } catch (err) {
            this.setState({ lostpwError: ajaxErrorMsg });
        }
    }

    render() {
        setTitle("Lost Password");

        return (
            <div>
                <div className="row">
                    <div className="col-lg-4 col-md-4 col-sm-3 hidden-xs" />
                    <div className="col-lg-4 col-md-4 col-sm-6">
                        <h1>Lost Password</h1>
                        <p>
                            Enter your username or email address below to
                            recover your login information.
                        </p>
                        <form onSubmit={this.handleSubmit} id="lostpw">
                            <input type="hidden" name="sport" value={SPORT} />
                            <div className="form-group">
                                <label
                                    className="control-label"
                                    htmlFor="lostpw-entry"
                                >
                                    Username or Email Address
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lostpw-entry"
                                    name="entry"
                                    required="required"
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-default btn-primary"
                            >
                                Recover Login Info
                            </button>
                            <p
                                className="text-danger"
                                id="lostpw-error"
                                style={{ marginTop: "1em" }}
                            >
                                {this.state.lostpwError}
                            </p>
                            <p
                                className="text-success"
                                id="lostpw-success"
                                style={{ marginTop: "1em" }}
                            >
                                {this.state.lostpwSuccess}
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default LostPassword;
