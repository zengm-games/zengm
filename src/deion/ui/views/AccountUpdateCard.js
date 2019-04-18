/* eslint camelcase: "off" */

import PropTypes from "prop-types";
import React from "react";
import {
    ACCOUNT_API_URL,
    STRIPE_PUBLISHABLE_KEY,
    fetchWrapper,
} from "../../common";
import { getScript, realtimeUpdate, setTitle } from "../util";

const ajaxErrorMsg =
    "Error connecting to server. Check your Internet connection or try again later.";

class AccountUpdateCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            disabled: true,
            formError: null,
            number: "",
            cvc: "",
            exp_month: "",
            exp_year: "",
        };
        this.handleChanges = {
            cvc: this.handleChange.bind(this, "cvc"),
            exp_month: this.handleChange.bind(this, "exp_month"),
            exp_year: this.handleChange.bind(this, "exp_year"),
            number: this.handleChange.bind(this, "number"),
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        (async () => {
            if (!window.Stripe) {
                await getScript("https://js.stripe.com/v2/");
                window.Stripe.setPublishableKey(STRIPE_PUBLISHABLE_KEY);
            }

            this.setState({
                disabled: false,
            });
        })();
    }

    handleChange(name, e) {
        this.setState({
            [name]: e.target.value,
        });
    }

    handleSubmit(e) {
        e.preventDefault();

        this.setState({
            disabled: true,
        });

        window.Stripe.card.createToken(
            {
                number: this.state.number,
                cvc: this.state.cvc,
                exp_month: this.state.exp_month,
                exp_year: this.state.exp_year,
            },
            async (status, response) => {
                if (response.error) {
                    this.setState({
                        disabled: false,
                        formError: response.error.message,
                    });
                } else {
                    const token = response.id;

                    try {
                        const data = await fetchWrapper({
                            url: `${ACCOUNT_API_URL}/gold_card_update.php`,
                            method: "POST",
                            data: {
                                sport: process.env.SPORT,
                                token,
                            },
                            credentials: "include",
                        });
                        realtimeUpdate(["account"], "/account", {
                            goldResult: data,
                        });
                    } catch (err) {
                        this.setState({
                            disabled: false,
                            formError: ajaxErrorMsg,
                        });
                    }
                }
            },
        );
    }

    render() {
        const {
            goldCancelled,
            expMonth,
            expYear,
            last4,
            username,
        } = this.props;

        setTitle("Update Card");

        let errorMessage;
        if (username === undefined || username === null || username === "") {
            errorMessage = "Log in to view this page.";
        }
        if (goldCancelled) {
            errorMessage =
                "Cannot update card because your GM Gold account is cancelled.";
        }
        if (errorMessage) {
            return (
                <>
                    <h1>Error</h1>
                    <p>{errorMessage}</p>
                </>
            );
        }

        return (
            <>
                <h1>Update Card</h1>

                <h3>Saved Card Info</h3>
                <p>
                    Last 4 Digits: {last4}
                    <br />
                    Expiration: {expMonth}/{expYear}
                </p>

                <hr />

                <p>
                    To replace your saved card with a new one, fill out this
                    form:
                </p>

                <form onSubmit={this.handleSubmit}>
                    {this.state.formError ? (
                        <div className="alert alert-danger">
                            {this.state.formError}
                        </div>
                    ) : null}

                    <div style={{ maxWidth: "300px" }}>
                        <div className="form-group">
                            <label htmlFor="card-number">Card Number</label>
                            <input
                                type="text"
                                onChange={this.handleChanges.number}
                                value={this.state.number}
                                id="card-number"
                                className="form-control"
                            />
                        </div>

                        <div
                            className="form-group"
                            style={{ maxWidth: "100px" }}
                        >
                            <label htmlFor="cvc">CVC</label>
                            <input
                                type="text"
                                onChange={this.handleChanges.cvc}
                                value={this.state.cvc}
                                id="cvc"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="exp-month">
                                Expiration (MM/YYYY)
                            </label>
                            <div className="row">
                                <div className="col-5">
                                    <input
                                        type="text"
                                        onChange={this.handleChanges.exp_month}
                                        value={this.state.exp_month}
                                        placeholder="MM"
                                        id="exp-month"
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-7">
                                    <input
                                        type="text"
                                        onChange={this.handleChanges.exp_year}
                                        value={this.state.exp_year}
                                        placeholder="YYYY"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={this.state.disabled}
                            className="btn btn-primary"
                        >
                            Update Card
                        </button>
                    </div>
                </form>
            </>
        );
    }
}

AccountUpdateCard.propTypes = {
    goldCancelled: PropTypes.bool.isRequired,
    expMonth: PropTypes.number.isRequired,
    expYear: PropTypes.number.isRequired,
    last4: PropTypes.string.isRequired,
    username: PropTypes.string,
};

export default AccountUpdateCard;
