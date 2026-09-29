import clsx from "clsx";
import type { CSSProperties } from "react";
import {
	getLogoSpinnerCssVars,
	getLogoSpinnerUrl,
} from "../../../common/logoSpinners.ts";

const LogoSpinner = ({
	alt = "",
	gold = false,
	size,
	spinning,
	style,
	title,
}: {
	alt?: string;
	gold?: boolean;
	size: number;
	spinning: boolean;
	style?: CSSProperties;
	title?: string;
}) => {
	return (
		<span
			className={clsx("logo-spinner", !spinning && "logo-spinner-paused")}
			style={{ ...getLogoSpinnerCssVars(__SPORT, size), ...style }}
			title={title}
		>
			<img alt={alt} src={getLogoSpinnerUrl(gold)} />
		</span>
	);
};

export default LogoSpinner;
