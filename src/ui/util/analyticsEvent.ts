const analyticsEvent = (
	eventName: string,
	parameters?: Record<string, string | number>,
) => {
	if (window.enableLogging && window.gtag) {
		window.gtag("event", eventName, parameters);
	}
};

export default analyticsEvent;
