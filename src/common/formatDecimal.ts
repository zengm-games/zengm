const formatters = new Map<string, Intl.NumberFormat>();

export type FormatDecimalOptions = {
	minimumFractionDigits?: number;
	maximumFractionDigits: number;
};

// Same output as value.toLocaleString("en-US", { minimumFractionDigits, maximumFractionDigits })
export const formatDecimal = (
	value: number,
	{ minimumFractionDigits, maximumFractionDigits }: FormatDecimalOptions,
): string => {
	const key = `${minimumFractionDigits}-${maximumFractionDigits}`;
	let formatter = formatters.get(key);
	if (formatter === undefined) {
		formatter = new Intl.NumberFormat("en-US", {
			minimumFractionDigits,
			maximumFractionDigits,
		});
		formatters.set(key, formatter);
	}

	return formatter.format(value);
};
