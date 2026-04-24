export const makeResponsiveDropdownOption = (short: string, long: string) => [
	{
		minWidth: -Infinity,
		text: short,
	},
	{
		minWidth: 768,
		text: long,
	},
];
