export const parseCurrencyFormat = (currencyFormat: string) => {
	const match = currencyFormat.match(
		/(?<prepend>.*)x(?<decimalSeparator>[,.])y(?<append>.*)/,
	);
	if (match) {
		return {
			append: match.groups!.append!,
			decimalSeparator: match.groups!.decimalSeparator!,
			prepend: match.groups!.prepend!,
		};
	}
};
