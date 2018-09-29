// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import { SPORT, STRIPE_PUBLISHABLE_KEY, fetchWrapper } from "../../common";
import { getScript, local, realtimeUpdate, setTitle } from "../util";

const ajaxErrorMsg =
    "Error connecting to server. Check your Internet connection or try again later.";

type StripeButtonProps = {
    email: string,
};

type StripeButtonState = {
    handler: ?{
        open: Function,
    },
};

class StripeButton extends React.Component<
    StripeButtonProps,
    StripeButtonState,
> {
    handleClick: Function;

    constructor(props) {
        super(props);
        this.state = {
            handler: null,
        };
        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        (async () => {
            if (!window.StripeCheckout) {
                await getScript("https://checkout.stripe.com/checkout.js");
            }
            if (!this.state.handler) {
                this.setState({
                    handler: window.StripeCheckout.configure({
                        key: STRIPE_PUBLISHABLE_KEY,
                        image: "/ico/icon128.png",
                        token: async token => {
                            try {
                                const data = await fetchWrapper({
                                    url: `//account.basketball-gm.${
                                        window.tld
                                    }/gold_start.php`,
                                    method: "POST",
                                    data: {
                                        sport: "basketball",
                                        token: token.id,
                                    },
                                    credentials: "include",
                                });
                                realtimeUpdate(["account"], "/account", {
                                    goldResult: data,
                                });
                            } catch (err) {
                                console.log(err);
                                realtimeUpdate(["account"], "/account", {
                                    goldResult: {
                                        success: false,
                                        message: ajaxErrorMsg,
                                    },
                                });
                            }
                        },
                    }),
                });
            }
        })();
    }

    handleClick() {
        if (this.state.handler) {
            this.state.handler.open({
                name: "Basketball GM Gold",
                description: "",
                amount: 500,
                email: this.props.email,
                allowRememberMe: false,
                panelLabel: "Subscribe for $5/month",
            });
        }
    }

    render() {
        return (
            <button
                className="btn btn-lg btn-primary"
                disabled={!this.state.handler}
                onClick={this.handleClick}
            >
                Sign Up for Basketball GM Gold
            </button>
        );
    }
}

StripeButton.propTypes = {
    email: PropTypes.string.isRequired,
};

const handleCancel = async e => {
    e.preventDefault();

    const result = window.confirm(
        "Are you sure you want to cancel your Basketball GM Gold subscription?",
    );

    if (result) {
        try {
            const data = await fetchWrapper({
                url: `//account.basketball-gm.${window.tld}/gold_cancel.php`,
                method: "POST",
                data: {
                    sport: "basketball",
                },
                credentials: "include",
            });
            realtimeUpdate(["account"], "/account", { goldResult: data });
        } catch (err) {
            console.log(err);
            realtimeUpdate(["account"], "/account", {
                goldResult: {
                    success: false,
                    message: ajaxErrorMsg,
                },
            });
        }
    }
};

type UserInfoProps = {
    goldUntilDateString: string,
    loggedIn: boolean,
    showGoldActive: boolean,
    showGoldCancelled: boolean,
    username?: string,
};

type UserInfoState = {
    logoutError: ?string,
};

class UserInfo extends React.Component<UserInfoProps, UserInfoState> {
    handleLogout: Function;

    constructor(props) {
        super(props);
        this.state = {
            logoutError: null,
        };
        this.handleLogout = this.handleLogout.bind(this);
    }

    async handleLogout(e) {
        e.preventDefault();

        this.setState({
            logoutError: null,
        });

        try {
            await fetchWrapper({
                url: `//account.basketball-gm.${window.tld}/logout.php`,
                method: "POST",
                data: { sport: SPORT },
                credentials: "include",
            });

            local.update({ username: "" });
            realtimeUpdate(["account"], "/");
        } catch (err) {
            this.setState({
                logoutError: ajaxErrorMsg,
            });
        }
    }

    render() {
        const {
            goldUntilDateString,
            loggedIn,
            showGoldActive,
            showGoldCancelled,
            username,
        } = this.props;

        return (
            <div>
                {!loggedIn ? (
                    <p>
                        You are not logged in!{" "}
                        <a href="/account/login_or_register">
                            Click here to log in or create an account.
                        </a>{" "}
                        If you have an account, your achievements will be stored
                        in the cloud, combining achievements from leagues in
                        different browsers and different computers.
                    </p>
                ) : (
                    <p>
                        Logged in as: <b>{username}</b> (
                        <a href="" id="logout" onClick={this.handleLogout}>
                            Logout
                        </a>
                        )
                    </p>
                )}
                <p className="text-danger">{this.state.logoutError}</p>
                {showGoldActive ? (
                    <p>
                        Basketball GM Gold: Active, renews for $5 on{" "}
                        {goldUntilDateString} (
                        <a href="/account/update_card">Update card</a> or{" "}
                        <a href="" id="gold-cancel" onClick={handleCancel}>
                            cancel
                        </a>
                        )
                    </p>
                ) : null}
                {showGoldCancelled ? (
                    <p>
                        Basketball GM Gold: Cancelled, expires{" "}
                        {goldUntilDateString}
                    </p>
                ) : null}
            </div>
        );
    }
}

UserInfo.propTypes = {
    goldUntilDateString: PropTypes.string.isRequired,
    loggedIn: PropTypes.bool.isRequired,
    showGoldActive: PropTypes.bool.isRequired,
    showGoldCancelled: PropTypes.bool.isRequired,
    username: PropTypes.string,
};

const Account = ({
    achievements,
    email,
    goldMessage,
    goldSuccess,
    goldUntilDateString,
    loggedIn,
    showGoldActive,
    showGoldCancelled,
    showGoldPitch,
    username,
}: {
    achievements: {
        count: number,
        desc: string,
        name: string,
        slug: string,
    }[],
    email?: string,
    goldMessage?: string,
    goldSuccess?: boolean,
    goldUntilDateString: string,
    loggedIn: boolean,
    showGoldActive: boolean,
    showGoldCancelled: boolean,
    showGoldPitch: boolean,
    username?: string,
}) => {
    setTitle("Account");

    let goldPitchDiv = null;
    if (showGoldPitch) {
        goldPitchDiv = (
            <div>
                <h2>Basketball GM Gold</h2>

                <div className="row">
                    <div className="col-lg-8 col-md-10">
                        <p>
                            Basketball GM is completely free. There will never
                            be any{" "}
                            <a
                                href="http://en.wikipedia.org/wiki/Freemium"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                "freemium"
                            </a>{" "}
                            or{" "}
                            <a
                                href="http://en.wikipedia.org/wiki/Free-to-play"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                "pay-to-win"
                            </a>{" "}
                            bullshit here. Why? Because if a game charges you
                            money for power-ups, the developer makes more money
                            if they make their game frustratingly annoying to
                            play without power-ups. Because of this,{" "}
                            <b>freemium games always suck</b>.
                        </p>

                        <p>
                            If you want to support Basketball GM continuing to
                            be a non-sucky game, sign up for Basketball GM Gold!
                            It's only <b>$5/month</b>. What do you get? More
                            like, what don't you get? You get no new features,
                            no new improvements, no new anything. Just{" "}
                            <b>no more ads</b>. That's it. Why? For basically
                            the same reason I won't make Basketball GM freemium.
                            I don't want the free version to become a crippled
                            advertisement for the pay version. If you agree that
                            the world is a better place when anyone anywhere can
                            play Basketball GM, sign up for Basketball GM Gold
                            today!
                        </p>

                        {!loggedIn || !email ? (
                            <p>
                                <a href="/account/login_or_register">
                                    Log in or create an account
                                </a>{" "}
                                to sign up for Basketball GM Gold.
                            </p>
                        ) : (
                            <p>
                                <StripeButton email={email} />
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1>Your Account</h1>

            <div className="row">
                <div className="col-lg-8 col-md-10 ">
                    <UserInfo
                        goldUntilDateString={goldUntilDateString}
                        loggedIn={loggedIn}
                        showGoldActive={showGoldActive}
                        showGoldCancelled={showGoldCancelled}
                        username={username}
                    />
                </div>
            </div>

            {goldSuccess === true ? (
                <div className="alert alert-success">{goldMessage}</div>
            ) : null}
            {goldSuccess === false ? (
                <div className="alert alert-danger">{goldMessage}</div>
            ) : null}

            {goldPitchDiv}

            <h2>Achievements</h2>

            <p>
                You will only be awarded achievements in leagues where you have
                never used God Mode or set the difficulty to Easy.
            </p>

            <ul className="achievements list-group">
                {achievements.map((achievement, i) => {
                    const lis = [
                        <li
                            className="list-group-item col-12 col-sm-6 col-md-4 col-lg-3 float-left"
                            key={achievement.slug}
                        >
                            <div
                                className={classNames({
                                    "list-group-item-success":
                                        achievement.count > 0,
                                    "text-muted": achievement.count === 0,
                                })}
                            >
                                {achievement.count > 1 ? (
                                    <span className="badge float-right">
                                        {achievement.count}
                                    </span>
                                ) : null}
                                <h4 className="list-group-item-heading">
                                    {achievement.name}
                                </h4>
                                <p className="list-group-item-text">
                                    {achievement.desc}
                                </p>
                            </div>
                        </li>,
                    ];
                    if (i % 4 === 3) {
                        lis.push(
                            <li
                                className="clearfix visible-lg"
                                key={`sep${i}-4`}
                            />,
                        );
                    }
                    if (i % 3 === 2) {
                        lis.push(
                            <li
                                className="clearfix visible-md"
                                key={`sep${i}-3`}
                            />,
                        );
                    }
                    if (i % 2 === 1) {
                        lis.push(
                            <li
                                className="clearfix visible-sm"
                                key={`sep${i}-2`}
                            />,
                        );
                    }
                    return lis;
                })}
            </ul>
        </div>
    );
};

Account.propTypes = {
    achievements: PropTypes.arrayOf(
        PropTypes.shape({
            count: PropTypes.number.isRequired,
            desc: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            slug: PropTypes.string.isRequired,
        }),
    ).isRequired,
    email: PropTypes.string,
    goldMessage: PropTypes.string,
    goldSuccess: PropTypes.bool,
    goldUntilDateString: PropTypes.string.isRequired,
    loggedIn: PropTypes.bool.isRequired,
    showGoldActive: PropTypes.bool.isRequired,
    showGoldCancelled: PropTypes.bool.isRequired,
    showGoldPitch: PropTypes.bool.isRequired,
    username: PropTypes.string,
};

export default Account;
