import createDOMPurify from "dompurify";
const DOMPurify = createDOMPurify(window);
DOMPurify.setConfig({ ADD_ATTR: ["target"] });

const sanitize = (dirty: string) => {
	return DOMPurify.sanitize(dirty);
};

export default sanitize;
