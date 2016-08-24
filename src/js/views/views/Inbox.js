const classNames = require('classnames');
const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {NewWindowLink} = require('../components');

const Inbox = ({anyUnread = false, messages = []}) => {
    bbgmViewReact.title('Inbox');

    return <div>
        <h1>Inbox <NewWindowLink /></h1>

        {anyUnread ? <p className="text-danger">You have a new message. Read it before continuing.</p> : null}

        <table className="table table-striped table-bordered table-condensed" id="messages">
            <tbody data-bind="foreach: messages">
                {messages.map(({from, mid, read, text, year}) => {
                    return <tr key={mid} className={classNames({unread: !read})}>
                        <td className="year"><a href={helpers.leagueUrl(['message', mid])}>{year}</a></td>
                        <td className="from"><a href={helpers.leagueUrl(['message', mid])}>{from}</a></td>
                        <td className="text"><a href={helpers.leagueUrl(['message', mid])}>{text}</a></td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;
};
Inbox.propTypes = {
    anyUnread: React.PropTypes.bool,
    messages: React.PropTypes.arrayOf(React.PropTypes.shape({
        from: React.PropTypes.string.isRequired,
        mid: React.PropTypes.number.isRequired,
        read: React.PropTypes.bool.isRequired,
        text: React.PropTypes.string.isRequired,
        year: React.PropTypes.number.isRequired,
    })),
};

module.exports = Inbox;
