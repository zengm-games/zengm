import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { HelpPopover, NewWindowLink } from "../components";
import { local, logEvent, setTitle, toWorker } from "../util";

class GodMode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dirty: false,
            disableInjuries: String(props.disableInjuries),
            homeCourtAdvantage: props.homeCourtAdvantage,
            luxuryPayroll: props.luxuryPayroll,
            luxuryTax: props.luxuryTax,
            maxContract: props.maxContract,
            minContract: props.minContract,
            minPayroll: props.minPayroll,
            minRosterSize: props.minRosterSize,
            maxRosterSize: props.maxRosterSize,
            numGames: props.numGames,
            quarterLength: props.quarterLength,
            salaryCap: props.salaryCap,
            aiTrades: String(props.aiTrades),
            injuryRate: props.injuryRate,
            tragicDeathRate: props.tragicDeathRate,
            brotherRate: props.brotherRate,
            sonRate: props.sonRate,
            hardCap: String(props.hardCap),
            numGamesPlayoffSeries: JSON.stringify(props.numGamesPlayoffSeries),
            numPlayoffByes: props.numPlayoffByes,
            draftType: props.draftType,
            playersRefuseToNegotiate: props.playersRefuseToNegotiate,
        };
        this.handleChanges = {
            disableInjuries: this.handleChange.bind(this, "disableInjuries"),
            luxuryPayroll: this.handleChange.bind(this, "luxuryPayroll"),
            luxuryTax: this.handleChange.bind(this, "luxuryTax"),
            maxContract: this.handleChange.bind(this, "maxContract"),
            minContract: this.handleChange.bind(this, "minContract"),
            minPayroll: this.handleChange.bind(this, "minPayroll"),
            minRosterSize: this.handleChange.bind(this, "minRosterSize"),
            maxRosterSize: this.handleChange.bind(this, "maxRosterSize"),
            numGames: this.handleChange.bind(this, "numGames"),
            quarterLength: this.handleChange.bind(this, "quarterLength"),
            salaryCap: this.handleChange.bind(this, "salaryCap"),
            aiTrades: this.handleChange.bind(this, "aiTrades"),
            injuryRate: this.handleChange.bind(this, "injuryRate"),
            tragicDeathRate: this.handleChange.bind(this, "tragicDeathRate"),
            brotherRate: this.handleChange.bind(this, "brotherRate"),
            sonRate: this.handleChange.bind(this, "sonRate"),
            hardCap: this.handleChange.bind(this, "hardCap"),
            homeCourtAdvantage: this.handleChange.bind(
                this,
                "homeCourtAdvantage",
            ),
            numGamesPlayoffSeries: this.handleChange.bind(
                this,
                "numGamesPlayoffSeries",
            ),
            numPlayoffByes: this.handleChange.bind(this, "numPlayoffByes"),
            draftType: this.handleChange.bind(this, "draftType"),
            playersRefuseToNegotiate: this.handleChange.bind(
                this,
                "playersRefuseToNegotiate",
            ),
        };
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleGodModeToggle = this.handleGodModeToggle.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (!prevState.dirty) {
            return {
                disableInjuries: String(nextProps.disableInjuries),
                luxuryPayroll: nextProps.luxuryPayroll,
                luxuryTax: nextProps.luxuryTax,
                maxContract: nextProps.maxContract,
                minContract: nextProps.minContract,
                minPayroll: nextProps.minPayroll,
                minRosterSize: nextProps.minRosterSize,
                maxRosterSize: nextProps.maxRosterSize,
                homeCourtAdvantage: nextProps.homeCourtAdvantage,
                numGames: nextProps.numGames,
                quarterLength: nextProps.quarterLength,
                salaryCap: nextProps.salaryCap,
                aiTrades: String(nextProps.aiTrades),
                injuryRate: nextProps.injuryRate,
                tragicDeathRate: nextProps.tragicDeathRate,
                brotherRate: nextProps.brotherRate,
                sonRate: nextProps.sonRate,
                hardCap: String(nextProps.hardCap),
                numGamesPlayoffSeries: JSON.stringify(
                    nextProps.numGamesPlayoffSeries,
                ),
                numPlayoffByes: nextProps.numPlayoffByes,
                draftType: nextProps.draftType,
            };
        }

        return null;
    }

    handleChange(name, e) {
        this.setState({
            dirty: true,
            [name]: e.target.value,
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        let numGamesPlayoffSeries;
        let numPlayoffByes = parseInt(this.state.numPlayoffByes, 10);
        if (Number.isNaN(numPlayoffByes)) {
            numPlayoffByes = 0;
        }
        try {
            numGamesPlayoffSeries = JSON.parse(
                this.state.numGamesPlayoffSeries,
            );
            if (!Array.isArray(numGamesPlayoffSeries)) {
                throw new Error("Must be an array");
            }
            for (const num of numGamesPlayoffSeries) {
                if (!Number.isInteger(num)) {
                    throw new Error("Array must contain only integers");
                }
            }
            const numRounds = numGamesPlayoffSeries.length;
            const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;
            if (numPlayoffTeams > this.props.numTeams) {
                throw new Error(
                    `${numRounds} playoff rounds with ${numPlayoffByes} byes means ${numPlayoffTeams} teams make the playoffs, but there are only ${this.props.numTeams} teams in the league`,
                );
            }
        } catch (error) {
            logEvent({
                type: "error",
                text: `Invalid format for Playoff Games: ${error.message}`,
                saveToDb: false,
                persistent: true,
            });

            return;
        }

        await toWorker("updateGameAttributes", {
            disableInjuries: this.state.disableInjuries === "true",
            numGames: parseInt(this.state.numGames, 10),
            quarterLength: parseFloat(this.state.quarterLength),
            minRosterSize: parseInt(this.state.minRosterSize, 10),
            maxRosterSize: parseInt(this.state.maxRosterSize, 10),
            salaryCap: parseInt(this.state.salaryCap * 1000, 10),
            minPayroll: parseInt(this.state.minPayroll * 1000, 10),
            luxuryPayroll: parseInt(this.state.luxuryPayroll * 1000, 10),
            luxuryTax: parseFloat(this.state.luxuryTax),
            minContract: parseInt(this.state.minContract * 1000, 10),
            maxContract: parseInt(this.state.maxContract * 1000, 10),
            aiTrades: this.state.aiTrades === "true",
            homeCourtAdvantage: parseFloat(this.state.homeCourtAdvantage),
            injuryRate: parseFloat(this.state.injuryRate),
            tragicDeathRate: parseFloat(this.state.tragicDeathRate),
            brotherRate: parseFloat(this.state.brotherRate),
            sonRate: parseFloat(this.state.sonRate),
            hardCap: this.state.hardCap === "true",
            numGamesPlayoffSeries,
            numPlayoffByes: parseInt(this.state.numPlayoffByes, 10),
            draftType: this.state.draftType,
            playersRefuseToNegotiate:
                this.state.playersRefuseToNegotiate === "true",
        });

        this.setState({
            dirty: false,
        });

        logEvent({
            type: "success",
            text: "God Mode options successfully updated.",
            saveToDb: false,
        });
    }

    async handleGodModeToggle() {
        const attrs = { godMode: !this.props.godMode };

        if (attrs.godMode) {
            attrs.godModeInPast = true;
        }

        await toWorker("updateGameAttributes", attrs);
        local.update({ godMode: attrs.godMode });
    }

    render() {
        const { godMode } = this.props;

        setTitle("God Mode");

        return (
            <>
                <h1>
                    God Mode <NewWindowLink />
                </h1>

                <p>
                    God Mode is a collection of customization features that
                    allow you to kind of do whatever you want. If you enable God
                    Mode, you get access to the following features (which show
                    up in the game as{" "}
                    <span className="god-mode god-mode-text">purple text</span>
                    ):
                </p>

                <ul>
                    <li>
                        Create custom players by going to Tools > Create A
                        Player
                    </li>
                    <li>
                        Edit any player by going to their player page and
                        clicking Edit Player
                    </li>
                    <li>
                        Force any trade to be accepted by checking the Force
                        Trade checkbox before proposing a trade
                    </li>
                    <li>You can become the GM of another team at any time</li>
                    <li>You will never be fired!</li>
                    <li>You will be able to change the options below</li>
                </ul>

                <p>
                    However, if you enable God Mode within a league, you will
                    not get credit for any <a href="/account">Achievements</a>.
                    This persists even if you disable God Mode. You can only get
                    Achievements in a league where God Mode has never been
                    enabled.
                </p>

                <button
                    className={classNames(
                        "btn",
                        godMode ? "btn-success" : "btn-danger",
                    )}
                    onClick={this.handleGodModeToggle}
                >
                    {godMode ? "Disable God Mode" : "Enable God Mode"}
                </button>

                <h2 className="mt-3">God Mode Options</h2>

                <p className="text-danger">
                    These options are not well tested and might make the AI do
                    weird things.
                </p>

                <form onSubmit={this.handleFormSubmit}>
                    <h3 className="mt-3">League Structure</h3>
                    <div className="row">
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                # Games Per Season{" "}
                                <HelpPopover
                                    placement="right"
                                    title="# Games Per Season"
                                >
                                    This will only apply to seasons that have
                                    not started yet.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.numGames}
                                value={this.state.numGames}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Quarter Length (minutes)</label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.quarterLength}
                                value={this.state.quarterLength}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Min Roster Size</label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.minRosterSize}
                                value={this.state.minRosterSize}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Max Roster Size</label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.maxRosterSize}
                                value={this.state.maxRosterSize}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                # Playoff Games{" "}
                                <HelpPopover
                                    placement="right"
                                    title="# Playoff Games"
                                >
                                    Specify the number of games in each round.
                                    You must enter a valid JSON array of
                                    integers. For example, enter{" "}
                                    <code>[5, 7, 1]</code> for a 5 game first
                                    round series, a 7 game second round series,
                                    and a single winner-takes-all final game.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={
                                    this.handleChanges.numGamesPlayoffSeries
                                }
                                value={this.state.numGamesPlayoffSeries}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                # First Round Byes{" "}
                                <HelpPopover
                                    placement="right"
                                    title="# First Round Byes"
                                >
                                    Number of playoff teams who will get a bye
                                    in the first round. For leagues with two
                                    conferences, byes will be split evenly
                                    across conferences.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.numPlayoffByes}
                                value={this.state.numPlayoffByes}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Draft Type{" "}
                                <HelpPopover
                                    placement="right"
                                    title="Draft Type"
                                >
                                    <p>
                                        Currently this just changes the type of
                                        draft lottery.
                                    </p>
                                    <p>
                                        NBA 2019 is the current NBA draft
                                        lottery.
                                    </p>
                                    <p>
                                        NBA 1994 is the NBA draft lottery that
                                        was used from 1994 to 2018.
                                    </p>
                                    <p>
                                        No Lottery will order teams based on
                                        their record.
                                    </p>
                                </HelpPopover>
                            </label>
                            <select
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.draftType}
                                value={this.state.draftType}
                            >
                                <option value="nba2019">NBA 2019</option>
                                <option value="nba1994">NBA 1994</option>
                                <option value="noLottery">No Lottery</option>
                            </select>
                        </div>
                    </div>

                    <h3 className="mt-2">Finance</h3>
                    <div className="row">
                        <div className="col-sm-3 col-6 form-group">
                            <label>Salary Cap</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text">$</div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={!godMode}
                                    onChange={this.handleChanges.salaryCap}
                                    value={this.state.salaryCap}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">M</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Min Payroll</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text">$</div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={!godMode}
                                    onChange={this.handleChanges.minPayroll}
                                    value={this.state.minPayroll}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">M</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Luxury Tax Threshold</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text">$</div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={!godMode}
                                    onChange={this.handleChanges.luxuryPayroll}
                                    value={this.state.luxuryPayroll}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">M</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Luxury Tax{" "}
                                <HelpPopover
                                    placement="left"
                                    title="Luxury Tax"
                                >
                                    Take the difference between a team's payroll
                                    and the luxury tax threshold. Multiply that
                                    by this number. The result is the penalty
                                    they have to pay.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.luxuryTax}
                                value={this.state.luxuryTax}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Min Contract</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text">$</div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={!godMode}
                                    onChange={this.handleChanges.minContract}
                                    value={this.state.minContract}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">M</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Max Contract</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text">$</div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={!godMode}
                                    onChange={this.handleChanges.maxContract}
                                    value={this.state.maxContract}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">M</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Hard Cap{" "}
                                <HelpPopover placement="right" title="Hard Cap">
                                    <p>
                                        If this is enabled, then you can not
                                        exceed the salary cap to sign draft
                                        picks or re-sign players (like the{" "}
                                        <a
                                            href="https://en.wikipedia.org/wiki/NBA_salary_cap#Larry_Bird_exception"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Larry Bird exception
                                        </a>
                                        ) and you can not make trades that
                                        result in either team being over the
                                        salary cap.
                                    </p>
                                    <p>
                                        It is not really a strict hard cap,
                                        though. You can still go over the cap to
                                        sign free agents to minimum contracts,
                                        which is to guarantee that you never get
                                        stuck without enough players.
                                    </p>
                                    <p>This also disables the luxury tax.</p>
                                </HelpPopover>
                            </label>
                            <select
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.hardCap}
                                value={this.state.hardCap}
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                    </div>

                    <h3 className="mt-2">Events</h3>
                    <div className="row">
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Injuries{" "}
                                <HelpPopover placement="right" title="Injuries">
                                    This won't heal current injuries, but it
                                    will prevent any new ones from occurring.
                                </HelpPopover>
                            </label>
                            <select
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.disableInjuries}
                                value={this.state.disableInjuries}
                            >
                                <option value="false">Enabled</option>
                                <option value="true">Disabled</option>
                            </select>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Trades Between AI Teams</label>
                            <select
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.aiTrades}
                                value={this.state.aiTrades}
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>Players Can Refuse To Sign With You</label>
                            <select
                                className="form-control"
                                disabled={!godMode}
                                onChange={
                                    this.handleChanges.playersRefuseToNegotiate
                                }
                                value={this.state.playersRefuseToNegotiate}
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Injury Rate{" "}
                                <HelpPopover
                                    placement="right"
                                    title="Injury Rate"
                                >
                                    The injury rate is the probability that a
                                    player is injured per possession. Based on{" "}
                                    <a
                                        href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3445097/"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        this article
                                    </a>{" "}
                                    there are about 0.25 injuries per team per
                                    game, and with 10 players on the court and
                                    ~200 possessions per game, that works out to
                                    0.25/10/200 = 0.000125 by default.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.injuryRate}
                                value={this.state.injuryRate}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Tragic Death Rate{" "}
                                <HelpPopover
                                    placement="right"
                                    title="Tragic Death Rate"
                                >
                                    The tragic death rate is the probability
                                    that a player will die a tragic death on a
                                    given regular season day. Yes, this only
                                    happens in the regular season. With roughly
                                    100 days in a season, the default is about
                                    one death every 50 years, or 1/(50*100) =
                                    0.0002. If you set it too high and run out
                                    of players, then you'll have to use God Mode
                                    to either create more or bring some back
                                    from the dead.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.tragicDeathRate}
                                value={this.state.tragicDeathRate}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Brother Rate{" "}
                                <HelpPopover
                                    placement="right"
                                    title="Brother Rate"
                                >
                                    The probability that a new player will be
                                    the brother of an existing player.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.brotherRate}
                                value={this.state.brotherRate}
                            />
                        </div>
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Son Rate{" "}
                                <HelpPopover placement="right" title="Son Rate">
                                    The probability that a new player will be
                                    the son of an existing player.
                                </HelpPopover>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                disabled={!godMode}
                                onChange={this.handleChanges.sonRate}
                                value={this.state.sonRate}
                            />
                        </div>
                    </div>

                    <h3 className="mt-2">Game Simulation</h3>
                    <div className="row">
                        <div className="col-sm-3 col-6 form-group">
                            <label>
                                Home Court Advantage{" "}
                                <HelpPopover
                                    placement="right"
                                    title="Home Court Advantage"
                                >
                                    This is the percentage boost/penalty given
                                    to home/away player ratings. Default is 1%.
                                </HelpPopover>
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    disabled={!godMode}
                                    onChange={
                                        this.handleChanges.homeCourtAdvantage
                                    }
                                    value={this.state.homeCourtAdvantage}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary mt-3"
                        disabled={!godMode}
                    >
                        Save God Mode Options
                    </button>
                </form>
            </>
        );
    }
}

GodMode.propTypes = {
    disableInjuries: PropTypes.bool.isRequired,
    godMode: PropTypes.bool.isRequired,
    luxuryPayroll: PropTypes.number.isRequired,
    luxuryTax: PropTypes.number.isRequired,
    maxContract: PropTypes.number.isRequired,
    minContract: PropTypes.number.isRequired,
    minPayroll: PropTypes.number.isRequired,
    minRosterSize: PropTypes.number.isRequired,
    maxRosterSize: PropTypes.number.isRequired,
    numGames: PropTypes.number.isRequired,
    numTeams: PropTypes.number.isRequired,
    quarterLength: PropTypes.number.isRequired,
    salaryCap: PropTypes.number.isRequired,
    aiTrades: PropTypes.bool.isRequired,
    injuryRate: PropTypes.number.isRequired,
    tragicDeathRate: PropTypes.number.isRequired,
    brotherRate: PropTypes.number.isRequired,
    homeCourtAdvantage: PropTypes.number.isRequired,
    sonRate: PropTypes.number.isRequired,
    hardCap: PropTypes.bool.isRequired,
    numGamesPlayoffSeries: PropTypes.arrayOf(PropTypes.number).isRequired,
    numPlayoffByes: PropTypes.number.isRequired,
    draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery"]),
    playersRefuseToNegotiate: PropTypes.bool.isRequired,
};

export default GodMode;
