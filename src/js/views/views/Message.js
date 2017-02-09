// @flow

import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import {NewWindowLink, SafeHtml} from '../components';
import type {Message as Message_} from '../../util/types';

type MessageProps = {
    message: void | Message_,
};

const Message = ({message}: MessageProps) => {
    if (!message) {
        bbgmViewReact.title('Message');

        return <div>
            <h1>Error</h1>
            <p>Message not found.</p>
        </div>;
    }

    bbgmViewReact.title(`Message From ${message.from}`);

    return <div>
        <h4 style={{marginTop: '23px'}}>From: {message.from}, {message.year} <NewWindowLink /></h4>

        <SafeHtml dirty={message.text} />

        <p><a href={helpers.leagueUrl(['inbox'])}>Return To Inbox</a></p>
    </div>;
};

Message.propTypes = {
    message: React.PropTypes.shape({
        from: React.PropTypes.string.isRequired,
        text: React.PropTypes.string.isRequired,
        year: React.PropTypes.number.isRequired,
    }),
};

export default Message;
