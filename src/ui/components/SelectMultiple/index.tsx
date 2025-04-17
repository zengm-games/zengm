import Select from "react-select";
import { CustomMenuList, CustomOption } from "./components.tsx";

const SelectMultiple = <T extends Record<string, unknown>>({
	value,
	options,
	onChange,
	isClearable = true,
	getOptionLabel,
	getOptionValue,
	disabled,
	loading,
	virtualize = true,
}: {
	value: T | null | undefined;
	options: (
		| T
		| {
				label: string;
				options: T[];
		  }
	)[];
	onChange: (value: T | null) => void;
	isClearable?: boolean;
	getOptionLabel: (value: T) => string;
	getOptionValue: (value: T) => string;
	disabled?: boolean;
	loading?: boolean;
	virtualize?: boolean;
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
			components={
				virtualize
					? { Option: CustomOption, MenuList: CustomMenuList }
					: undefined
			}
		/>
	);
};

export default SelectMultiple;
