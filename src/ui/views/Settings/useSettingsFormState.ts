import { ChangeEvent, useState } from "react";
import type { Settings } from "../../../worker/views/settings";
import gameSimPresets from "./gameSimPresets";
import { settings } from "./settings";
import {
	encodeDecodeFunctions,
	SpecialStateOthers,
	SPECIAL_STATE_ALL,
	SPECIAL_STATE_BOOLEANS,
	SPECIAL_STATE_OTHERS,
	State,
} from "./SettingsForm";
import type { FieldType, Key } from "./types";

const useSettingsFormState = ({
	initialSettings,
	onUpdateExtra,
}: {
	initialSettings: Settings;
	onUpdateExtra?: () => void;
}) => {
	const [gameSimPreset, setGameSimPresetRaw] = useState("default");

	const [state, setStateRaw] = useState<State>(() => {
		// @ts-expect-error
		const initialState: State = {};
		for (const { key, type, values } of settings) {
			if (SPECIAL_STATE_ALL.includes(key as any)) {
				continue;
			}

			const value = initialSettings[key];

			// https://github.com/microsoft/TypeScript/issues/21732
			const stringify = (encodeDecodeFunctions[type] as any).stringify;

			initialState[key] = stringify ? stringify(value, values) : value;
		}

		for (const key of [...SPECIAL_STATE_BOOLEANS, ...SPECIAL_STATE_OTHERS]) {
			(initialState as any)[key] = initialSettings[key];
		}

		return initialState;
	});
	const godMode = !!state.godMode;

	const setState = (arg: Parameters<typeof setStateRaw>[0]) => {
		setStateRaw(arg);
		onUpdateExtra?.();
	};

	const handleChange =
		(name: Key, type: FieldType) =>
		(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			let value: string;
			if (type === "bool") {
				value = String((event.target as any).checked);
			} else if (type === "floatValuesOrCustom") {
				if (event.target.value === "custom") {
					const raw = state[name];
					if (typeof raw !== "string") {
						throw new Error("Invalid value");
					}

					value = JSON.stringify([true, JSON.parse(raw)[1]]);
				} else {
					value = JSON.stringify([false, event.target.value]);
				}
			} else {
				value = event.target.value;
			}

			setState(prevState => ({
				...prevState,
				[name]: value,
			}));

			if (gameSimPresets && Object.keys(gameSimPresets[2020]).includes(name)) {
				setGameSimPresetRaw("default");
			}
		};

	const handleChangeRaw =
		<Name extends SpecialStateOthers>(name: Name) =>
		(value: State[Name]) => {
			setState(prevState => ({
				...prevState,
				[name]: value,
			}));
		};

	const setGameSimPreset = (newPreset: string) => {
		// @ts-expect-error
		const presets = gameSimPresets[newPreset];
		if (!presets) {
			return;
		}

		const presetsString: any = {};
		for (const [key, value] of Object.entries(presets)) {
			presetsString[key] = String(value);
		}

		setState(prevState => ({
			...prevState,
			...presetsString,
		}));
		setGameSimPresetRaw(newPreset);
	};

	return {
		godMode,
		handleChange,
		handleChangeRaw,
		state,
		setState,
		gameSimPreset,
		setGameSimPreset,
	};
};

export default useSettingsFormState;
