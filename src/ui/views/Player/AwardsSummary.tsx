import React from "react";

const style = { fontSize: "90%", width: 200 };

const AwardsSummary = ({ awardsGrouped }: { awardsGrouped: any[] }) => {
	if (awardsGrouped.length === 0) {
		return null;
	}

	return (
		<div className="flex-grow-1 clearfix" style={{ maxWidth: 500 }}>
			{awardsGrouped.map((a, i) => {
				return (
					<div
						key={i}
						className={`float-left badge badge-pill badge-secondary d-block mt-1 mr-1`}
						title={a.seasons.join(", ")}
						style={style}
					>
						{a.count > 1 ? `${a.count}x ` : null}
						{a.type}
					</div>
				);
			})}
		</div>
	);
};

export default AwardsSummary;
