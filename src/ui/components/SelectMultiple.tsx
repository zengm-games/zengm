import Select from "react-windowed-select";

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
		// @ts-expect-error
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
		/>
	);
};

export default SelectMultiple;
