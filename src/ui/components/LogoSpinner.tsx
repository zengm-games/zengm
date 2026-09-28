import clsx from "clsx";
import type { CSSProperties } from "react";
import {
	getLogoSpinnerCssVars,
	getLogoSpinnerUrl,
	type LogoSpinnerSize,
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
	size: LogoSpinnerSize;
	spinning: boolean;
	style?: CSSProperties;
	title?: string;
}) => {
	const url1x = getLogoSpinnerUrl(size, gold);
	const url2x = getLogoSpinnerUrl(2 * size, gold);

	return (
		<span
			className={clsx("logo-spinner", !spinning && "logo-spinner-paused")}
			style={{ ...getLogoSpinnerCssVars(__SPORT, size), ...style }}
			title={title}
		>
			<img alt={alt} src={url1x} srcSet={`${url1x} 1x, ${url2x} 2x`} />
		</span>
	);
};

export default LogoSpinner;
