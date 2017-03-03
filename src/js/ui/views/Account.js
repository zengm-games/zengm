// @flow

import classNames from 'classnames';
import $ from 'jquery';
import React from 'react';
import {SPORT, STRIPE_PUBLISHABLE_KEY} from '../../common';
import {emitter, realtimeUpdate, setTitle} from '../util';

const ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

class StripeButton extends React.Component {
    state: {
        handler: ?{
            open: Function,
        },
    };
    handleClick: Function;

    constructor(props) {
        super(props);
        this.state = {
            handler: null,
        };
        this.handleClick = this.handleClick.bind(this);
    }

    componentWillMount() {
        (async () => {
            if (!window.StripeCheckout) {
                await Promise.resolve($.getScript('https://checkout.stripe.com/checkout.js'));
            }
            if (!this.handler) {
                this.setState({
                    handler: window.StripeCheckout.configure({
                        key: STRIPE_PUBLISHABLE_KEY,
                        image: '/ico/icon128.png',
                        token: async token => {
                            try {
                                const data = await Promise.resolve($.ajax({
                                    type: "POST",
                                    url: `//account.basketball-gm.${window.tld}/gold_start.php`,
                                    data: {
                                        sport: "basketball",
                                        token: token.id,
                                    },
                                    dataType: "json",
                                    xhrFields: {
                                        withCredentials: true,
                                    },
                                }));
                                realtimeUpdate(["account"], "/account", {goldResult: data});
                            } catch (err) {
                                console.log(err);
                                realtimeUpdate(["account"], "/account", {goldResult: {
                                    success: false,
                                    message: ajaxErrorMsg,
                                }});
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
                name: 'Basketball GM Gold',
                description: '',
                amount: 500,
                email: this.props.email,
                allowRememberMe: false,
                panelLabel: "Subscribe for $5/month",
            });
        }
    }

    render() {
        return <button className="btn btn-lg btn-primary" disabled={!this.state.handler} onClick={this.handleClick}>
            Sign Up for Basketball GM Gold
        </button>;
    }
}

StripeButton.propTypes = {
    email: React.PropTypes.string.isRequired,
};

const handleCancel = async e => {
    e.preventDefault();

    const result = window.confirm("Are you sure you want to cancel your Basketball GM Gold subscription?");

    if (result) {
        try {
            const data = await Promise.resolve($.ajax({
                type: "POST",
                url: `//account.basketball-gm.${window.tld}/gold_cancel.php`,
                data: {
                    sport: "basketball",
                },
                dataType: "json",
                xhrFields: {
                    withCredentials: true,
                },
            }));
            realtimeUpdate(["account"], "/account", {goldResult: data});
        } catch (err) {
            console.log(err);
            realtimeUpdate(["account"], "/account", {goldResult: {
                success: false,
                message: ajaxErrorMsg,
            }});
        }
    }
};

class UserInfo extends React.Component {
    state: {
        logoutError: ?string,
    };
    handleLogout: Function;

    constructor(props) {
        super(props);
        this.state = {
            logoutError: null,
        };
        this.handleLogout = this.handleLogout.bind(this);
    }

    handleLogout(e) {
        e.preventDefault();

        this.setState({
            logoutError: null,
        });

        $.ajax({
            type: "POST",
            url: `//account.basketball-gm.${window.tld}/logout.php`,
            data: `sport=${SPORT}`,
            xhrFields: {
                withCredentials: true,
            },
            success: () => {
                emitter.emit('updateTopMenu', {username: ''});
                realtimeUpdate(["account"], "/");
            },
            error: () => {
                this.setState({
                    logoutError: ajaxErrorMsg,
                });
            },
        });
    }

    render() {
        const {goldUntilDateString, showGoldActive, showGoldCancelled, username} = this.props;

        return <div>
            {username === undefined || username === null || username === '' ? <p>
                You are not logged in! <a href="/account/login_or_register">Click here to log in or create an account.</a> If you have an account, your achievements will be stored in the cloud, combining achievements from leagues in different browsers and different computers.
            </p> : <p>
                Logged in as: <b>{username}</b> (<a href="" id="logout" onClick={this.handleLogout}>Logout</a>)
            </p>}
            <p className="text-danger">{this.state.logoutError}</p>
            {showGoldActive ? <p>Basketball GM Gold: Active, renews for $5 on {goldUntilDateString} (<a href="/account/update_card">Update card</a> or <a href="" id="gold-cancel" onClick={handleCancel}>cancel</a>)</p> : null}
            {showGoldCancelled ? <p>Basketball GM Gold: Cancelled, expires {goldUntilDateString}</p> : null}
        </div>;
    }
}

UserInfo.propTypes = {
    goldUntilDateString: React.PropTypes.string.isRequired,
    showGoldActive: React.PropTypes.bool.isRequired,
    showGoldCancelled: React.PropTypes.bool.isRequired,
    username: React.PropTypes.string,
};

const Account = ({
    achievements,
    email,
    goldMessage,
    goldSuccess,
    goldUntilDateString,
    showGoldActive,
    showGoldCancelled,
    showGoldPitch,
    username,
}: {
    achievements: {
        count: number,
        desc: string,
        name: string,
    }[],
    email?: string,
    goldMessage?: string,
    goldSuccess?: boolean,
    goldUntilDateString: string,
    showGoldActive: boolean,
    showGoldCancelled: boolean,
    showGoldPitch: boolean,
    username?: string,
}) => {
    setTitle('Account');

    let goldPitchDiv = null;
    if (showGoldPitch) {
        goldPitchDiv = <div>
            <h2>Basketball GM Gold</h2>

            <div className="row">
                <div className="col-lg-8 col-md-10">
                    <p>Basketball GM is completely free. There will never be any <a href="http://en.wikipedia.org/wiki/Freemium" rel="noopener noreferrer" target="_blank">"freemium"</a> or <a href="http://en.wikipedia.org/wiki/Free-to-play" rel="noopener noreferrer" target="_blank">"pay-to-win"</a> bullshit here. Why? Because if a game charges you money for power-ups, the developer makes more money if they make their game frustratingly annoying to play without power-ups. Because of this, <b>freemium games always suck</b>.</p>

                    <p>If you want to support Basketball GM continuing to be a non-sucky game, sign up for Basketball GM Gold! It's only <b>$5/month</b>. What do you get? More like, what don't you get? You get no new features, no new improvements, no new anything. Just <b>no more ads</b>. That's it. Why? For basically the same reason I won't make Basketball GM freemium. I don't want the free version to become a crippled advertisement for the pay version. If you agree that the world is a better place when anyone anywhere can play Basketball GM, sign up for Basketball GM Gold today!</p>

                    {username === undefined || username === null || username === '' ? <p>
                        <a href="/account/login_or_register">Log in or create an account</a> to sign up for Basketball GM Gold.
                    </p> : <p><StripeButton email={email} /></p>}
                </div>
            </div>
        </div>;
    }

    return <div>
        <h1>Your Account</h1>

        <div className="row">
            <div className="col-lg-8 col-md-10 ">
                <UserInfo
                    goldUntilDateString={goldUntilDateString}
                    showGoldActive={showGoldActive}
                    showGoldCancelled={showGoldCancelled}
                    username={username}
                />
            </div>
        </div>

        {goldSuccess === true ? <div className="alert alert-success">{goldMessage}</div> : null}
        {goldSuccess === false ? <div className="alert alert-danger">{goldMessage}</div> : null}

        {goldPitchDiv}

        <h2>Achievements</h2>

        <ul className="achievements list-group">
            {achievements.map((achievement, i) => {
                const lis = [
                    <li className="list-group-item col-xs-12 col-sm-6 col-md-4 col-lg-3 pull-left">
                        <div className={classNames({'list-group-item-success': achievement.count > 0, 'text-muted': achievement.count === 0})}>
                            {achievement.count > 1 ? <span className="badge pull-right">{achievement.count}</span> : null}
                            <h4 className="list-group-item-heading">{achievement.name}</h4>
                            <p className="list-group-item-text">{achievement.desc}</p>
                        </div>
                    </li>,
                ];
                if (i % 4 === 3) {
                    lis.push(<li className="clearfix visible-lg" />);
                }
                if (i % 3 === 2) {
                    lis.push(<li className="clearfix visible-md" />);
                }
                if (i % 2 === 1) {
                    lis.push(<li className="clearfix visible-sm" />);
                }
                return lis;
            })}
        </ul>
    </div>;
};

Account.propTypes = {
    achievements: React.PropTypes.arrayOf(React.PropTypes.shape({
        count: React.PropTypes.number.isRequired,
        desc: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
    })).isRequired,
    email: React.PropTypes.string,
    goldMessage: React.PropTypes.string,
    goldSuccess: React.PropTypes.bool,
    goldUntilDateString: React.PropTypes.string.isRequired,
    showGoldActive: React.PropTypes.bool.isRequired,
    showGoldCancelled: React.PropTypes.bool.isRequired,
    showGoldPitch: React.PropTypes.bool.isRequired,
    username: React.PropTypes.string,
};

export default Account;
