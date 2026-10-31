import clsx from "clsx";
import type { CSSProperties } from "react";
import { getLogoSpinnerUrl } from "../../../common/logoSpinners.ts";

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
			style={{ "--logo-spinner-size": `${size}px`, ...style } as CSSProperties}
			title={title}
		>
			<img alt={alt} src={getLogoSpinnerUrl(gold)} />
		</span>
	);
};

export default LogoSpinner;
