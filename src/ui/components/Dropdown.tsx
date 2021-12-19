import findLast from "lodash-es/findLast";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
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
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const trackWindowWidth = options.some(option => Array.isArray(option.val));
	useEffect(() => {
		// Only track if we have some responsive options
		if (trackWindowWidth) {
			const updateWindowWidth = () => {
				setWindowWidth(window.innerWidth);
			};

			window.addEventListener("optimizedResize", updateWindowWidth);
			return () => {
				window.removeEventListener("optimizedResize", updateWindowWidth);
			};
		}
	}, [trackWindowWidth]);

	const getResponsiveValue2 = useCallback(
		(val: string | ResponsiveOption[]) => {
			return getResponsiveValue(val, windowWidth);
		},
		[windowWidth],
	);

	useEffect(() => {
		let currentValue: string | ResponsiveOption[] = "";
		for (const option of options) {
			if (option.key === value) {
				currentValue = option.val;
				break;
			}
		}

		const el = document.createElement("select");
		el.style.display = "inline";
		el.style.fontSize = "14px";
		el.className = "dropdown-select";
		const el2 = document.createElement("option");
		el2.innerHTML = getResponsiveValue2(currentValue);
		el.appendChild(el2);

		document.body.appendChild(el);
		setWidth(el.offsetWidth);

		document.body.removeChild(el);
	}, [field, getResponsiveValue2, options, value]);

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
		<div
			className="d-flex"
			style={{
				marginLeft: 10,
			}}
		>
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

Select.propTypes = {
	field: PropTypes.string.isRequired,
	handleChange: PropTypes.func.isRequired,
	value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
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
		<form className="d-flex">
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
		</form>
	);
};

export default Dropdown;
