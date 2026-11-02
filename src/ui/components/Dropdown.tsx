import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import {
	dropdownOptionsStateKeys,
	getDropdownOptions,
	getDropdownUrlPart,
	type DropdownLabel,
	type DropdownOption,
	type DropdownOptionsSource,
	findDropdownOption,
} from "../hooks/useDropdownOptions.tsx";
import { realtimeUpdate } from "../util/realtimeUpdate.ts";
import { NextPrevButtons } from "./NextPrevButtons.tsx";
import { useLocal } from "../util/local.ts";

type DropdownButtons = "forward" | "reverse";

export type TitleBarDropdownField<Key extends string = string> = {
	key: Key;
	options: DropdownOptionsSource;
	value: number | string;

	// Next/previous buttons next to the dropdown. Teams default to "forward", seasons default to "reverse" because they are listed newest first, and anything else defaults to no buttons.
	buttons?: DropdownButtons;
};

export type TitleBarDropdown = {
	fields: TitleBarDropdownField[];

	// Receives the URL part for each field, keyed by field key, with the newly selected value for the field that changed
	getUrl: (values: Record<string, number | string>) => string;
};

const getButtons = (
	field: TitleBarDropdownField,
): DropdownButtons | undefined => {
	if (field.buttons !== undefined) {
		return field.buttons;
	}

	if (Array.isArray(field.options)) {
		return undefined;
	}

	if (field.options.type === "teams") {
		return "forward";
	}

	return "reverse";
};

// This assumes that when val is an array, it is already sorted by minWidth ascending
export const getResponsiveValue = (val: DropdownLabel, windowWidth: number) => {
	if (Array.isArray(val)) {
		return val.findLast((row) => windowWidth >= row.minWidth)!.text;
	}

	return val;
};

const getResponsiveValue2 = (val: DropdownLabel) => {
	return getResponsiveValue(val, window.innerWidth);
};

// Chrome 123, Firefox 152, Safari 26.2 - use this always, get rid of manual width calculation
const SUPPORTS_FIELD_SIZING_CONTENT = CSS.supports("field-sizing", "content");

const Select = ({
	buttons,
	handleChange,
	options,
	value,
}: {
	buttons: DropdownButtons | undefined;
	handleChange: (option: DropdownOption) => void;
	options: DropdownOption[];
	value: number | string;
}) => {
	const selectRef = useRef<HTMLSelectElement>(null);

	const currentOption = findDropdownOption(options, value);

	const updateWidth = useCallback(() => {
		if (SUPPORTS_FIELD_SIZING_CONTENT) {
			return;
		}

		const el = document.createElement("select");
		el.style.display = "inline";
		el.className = "dropdown-select";
		const el2 = document.createElement("option");
		el2.textContent = currentOption
			? getResponsiveValue2(currentOption.label)
			: "";
		el.append(el2);

		document.body.append(el);
		const width = el.offsetWidth;
		document.body.removeChild(el);

		if (selectRef.current) {
			selectRef.current.style.width = `${width}px`;
		}
	}, [currentOption]);

	useLayoutEffect(() => {
		updateWidth();
	}, [updateWidth]);

	useEffect(() => {
		if (SUPPORTS_FIELD_SIZING_CONTENT) {
			return;
		}

		// Currently there is a different font size defined for .dropdown-select based on this media query, so recompute the width when appropriate. Coincidentally, 768 is also
		const widthsToCheck = new Set([768]);

		// Also check any other widths where there is a breakpoint in the text of one of the options for this dropdown
		for (const { label } of options) {
			if (Array.isArray(label)) {
				for (const { minWidth } of label) {
					if (minWidth > -Infinity) {
						widthsToCheck.add(minWidth);
					}
				}
			}
		}

		// Use one media query per cutoff. At the time of writing, there is only ever one, at 768px. This is more efficient than listening for the window resize event and updating every time it changes.
		const mediaQueryLists = Array.from(widthsToCheck).map((widthToCheck) => {
			const mediaQueryList = window.matchMedia(
				`(min-width: ${widthToCheck}px)`,
			);
			mediaQueryList.addEventListener("change", updateWidth);
			return mediaQueryList;
		});

		return () => {
			for (const mediaQueryList of mediaQueryLists) {
				mediaQueryList.removeEventListener("change", updateWidth);
			}
		};
	}, [options, updateWidth]);

	const style: CSSProperties | undefined = SUPPORTS_FIELD_SIZING_CONTENT
		? {
				fieldSizing: "content",
			}
		: undefined;

	if (options.length <= 1) {
		return null;
	}

	return (
		<div className="d-flex dropdown-select-wrapper">
			{buttons ? (
				<NextPrevButtons
					currentItem={currentOption}
					items={options}
					onChange={handleChange}
					reverse={buttons === "reverse"}
					style={{ marginLeft: 2 }}
				/>
			) : null}
			<select
				value={String(value)}
				className="dropdown-select"
				onChange={(event) => {
					const option = findDropdownOption(options, event.currentTarget.value);
					if (option) {
						handleChange(option);
					}
				}}
				ref={selectRef}
				style={style}
			>
				{options.map((option) => {
					return (
						<option key={option.key} value={String(option.key)}>
							{getResponsiveValue2(option.label)}
						</option>
					);
				})}
			</select>
		</div>
	);
};

export const Dropdown = ({ dropdown }: { dropdown: TitleBarDropdown }) => {
	const state = useLocal([...dropdownOptionsStateKeys]);

	const fieldOptions = dropdown.fields.map((field) =>
		getDropdownOptions(field.options, state),
	);

	const handleChange = (i: number, newOption: DropdownOption) => {
		const values: Record<string, number | string> = {};
		for (const [j, field] of dropdown.fields.entries()) {
			values[field.key] =
				i === j
					? (newOption.urlPart ?? newOption.key)
					: getDropdownUrlPart(fieldOptions[j]!, field.value);
		}

		realtimeUpdate([], dropdown.getUrl(values));
	};

	return (
		<>
			{dropdown.fields.map((field, i) => {
				return (
					<Select
						key={field.key}
						buttons={getButtons(field)}
						handleChange={(option) => handleChange(i, option)}
						options={fieldOptions[i]!}
						value={field.value}
					/>
				);
			})}
		</>
	);
};
