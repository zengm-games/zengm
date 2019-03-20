import React from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../common";
import { setTitle } from "../util";

const ajaxErrorMsg =
    "Error connecting to server. Check your Internet connection or try again later.";

class LostPassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage: undefined,
            successMessage: undefined,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(document.getElementById("lostpw"));

        this.setState({
            errorMessage: undefined,
            successMessage: undefined,
        });

        try {
            const data = await fetchWrapper({
                url: `${ACCOUNT_API_URL}/lost_password.php`,
                method: "POST",
                data: formData,
                credentials: "include",
            });

            if (data.success) {
                this.setState({
                    successMessage:
                        "Check your email for further instructions.",
                });
            } else {
                this.setState({ errorMessage: "Account not found." });
            }
        } catch (err) {
            this.setState({ errorMessage: ajaxErrorMsg });
        }
    }

    render() {
        setTitle("Lost Password");

        return (
            <>
                <div className="row">
                    <div className="col-lg-4 col-md-4 col-sm-6">
                        <h1>Lost Password</h1>
                        <p>
                            Enter your username or email address below to
                            recover your login information.
                        </p>
                        <form onSubmit={this.handleSubmit} id="lostpw">
                            <input
                                type="hidden"
                                name="sport"
                                value={process.env.SPORT}
                            />
                            <div className="form-group">
                                <label
                                    className="col-form-label"
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
                            <button type="submit" className="btn btn-primary">
                                Recover Login Info
                            </button>
                            <p className="text-danger mt-3" id="lostpw-error">
                                {this.state.errorMessage}
                            </p>
                            <p
                                className="text-success mt-3"
                                id="lostpw-success"
                            >
                                {this.state.successMessage}
                            </p>
                        </form>
                    </div>
                </div>
            </>
        );
    }
}

export default LostPassword;
