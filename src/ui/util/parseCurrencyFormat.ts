import type { GameAttributesLeague } from "../../common/types.ts";

export const parseCurrencyFormat = (currencyFormat: string) => {
	const match = currencyFormat.match(
		/(?<prepend>.*)x(?<decimalSeparator>[,.])y(?<append>.*)/,
	);
	if (match) {
		return [
			match.groups!.prepend,
			match.groups!.decimalSeparator,
			match.groups!.append,
		] as GameAttributesLeague["currencyFormat"];
	}
};
