import { settings } from "./settings.tsx";
import type { Key } from "./types.ts";

const settingsByKey = Map.groupBy(settings, (row) => row.key);

// Given some keys that have values, get the keys to pass to the settingsShown prop of SettingsForm
export const getSettingsShown = (keys: string[]) => {
	// Handle adding parent of hidden key
	return keys.flatMap((key) => {
		const setting = settingsByKey.get(key as Key)?.[0];

		if (!setting) {
			// Remove any non-Key elements
			return [];
		}

		if (setting.hidden) {
			const partner = settings.find((setting) =>
				setting?.partners?.includes(key as Key),
			);
			if (partner) {
				return [key, partner.key];
			}
		}

		return key;
	}) as Key[];
};
