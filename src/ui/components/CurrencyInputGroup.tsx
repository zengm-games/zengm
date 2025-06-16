import type { CSSProperties, ReactNode } from "react";
import { useLocal } from "../util/local.ts";

export const CurrencyInputGroup = ({
	children,
	displayUnit,
	style,
}: {
	children: ReactNode;
	displayUnit?: string;
	style?: CSSProperties;
}) => {
	const currencyFormat = useLocal((state) => state.currencyFormat);

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
