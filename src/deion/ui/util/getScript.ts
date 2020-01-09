// Alternative to jQuery.getScript, mostly from https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement
const getScript = (url: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const head = document.head || document.getElementsByTagName("head")[0];
		const script = document.createElement("script");
		script.async = true;
		script.type = "text/javascript";

		script.onerror = err => {
			reject(err);
		};

		script.onload = () => {
			resolve();
		};

		head.appendChild(script);
		script.src = url;
	});
};

export default getScript;
