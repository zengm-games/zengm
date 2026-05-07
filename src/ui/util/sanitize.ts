import DOMPurify from "dompurify";
DOMPurify.setConfig({ ADD_ATTR: ["target"] });

export const sanitize = (dirty: string) => {
	// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API - Chrome 146, Firefox 150, Safari ?
	return DOMPurify.sanitize(dirty);
};
