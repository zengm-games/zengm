import classNames from "classnames";
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

	return (
		<OverlayTrigger
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
				onClick={onClick}
			>
				{number}
			</div>
		</OverlayTrigger>
	);
};

export default JerseyNumber;
