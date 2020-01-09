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

		localStorage.setItem(`${key}:${this.name}`, JSON.stringify(value));
	}

	clear(key: string) {
		if (this.disabled) {
			return;
		}

		localStorage.removeItem(`${key}:${this.name}`);
	}
}

export default SettingsCache;
