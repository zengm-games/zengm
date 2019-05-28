// @flow

import createDOMPurify from "dompurify";
import PropTypes from "prop-types";
import React from "react";

const DOMPurify = createDOMPurify(window);

const SafeHtml = ({ dirty }: { dirty: string }) => {
    const clean = DOMPurify.sanitize(dirty);

    // eslint-disable-next-line react/no-danger
    return <span dangerouslySetInnerHTML={{ __html: clean }} />;
};

SafeHtml.propTypes = {
    dirty: PropTypes.string.isRequired,
};

export default SafeHtml;
