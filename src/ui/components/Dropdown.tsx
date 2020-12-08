import PropTypes from "prop-types";
import React, { SyntheticEvent, useEffect, useState } from "react";
import useDropdownOptions from "../hooks/useDropdownOptions";
import { helpers, realtimeUpdate } from "../util";

const Select = ({
	field,
	handleChange,
	value,
}: {
	field: string;
	handleChange: (value: number | string) => void;
	value: number | string;
}) => {
	const options = useDropdownOptions(field);
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

	const style: React.CSSProperties = {
		width,
	};

	if (options.length <= 1) {
		return null;
	}

	const optionIndex = options.findIndex(option => option.key === value);

	const showButtons = field.startsWith("teams") || field.startsWith("seasons");

	let buttons = null;
	if (showButtons) {
		const buttonInfo = [
			{
				disabled: optionIndex <= 0,
				onClick: (event: SyntheticEvent) => {
					event.preventDefault();
					handleChange(options[optionIndex - 1].key);
				},
			},
			{
				disabled: optionIndex >= options.length - 1,
				onClick: (event: SyntheticEvent) => {
					event.preventDefault();
					handleChange(options[optionIndex + 1].key);
				},
			},
		];

		// Seasons are displayed in reverse order in the dropdown, and "prev" should be "back in time"
		const reverseOrder = field.startsWith("seasons");
		if (reverseOrder) {
			buttonInfo.reverse();
		}

		buttons = (
			<div className="btn-group" style={{ marginLeft: 2 }}>
				<button
					className="btn btn-light-bordered btn-xs"
					disabled={buttonInfo[0].disabled}
					onClick={buttonInfo[0].onClick}
					title="Previous"
				>
					<span className="glyphicon glyphicon-menu-left" />
				</button>
				<button
					className="btn btn-light-bordered btn-xs"
					disabled={buttonInfo[1].disabled}
					onClick={buttonInfo[1].onClick}
					title="Next"
				>
					<span className="glyphicon glyphicon-menu-right" />
				</button>
			</div>
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
	extraParam?: number | string;
	fields: {
		[key: string]: number | string;
	};
	view: string;
};

const Dropdown = ({ extraParam, fields, view }: Props) => {
	const keys = Object.keys(fields);
	const values = Object.values(fields);

	const handleChange = (i: number, value: string | number) => {
		const newValues = values.slice();
		newValues[i] = value;
		const parts = [view, ...newValues];

		if (extraParam !== undefined) {
			parts.push(extraParam);
		}

		realtimeUpdate([], helpers.leagueUrl(parts));
	};

	return (
		<form className="form-inline">
			{keys.map((key, i) => {
				return (
					<Select
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

Dropdown.propTypes = {
	extraParam: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	fields: PropTypes.object.isRequired,
	view: PropTypes.string.isRequired,
};

export default Dropdown;
