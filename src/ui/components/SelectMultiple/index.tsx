import Select from "react-select";
import { CustomMenuList, CustomOption } from "./components";

const SelectMultiple = <T extends Record<string, unknown>>({
	value,
	options,
	onChange,
	isClearable = true,
	getOptionLabel,
	getOptionValue,
	disabled,
	loading,
}: {
	value: T | null | undefined;
	options: T[];
	onChange: (value: T | null) => void;
	isClearable?: boolean;
	getOptionLabel: (value: T) => string;
	getOptionValue: (value: T) => string;
	disabled?: boolean;
	loading?: boolean;
}) => {
	return (
		<Select<T>
			classNamePrefix="dark-select"
			value={value}
			isClearable={isClearable}
			onChange={onChange}
			options={options}
			getOptionValue={getOptionValue}
			getOptionLabel={getOptionLabel}
			isDisabled={disabled}
			isLoading={loading}
			components={{ Option: CustomOption, MenuList: CustomMenuList }}
		/>
	);
};

export default SelectMultiple;
