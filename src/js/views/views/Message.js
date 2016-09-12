const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {NewWindowLink, SafeHtml} = require('../components');

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

module.exports = Message;
