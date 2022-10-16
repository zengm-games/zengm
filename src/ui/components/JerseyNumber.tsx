import classNames from "classnames";
import { useRef } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const getValidTeamColors = (t?: { colors: any }) => {
	const colors = ["#000000", "#cccccc", "#ffffff"];
	if (t && t.colors && Array.isArray(t.colors)) {
		for (let i = 0; i < 3; i++) {
			if (typeof t.colors[i] === "string") {
				colors[i] = t.colors[i];
			}
		}
	}
	return colors as [string, string, string];
};

const JerseyNumber = ({
	className,
	number,
	onClick,
	extraText,
	start,
	end,
	t,
	retired,
}: {
	className?: string;
	number: string;
	onClick?: () => void;
	extraText?: string;
	start: number;
	end: number;
	t?: {
		colors: [string, string, string];
		name: string;
		region: string;
	};
	retired?: boolean;
}) => {
	const colors = getValidTeamColors(t);

	let id = `${number}-${start}-${end}`;
	let text = "";
	if (t) {
		id += `-${t.region}-${t.name}`;
		text = `${t.region} ${t.name}, `;
	}

	if (start === end) {
		text += start;
	} else {
		text += `${start}-${end}`;
	}

	if (retired) {
		text += ` (retired${extraText ? `, ${extraText}` : ""})`;
	} else if (extraText) {
		text += ` (${extraText})`;
	}

	const border = retired
		? "4px double var(--bs-yellow)"
		: `2px solid ${colors[2]}`;

	let fontSize = 32;
	const numDigits = number.length;
	if (numDigits === 3) {
		fontSize = 26;
	} else if (numDigits === 4) {
		fontSize = 20;
	} else if (numDigits > 4) {
		fontSize = 17;
	}

	// On mobile, we show the jersey number popover on click, because there is no way to hover like on desktop. This means any onClick action (like toggling retirement) should happen only on subsequent clicks, while it's already open from the first click. That gets handled with onToggle, which fires before it opens, and gives us a chance to set preventNextClick.
	const preventNextClick = useRef(false);

	return (
		<OverlayTrigger
			onToggle={
				window.mobile
					? () => {
							preventNextClick.current = true;
					  }
					: undefined
			}
			overlay={<Tooltip id={id}>{text}</Tooltip>}
			placement="bottom"
		>
			<div
				className={classNames(
					"d-flex align-items-center justify-content-center",
					className,
					onClick ? "cursor-pointer" : undefined,
				)}
				style={{
					width: 55,
					height: 50,
					border,
					backgroundColor: colors[0],
					color: colors[1],
					fontSize,
				}}
				role={onClick ? "button" : undefined}
				onClick={
					onClick
						? () => {
								if (preventNextClick.current) {
									preventNextClick.current = false;
								} else {
									onClick();
								}
						  }
						: undefined
				}
			>
				{number}
			</div>
		</OverlayTrigger>
	);
};

export default JerseyNumber;
