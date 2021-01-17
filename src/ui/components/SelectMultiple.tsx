import { useState } from "react";
import Select from "react-select";

const SelectReact = ({
	defaultValue,
	options,
	changing,
	teamNumber,
	playerNumber,
	getOptionLabel,
}: {
	defaultValue: any;
	options: any[];
	changing: (arg: any) => boolean;
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
			isClearable
			onChange={handleChange}
			options={options}
			getOptionValue={p => p.pid}
			getOptionLabel={getOptionLabel}
		/>
	);
};

export default SelectReact;
