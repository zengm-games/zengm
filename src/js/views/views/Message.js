import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import helpers from '../../util/helpers';
import {NewWindowLink, SafeHtml} from '../components';

const Message = ({message = {}}) => {
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
    }).isRequired,
};

export default Message;
