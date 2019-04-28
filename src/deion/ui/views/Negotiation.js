import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { NewWindowLink } from "../components";
import { helpers, logEvent, realtimeUpdate, setTitle, toWorker } from "../util";

// Show the negotiations list if there are more ongoing negotiations
async function redirectNegotiationOrRoster(cancelled) {
    const count = await toWorker("countNegotiations");
    if (count > 0) {
        realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
    } else if (cancelled || process.env.SPORT === "football") {
        // After signing player in football, go back to free agents screen, cause you probably need more
        realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
    } else {
        realtimeUpdate([], helpers.leagueUrl(["roster"]));
    }
}

const cancel = async pid => {
    await toWorker("cancelContractNegotiation", pid);
    redirectNegotiationOrRoster(true);
};

const sign = async (pid, amount, exp) => {
    const errorMsg = await toWorker(
        "acceptContractNegotiation",
        pid,
        Math.round(amount * 1000),
        exp,
    );
    if (errorMsg !== undefined && errorMsg) {
        logEvent({
            type: "error",
            text: errorMsg,
            saveToDb: false,
        });
    }
    redirectNegotiationOrRoster(false);
};

const Negotiation = ({
    hardCap,
    contractOptions,
    payroll,
    player = {},
    resigning,
    salaryCap,
    userTid,
}) => {
    setTitle(`Contract Negotiation - ${player.name}`);

    // See views.freeAgents for moods as well
    let mood;
    if (player.freeAgentMood[userTid] < 0.25) {
        mood = (
            <span className="text-success">
                <b>Eager to reach an agreement.</b>
            </span>
        );
    } else if (player.freeAgentMood[userTid] < 0.5) {
        mood = <b>Willing to sign for the right price.</b>;
    } else if (player.freeAgentMood[userTid] < 0.75) {
        mood = (
            <span className="text-warning">
                <b>Annoyed at you.</b>
            </span>
        );
    } else {
        mood = (
            <span className="text-danger">
                <b>Insulted by your presence.</b>
            </span>
        );
    }

    let message;
    if (resigning && !hardCap) {
        message = (
            <p>
                You are allowed to go over the salary cap to make this deal
                because you are re-signing{" "}
                <a href={helpers.leagueUrl(["player", player.pid])}>
                    {player.name}
                </a>{" "}
                to a contract extension.{" "}
                <b>
                    If you do not come to an agreement here,{" "}
                    <a href={helpers.leagueUrl(["player", player.pid])}>
                        {player.name}
                    </a>{" "}
                    will become a free agent.
                </b>{" "}
                He will then be able to sign with any team, and you won't be
                able to go over the salary cap to sign him.
            </p>
        );
    } else {
        const extra = !hardCap ? (
            <>
                {" "}
                because{" "}
                <a href={helpers.leagueUrl(["player", player.pid])}>
                    {player.name}
                </a>{" "}
                is a free agent
            </>
        ) : null;

        message = (
            <p>
                You are not allowed to go over the salary cap to make this deal
                (unless it is for a minimum contract){extra}.
            </p>
        );
    }

    return (
        <>
            <h1>
                Contract Negotiation <NewWindowLink />
            </h1>

            {message}

            <p>
                Current Payroll: {helpers.formatCurrency(payroll, "M")}
                <br />
                Salary Cap: {helpers.formatCurrency(salaryCap, "M")}
            </p>

            <h2>
                {" "}
                <a href={helpers.leagueUrl(["player", player.pid])}>
                    {player.name}
                </a>{" "}
                <NewWindowLink parts={["player", player.pid]} />
            </h2>
            <p>
                Mood: {mood}
                <br />
                {player.age} years old; Overall: {player.ratings.ovr};
                Potential: {player.ratings.pot}
            </p>

            <div className="row">
                <div className="col-sm-10 col-md-8 col-lg-6">
                    <div className="list-group">
                        {contractOptions.map((contract, i) => {
                            return (
                                <div
                                    key={i}
                                    className={classNames("list-group-item", {
                                        "list-group-item-success":
                                            contract.smallestAmount,
                                    })}
                                    style={{ height: "54px" }}
                                >
                                    <div
                                        className="float-left"
                                        style={{ paddingTop: "8px" }}
                                    >
                                        ${contract.amount.toFixed(2)}M per year
                                        <span className="d-none d-sm-inline">
                                            , through {contract.exp}
                                        </span>{" "}
                                        ({contract.years}{" "}
                                        {contract.years === 1
                                            ? "season"
                                            : "seasons"}
                                        )
                                    </div>

                                    <button
                                        className="btn btn-success float-right"
                                        onClick={() =>
                                            sign(
                                                player.pid,
                                                contract.amount,
                                                contract.exp,
                                            )
                                        }
                                    >
                                        Sign
                                        <span className="d-none d-sm-inline">
                                            {" "}
                                            Contract
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <button
                className="btn btn-danger mt-3"
                onClick={() => cancel(player.pid)}
            >
                Can't reach a deal? End negotiation
            </button>
        </>
    );
};

Negotiation.propTypes = {
    hardCap: PropTypes.bool.isRequired,
    contractOptions: PropTypes.arrayOf(
        PropTypes.shape({
            smallestAmount: PropTypes.bool.isRequired,
            amount: PropTypes.number.isRequired,
            years: PropTypes.number.isRequired,
            exp: PropTypes.number.isRequired,
        }),
    ).isRequired,
    payroll: PropTypes.number.isRequired,
    player: PropTypes.object.isRequired,
    resigning: PropTypes.bool.isRequired,
    salaryCap: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default Negotiation;
