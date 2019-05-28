// @flow

import PropTypes from "prop-types";
import React from "react";
import { NewWindowLink, SafeHtml } from "../components";
import { setTitle } from "../util";

const Changes = ({ changes }: { changes: { date: string, msg: string }[] }) => {
    setTitle("Changes");

    return (
        <>
            <h1>
                Changes <NewWindowLink />
            </h1>

            <p>
                Only fairly significant user-facing changes are listed here, so
                you won't get bugged for every little new feature.
            </p>

            <ul>
                {changes.map((c, i) => {
                    return (
                        <li key={i}>
                            <b>{c.date}</b>: <SafeHtml dirty={c.msg} />
                        </li>
                    );
                })}
            </ul>
        </>
    );
};
Changes.propTypes = {
    changes: PropTypes.arrayOf(
        PropTypes.shape({
            date: PropTypes.string.isRequired,
            msg: PropTypes.string.isRequired,
        }),
    ),
};

export default Changes;
