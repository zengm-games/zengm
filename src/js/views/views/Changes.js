const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const {NewWindowLink} = require('../components/index');

const Changes = ({changes = []}) => {
    bbgmViewReact.title('Changes');

    return <div>
        <h1>Changes <NewWindowLink /></h1>

        <ul>
            {changes.map((c, i) => {
                return <li key={i}>
                    <b>{c.date}</b>: <span dangerouslySetInnerHTML={{__html: c.msg}} />
                </li>;
            })}
        </ul>

        <p>Data only goes back to September 21, 2013. Only relatively significant user-facing changes are listed here, so you won't get bugged for every little new feature.</p>
    </div>;
};
Changes.propTypes = {
    changes: React.PropTypes.arrayOf(React.PropTypes.shape({
        date: React.PropTypes.string.isRequired,
        msg: React.PropTypes.string.isRequired,
    })),
};

module.exports = Changes;
