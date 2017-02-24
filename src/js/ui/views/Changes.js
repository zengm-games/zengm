import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import {NewWindowLink, SafeHtml} from '../components';

const Changes = ({changes}) => {
    bbgmViewReact.title('Changes');

    return <div>
        <h1>Changes <NewWindowLink /></h1>

        <ul>
            {changes.map((c, i) => {
                return <li key={i}>
                    <b>{c.date}</b>: <SafeHtml dirty={c.msg} />
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

export default Changes;
