import PropTypes from "prop-types";
import React, { useState } from "react";
import { helpers, realtimeUpdate, setTitle, toWorker } from "../util";

const DeleteLeague = ({ lid, name, numPlayers, numSeasons }) => {
    const [deleting, setDeleting] = useState(false);

    const handleDeleteLeague = async lid2 => {
        setDeleting(true);
        await toWorker("removeLeague", lid2);
        await realtimeUpdate([], "/");
    };

    setTitle(`Delete League ${lid}?`);

    let message;
    if (name !== undefined) {
        message = (
            <p>
                Are you <i>absolutely</i> sure you want to delete {name} (League{" "}
                {lid}
                )? You will <i>permanently</i> lose any record of all{" "}
                {helpers.numberWithCommas(numSeasons)} seasons and{" "}
                {helpers.numberWithCommas(numPlayers)} players from this league
                (well... unless you have a backup somewhere).
            </p>
        );
    } else {
        message = (
            <p>
                Are you <i>absolutely</i> sure you want to delete League {lid}?
                You will <i>permanently</i> lose any record of all seasons,
                players, and games from this league (well... unless you have a
                backup somewhere).
            </p>
        );
    }

    return (
        <>
            <h1>Delete League {lid}?</h1>

            {message}

            <button
                className="btn btn-danger float-left mr-3"
                disabled={deleting}
                onClick={() => handleDeleteLeague(lid)}
            >
                Yes, I am sure. Delete it!
            </button>
            <button
                className="btn btn-light-bordered"
                disabled={deleting}
                onClick={() => realtimeUpdate([], "/")}
            >
                Cancel
            </button>
        </>
    );
};

DeleteLeague.propTypes = {
    lid: PropTypes.number.isRequired,
    name: PropTypes.string,
    numGames: PropTypes.number,
    numPlayers: PropTypes.number,
    numSeasons: PropTypes.number,
};

export default DeleteLeague;
