// @flow

import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import useDropdownOptions from "../hooks/useDropdownOptions";
import { helpers, realtimeUpdate } from "../util";

const Select = ({ field, handleChange, value }) => {
	const options = useDropdownOptions(field);

	const [width, setWidth] = useState();

	useEffect(() => {
		const el = document.createElement("span");
		el.style.padding = "0 14px";
		el.style.fontSize = "14px";
		document.body.appendChild(el);

		let currentValue;
		for (const option of options) {
			if (option.key === value) {
				currentValue = option.val;
			}
		}

		el.innerHTML = currentValue;
		setWidth(el.offsetWidth);
		document.body.removeChild(el);
	}, [field, options, value]);

	return (
		<>
			<select
				value={value}
				className="dropdown-select"
				onChange={handleChange}
				style={{ width }}
			>
				{options.map(opt => (
					<option key={opt.key} value={opt.key}>
						{opt.val}
					</option>
				))}
			</select>
		</>
	);
};

Select.propTypes = {
	field: PropTypes.string.isRequired,
	handleChange: PropTypes.func.isRequired,
	value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

type Props = {
	extraParam?: number | string,
	fields: string[],
	values: (number | string)[],
	view: string,
};

const Dropdown = ({ extraParam, fields, values, view }: Props) => {
	const handleChange = (
		i: number,
		event: SyntheticInputEvent<HTMLSelectElement>,
	) => {
		const newValues = values.slice();
		newValues[i] = event.currentTarget.value;

		const parts = [view].concat(newValues);
		if (extraParam !== undefined) {
			parts.push(extraParam);
		}

		realtimeUpdate([], helpers.leagueUrl(parts));
	};

	return (
		<form className="form-inline">
			{fields.map((field, i) => {
				return (
					<div key={field} className="form-group ml-1 mb-0">
						<Select
							field={field}
							value={values[i]}
							handleChange={event => handleChange(i, event)}
						/>
					</div>
				);
			})}
		</form>
	);
};

Dropdown.propTypes = {
	extraParam: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	fields: PropTypes.arrayOf(PropTypes.string).isRequired,
	values: PropTypes.array.isRequired,
	view: PropTypes.string.isRequired,
};

export default Dropdown;
