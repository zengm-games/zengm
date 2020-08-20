// Handle quota errors and localStorage being undefined/null

const safeLocalStorage = {
	getItem(key: string) {
		if (!window.localStorage) {
			return null;
		}

		return window.localStorage.getItem(key);
	},

	setItem(key: string, value: string) {
		if (!window.localStorage) {
			return;
		}

		try {
			window.localStorage.setItem(key, value);
		} catch (error) {
			if (error.name !== "QuotaExceededError") {
				throw error;
			}
		}
	},

	removeItem(key: string) {
		if (!window.localStorage) {
			return null;
		}

		return window.localStorage.removeItem(key);
	},
};

export default safeLocalStorage;
