import PropTypes from "prop-types";
import React, { SyntheticEvent, useEffect, useState, ChangeEvent } from "react";
import useDropdownOptions from "../hooks/useDropdownOptions";
import { helpers, realtimeUpdate } from "../util";

const Select = ({
	field,
	handleChange,
	value,
}: {
	field: string;
	handleChange: (event: ChangeEvent<HTMLSelectElement>) => void;
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

	if (options.length === 1) {
		style.display = "none";
	}

	return (
		<>
			<select
				value={value}
				className="dropdown-select"
				onChange={handleChange}
				style={style}
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
	extraParam?: number | string;
	fields: {
		[key: string]: number | string;
	};
	view: string;
};

const Dropdown = ({ extraParam, fields, view }: Props) => {
	const keys = Object.keys(fields);
	const values = Object.values(fields);

	const handleChange = (
		i: number,
		event: SyntheticEvent<HTMLSelectElement>,
	) => {
		const newValues = values.slice();
		newValues[i] = event.currentTarget.value;
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
					<div key={key} className="form-group ml-1 mb-0">
						<Select
							field={key}
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
	fields: PropTypes.object.isRequired,
	view: PropTypes.string.isRequired,
};

export default Dropdown;
