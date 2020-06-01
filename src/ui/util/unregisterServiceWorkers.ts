// Call if somehow we know that a newer version exists, like by checking against a previously loaded BBGM version or if there is a higher IndexedDB version than expected
const unregisterServiceWorkers = async () => {
	if (window.navigator.serviceWorker) {
		const registrations = await window.navigator.serviceWorker.getRegistrations();
		for (const registration of registrations) {
			await registration.unregister();
		}
	}
};

export default unregisterServiceWorkers;
