import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const JerseyNumber = ({
	number,
	start,
	end,
	t,
}: {
	number: string;
	start: number;
	end: number;
	t?: {
		colors: [string, string, string];
		name: string;
		region: string;
	};
}) => {
	const colors = t ? t.colors : ["#000000", "#cccccc", "#ffffff"];

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

	return (
		<OverlayTrigger overlay={<Tooltip id={id}>{text}</Tooltip>}>
			<div
				style={{
					width: 55,
					height: 50,
					border: `2px solid ${colors[2]}`,
					backgroundColor: colors[0],
					color: colors[1],
					fontSize: 32,
					textAlign: "center",
					lineHeight: 1.4,
				}}
			>
				{number}
			</div>
		</OverlayTrigger>
	);
};

export default JerseyNumber;
