import React from "react";

const JerseyNumber = ({
	number,
	t,
}: {
	number: string;
	t?: {
		abbrev: string;
		colors: [string, string, string];
		name: string;
		region: string;
		tid: number;
	};
}) => {
	const colors = t ? t.colors : ["#000000", "#cccccc", "#ffffff"];

	return (
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
	);
};

export default JerseyNumber;
