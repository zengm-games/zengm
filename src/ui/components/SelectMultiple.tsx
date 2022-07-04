import { useMemo } from "react";
// @ts-expect-error
import Select from "react-select-virtualized";
import { groupByUnique } from "../../common/groupBy";

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
	const optionsByValue = useMemo(
		() => groupByUnique(options, getOptionValue),
		[getOptionValue, options],
	);

	return (
		<Select<T>
			classNamePrefix="dark-select"
			value={
				value != undefined
					? {
							label: getOptionLabel(value),
							value: getOptionValue(value),
					  }
					: undefined
			}
			isClearable={isClearable}
			onChange={(x: any) => onChange(optionsByValue[x.value])}
			options={options.map(option => ({
				label: getOptionLabel(option),
				value: getOptionValue(option),
			}))}
			isDisabled={disabled}
			isLoading={loading}
		/>
	);
};

export default SelectMultiple;
