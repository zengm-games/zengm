import { safeLocalStorage } from "../../util";

class SettingsCache {
	disabled: boolean;

	name: string;

	constructor(name: string, disabled: boolean) {
		this.name = name;
		this.disabled = disabled;
	}

	set(key: string, value: any) {
		if (this.disabled) {
			return;
		}

		safeLocalStorage.setItem(`${key}:${this.name}`, JSON.stringify(value));
	}

	get(key: string) {
		if (this.disabled) {
			return;
		}

		const raw = safeLocalStorage.getItem(`${key}:${this.name}`);
		if (raw === null) {
			return;
		}

		try {
			return JSON.parse(raw);
		} catch (error) {
			return;
		}
	}

	clear(key: string) {
		if (this.disabled) {
			return;
		}

		safeLocalStorage.removeItem(`${key}:${this.name}`);
	}
}

export default SettingsCache;
