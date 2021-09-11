import { useState } from "react";
import Select from "react-select";

const SelectMultiple = ({
	defaultValue,
	options,
	changing,
	isClearable = true,
	teamNumber,
	playerNumber,
	getOptionLabel,
}: {
	defaultValue: any;
	options: any[];
	changing: (arg: any) => boolean;
	isClearable?: boolean;
	teamNumber?: number;
	playerNumber?: number;
	getOptionLabel: any;
}) => {
	const [value, setValue] = useState(defaultValue);

	const handleChange = (p: any) => {
		const error = changing({
			p,
			teamNumber,
			playerNumber,
		});
		if (!error) {
			setValue(p);
		}
	};

	return (
		<Select
			classNamePrefix="dark-select"
			value={value}
			isClearable={isClearable}
			onChange={handleChange}
			options={options}
			getOptionValue={p => p.pid}
			getOptionLabel={getOptionLabel}
		/>
	);
};

export default SelectMultiple;
