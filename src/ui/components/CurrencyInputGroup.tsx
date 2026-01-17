import type { CSSProperties, ReactNode } from "react";
import { useLocalPartial } from "../util/local.ts";
import defaultGameAttributes from "../../common/defaultGameAttributes.ts";

export const CurrencyInputGroup = ({
	children,
	displayUnit,
	style,
}: {
	children: ReactNode;
	displayUnit?: string;
	style?: CSSProperties;
}) => {
	const local = useLocalPartial(["currencyFormat", "lid"]);

	// If no lid, that means we're on the settings page for a new league and we should use the default currencyFormat in the UI
	const currencyFormat =
		local.lid !== undefined
			? local.currencyFormat
			: defaultGameAttributes.currencyFormat;

	return (
		<div className="input-group" style={style}>
			{currencyFormat[0] ? (
				<div className="input-group-text">{currencyFormat[0]}</div>
			) : null}
			{children}
			{currencyFormat[2] || displayUnit ? (
				<div className="input-group-text">
					{displayUnit} {currencyFormat[2]}
				</div>
			) : null}
		</div>
	);
};
