const Promise = require('bluebird');
const classNames = require('classnames');
const $ = require('jquery');
const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const bbgmViewReact = require('../../util/bbgmViewReact');

const ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

class StripeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            handler: null,
        };
        this.handleClick = this.handleClick.bind(this);
    }

    async componentDidMount() {
        if (!window.StripeCheckout) {
            await Promise.resolve($.getScript('https://checkout.stripe.com/checkout.js'));
        }
        if (!this.handler) {
            this.setState({
                handler: window.StripeCheckout.configure({
                    key: g.stripePublishableKey,
                    image: '/ico/icon128.png',
                    token: async token => {
                        try {
                            const data = await Promise.resolve($.ajax({
                                type: "POST",
                                url: `//account.basketball-gm.${g.tld}/gold_start.php`,
                                data: {
                                    sport: "basketball",
                                    token: token.id,
                                },
                                dataType: "json",
                                xhrFields: {
                                    withCredentials: true,
                                },
                            }));
                            ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
                        } catch (err) {
                            console.log(err);
                            ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: {
                                success: false,
                                message: ajaxErrorMsg,
                            }});
                        }
                    },
                }),
            });
        }
    }

    handleClick() {
        if (this.state.handler) {
            const email = g.vm.topMenu.email();

            this.state.handler.open({
                name: 'Basketball GM Gold',
                description: '',
                amount: 500,
                email,
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

class UserInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logoutError: null,
        };
        this.handleCancel = this.handleCancel.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
    }

    async handleCancel(e) {
        e.preventDefault();

        const result = window.confirm("Are you sure you want to cancel your Basketball GM Gold subscription?");

        if (result) {
            try {
                const data = await Promise.resolve($.ajax({
                    type: "POST",
                    url: `//account.basketball-gm.${g.tld}/gold_cancel.php`,
                    data: {
                        sport: "basketball",
                    },
                    dataType: "json",
                    xhrFields: {
                        withCredentials: true,
                    },
                }));
                ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
            } catch (err) {
                console.log(err);
                ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: {
                    success: false,
                    message: ajaxErrorMsg,
                }});
            }
        }
    }

    handleLogout(e) {
        e.preventDefault();

        this.setState({
            logoutError: null,
        });

        $.ajax({
            type: "POST",
            url: `//account.basketball-gm.${g.tld}/logout.php`,
            data: `sport=${g.sport}`,
            xhrFields: {
                withCredentials: true,
            },
            success: () => {
                g.vm.topMenu.username("");
                ui.realtimeUpdate(["account"], "/");
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
            {
                username === null || username === ''
            ?
                <p>You are not logged in! <a href="/account/login_or_register">Click here to log in or create an account.</a> If you have an account, your achievements will be stored in the cloud, combining achievements from leagues in different browsers and different computers.</p>
            :
                <p>Logged in as: <b>{username}</b> (<a href="" id="logout" onClick={this.handleLogout} data-no-davis="true">Logout</a>)</p>
            }
            <p className="text-danger">{this.state.logoutError}</p>
            {showGoldActive ? <p>Basketball GM Gold: Active, renews for $5 on {goldUntilDateString} (<a href="/account/update_card">Update card</a> or <a href="" id="gold-cancel" onClick={this.handleCancel} data-no-davis="true">cancel</a>)</p> : null}
            {showGoldCancelled ? <p>Basketball GM Gold: Cancelled, expires {goldUntilDateString}</p> : null}
        </div>;
    }
}

const Account = ({achievements = [], goldMessage, goldSuccess, goldUntilDateString, showGoldActive, showGoldCancelled, showGoldPitch, username}) => {
    bbgmViewReact.title('Account');

    let goldPitchDiv = null;
    if (showGoldPitch) {
        goldPitchDiv = <div>
            <h2>Basketball GM Gold</h2>

            <div className="row">
                <div className="col-lg-8 col-md-10">
                    <p>Basketball GM is completely free. There will never be any <a href="http://en.wikipedia.org/wiki/Freemium" target="_blank">"freemium"</a> or <a href="http://en.wikipedia.org/wiki/Free-to-play" target="_blank">"pay-to-win"</a> bullshit here. Why? Because if a game charges you money for power-ups, the developer makes more money if they make their game frustratingly annoying to play without power-ups. Because of this, <b>freemium games always suck</b>.</p>

                    <p>If you want to support Basketball GM continuing to be a non-sucky game, sign up for Basketball GM Gold! It's only <b>$5/month</b>. What do you get? More like, what don't you get? You get no new features, no new improvements, no new anything. Just <b>no more ads</b>. That's it. Why? For basically the same reason I won't make Basketball GM freemium. I don't want the free version to become a crippled advertisement for the pay version. If you agree that the world is a better place when anyone anywhere can play Basketball GM, sign up for Basketball GM Gold today!</p>

                    {
                        username === null || username === ''
                    ?
                        <p><a href="/account/login_or_register">Log in or create an account</a> to sign up for Basketball GM Gold.</p>
                    :
                        <p><StripeButton /></p>
                    }
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
                            <p className="list-group-item-text">
                                <span dangerouslySetInnerHTML={{__html: achievement.desc}} />
                            </p>
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

module.exports = Account;
