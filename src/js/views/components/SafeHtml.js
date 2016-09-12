const createDOMPurify = require('dompurify');
const React = require('react');

const DOMPurify = createDOMPurify(window);

const SafeHtml = ({dirty}) => {
    const clean = DOMPurify.sanitize(dirty);

    // eslint-disable-next-line react/no-danger
    return <span dangerouslySetInnerHTML={{__html: clean}} />;
};

SafeHtml.propTypes = {
    dirty: React.PropTypes.string.isRequired,
};

module.exports = SafeHtml;
