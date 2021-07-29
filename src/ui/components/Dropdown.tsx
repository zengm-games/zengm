import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import useDropdownOptions from "../hooks/useDropdownOptions";
import { helpers, realtimeUpdate } from "../util";
import NextPrevButtons from "./NextPrevButtons";
import type { LocalStateUI } from "../../common/types";

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
		let currentValue;

		for (const option of options) {
			if (option.key === value) {
				currentValue = option.val;
			}
		}

		if (currentValue === undefined) {
			currentValue = "";
		}

		const el = document.createElement("select");
		el.style.display = "inline";
		el.style.fontSize = "14px";
		el.className = "dropdown-select";
		const el2 = document.createElement("option");
		el2.innerHTML = currentValue;
		el.appendChild(el2);

		document.body.appendChild(el);
		setWidth(el.offsetWidth);

		document.body.removeChild(el);
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
		<div
			className="d-flex"
			style={{
				marginLeft: 10,
			}}
		>
			{buttons}
			<div className="form-group mb-0">
				<select
					value={value}
					className="dropdown-select"
					onChange={event => {
						handleChange(event.currentTarget.value);
					}}
					style={style}
				>
					{options.map(opt => (
						<option key={opt.key} value={opt.key}>
							{opt.val}
						</option>
					))}
				</select>
			</div>
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
		<form className="form-inline">
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
