import createDOMPurify from "dompurify";
import PropTypes from "prop-types";
import React from "react";
const DOMPurify = createDOMPurify(window);
DOMPurify.setConfig({ ADD_ATTR: ["target"] });

const SafeHtml = ({ dirty }: { dirty: string }) => {
	const clean = DOMPurify.sanitize(dirty);

	return (
		<span
			dangerouslySetInnerHTML={{
				__html: clean,
			}}
		/>
	);
};

SafeHtml.propTypes = {
	dirty: PropTypes.string.isRequired,
};

export default SafeHtml;
