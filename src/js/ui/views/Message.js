// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { NewWindowLink, SafeHtml } from "../components";
import { setTitle } from "../util";
import type { Message as Message_ } from "../../common/types";

type MessageProps = {
    message: void | Message_,
};

const Message = ({ message }: MessageProps) => {
    if (!message) {
        setTitle("Message");

        return (
            <div>
                <h1>Error</h1>
                <p>Message not found.</p>
            </div>
        );
    }

    setTitle(`Message From ${message.from}`);

    return (
        <div>
            <h4 style={{ marginTop: "23px" }}>
                From: {message.from}, {message.year} <NewWindowLink />
            </h4>

            <SafeHtml dirty={message.text} />

            <p>
                <a
                    onClick={() => window.history.back()}
                    style={{ cursor: "pointer" }}
                >
                    Return To Previous Page
                </a>
            </p>
        </div>
    );
};

Message.propTypes = {
    message: PropTypes.shape({
        from: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        year: PropTypes.number.isRequired,
    }),
};

export default Message;
