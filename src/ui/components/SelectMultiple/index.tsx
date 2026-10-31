import Select from "react-select";
import { CustomMenuList, CustomOption } from "./components.tsx";

const SelectMultiple = <T extends Record<string, unknown>>({
	ariaLabel,
	inputId,
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
	ariaLabel?: string;
	inputId?: string;
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
			aria-label={ariaLabel}
			classNamePrefix="dark-select"
			inputId={inputId}
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
