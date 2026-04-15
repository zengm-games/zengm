import DOMPurify from "dompurify";
DOMPurify.setConfig({ ADD_ATTR: ["target"] });

export const sanitize = (dirty: string) => {
	return DOMPurify.sanitize(dirty);
};
