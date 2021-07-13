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
	start,
	end,
	t,
	retired,
}: {
	className?: string;
	number: string;
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
		text += " (retired)";
	}

	const border = retired
		? "4px double var(--yellow)"
		: `2px solid ${colors[2]}`;

	return (
		<OverlayTrigger
			overlay={<Tooltip id={id}>{text}</Tooltip>}
			placement="bottom"
		>
			<div
				className={classNames(
					"d-flex align-items-center justify-content-center",
					className,
				)}
				style={{
					width: 55,
					height: 50,
					border,
					backgroundColor: colors[0],
					color: colors[1],
					fontSize: 32,
				}}
			>
				{number}
			</div>
		</OverlayTrigger>
	);
};

export default JerseyNumber;
