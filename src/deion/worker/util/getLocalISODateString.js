// @flow

const getLocalISODateString = () => {
	const tzoffset = new Date().getTimezoneOffset() * 60000; // [milliseconds]
	return new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
};

export default getLocalISODateString;
