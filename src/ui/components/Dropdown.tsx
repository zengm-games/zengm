import findLast from "lodash-es/findLast";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import useDropdownOptions, {
	ResponsiveOption,
} from "../hooks/useDropdownOptions";
import { helpers, realtimeUpdate } from "../util";
import NextPrevButtons from "./NextPrevButtons";
import type { LocalStateUI } from "../../common/types";

// This assumes that when val is an array, it is already sorted by minWidth ascending
export const getResponsiveValue = (
	val: string | ResponsiveOption[],
	windowWidth: number,
) => {
	if (Array.isArray(val)) {
		return findLast(val, row => windowWidth >= row.minWidth)!.text;
	}

	return val;
};

const getResponsiveValue2 = (val: string | ResponsiveOption[]) => {
	return getResponsiveValue(val, window.innerWidth);
};

const Select = ({
	customOptions,
	field,
	handleChange,
	value,
}: {
	customOptions?: NonNullable<LocalStateUI["dropdownCustomOptions"]>[string];
	field: string;
	handleChange: (value: number | string) => void;
	value: number | string;
}) => {
	const options = useDropdownOptions(field, customOptions);
	const [width, setWidth] = useState<number | undefined>();

	useEffect(() => {
		const updateWidth = () => {
			let currentValue: string | ResponsiveOption[] = "";
			for (const option of options) {
				if (option.key === value) {
					currentValue = option.val;
					break;
				}
			}

			const el = document.createElement("select");
			el.style.display = "inline";
			el.className = "dropdown-select";
			const el2 = document.createElement("option");
			el2.innerHTML = getResponsiveValue2(currentValue);
			el.appendChild(el2);

			document.body.appendChild(el);
			setWidth(el.offsetWidth);

			document.body.removeChild(el);
		};

		updateWidth();

		// Currently there is a different font size defined for .dropdown-select based on this media query, so recompute the width when appropriate. Coincidentally, 768 is also
		const widthsToCheck = new Set([768]);

		// Also check any other widths where there is a breakpoint in the text of one of the options for this dropdown
		for (const { val } of options) {
			if (Array.isArray(val)) {
				for (const { minWidth } of val) {
					if (minWidth > -Infinity) {
						widthsToCheck.add(minWidth);
					}
				}
			}
		}

		// Use one media query per cutoff. At the time of writing, there is only ever one, at 768px. This is more efficient than listening for the window resize event and updating every time it changes.
		const mediaQueryLists = Array.from(widthsToCheck).map(widthToCheck => {
			const mediaQueryList = window.matchMedia(
				`(min-width: ${widthToCheck}px)`,
			);
			// Rather than addEventListener for Safari <14
			mediaQueryList.addListener(updateWidth);
			return mediaQueryList;
		});

		return () => {
			for (const mediaQueryList of mediaQueryLists) {
				// Rather than removeEventListener for Safari <14
				mediaQueryList.removeListener(updateWidth);
			}
		};
	}, [field, options, value]);

	const style: CSSProperties = {
		width,
	};

	if (options.length <= 1) {
		return null;
	}

	const showButtons =
		field.startsWith("teams") ||
		field.startsWith("seasons") ||
		field === "days";

	let buttons = null;
	if (showButtons) {
		const currentItem = options.find(option => option.key === value);

		buttons = (
			<NextPrevButtons
				currentItem={currentItem}
				items={options}
				onChange={newItem => {
					handleChange(newItem.key);
				}}
				reverse={field.startsWith("seasons")}
				style={{ marginLeft: 2 }}
			/>
		);
	}

	return (
		<div className="d-flex dropdown-select-wrapper">
			{buttons}
			<select
				value={value}
				className="dropdown-select"
				onChange={event => {
					handleChange(event.currentTarget.value);
				}}
				style={style}
			>
				{options.map(opt => {
					return (
						<option key={opt.key} value={opt.key}>
							{getResponsiveValue2(opt.val)}
						</option>
					);
				})}
			</select>
		</div>
	);
};

type Props = {
	customOptions?: LocalStateUI["dropdownCustomOptions"];
	customURL?: (fields: Record<string, number | string>) => string;
	fields: Record<string, number | string>;
	view: string;
};

const Dropdown = ({ customOptions, customURL, fields, view }: Props) => {
	const keys = Object.keys(fields);
	const values = Object.values(fields);

	const handleChange = (i: number, value: string | number) => {
		let url;
		if (customURL) {
			const newFields = {
				...fields,
				[keys[i]]: value,
			};

			url = customURL(newFields);
		} else {
			const newValues = values.slice();
			newValues[i] = value;
			const parts = [view, ...newValues];
			url = helpers.leagueUrl(parts);
		}

		realtimeUpdate([], url);
	};

	return (
		<>
			{keys.map((key, i) => {
				return (
					<Select
						customOptions={customOptions ? customOptions[key] : undefined}
						key={key}
						field={key}
						value={values[i]}
						handleChange={value => handleChange(i, value)}
					/>
				);
			})}
		</>
	);
};

export default Dropdown;
