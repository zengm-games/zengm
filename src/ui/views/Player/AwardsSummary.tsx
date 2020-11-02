import React from "react";
import type { Player } from "../../../common/types";
import { groupAwards } from "../../util";

const style = { fontSize: "90%", width: 160 };

const AwardsSummary = ({ awards }: { awards: Player["awards"] }) => {
	if (awards.length === 0) {
		return null;
	}

	const awardsGrouped = groupAwards(awards);

	// "First Team All-League", "Second Team All-League", "Third Team All-League", "First Team All-Defensive", "Second Team All-Defensive", "Third Team All-Defensive",

	return (
		<div className="flex-grow-1 clearfix" style={{ maxWidth: 500 }}>
			{awardsGrouped.map((a, i) => {
				let type = a.type.endsWith("Leader")
					? a.type.replace("League ", "")
					: a.type;

				type = type.replace("First", "1st");
				type = type.replace("Second", "2nd");
				type = type.replace("Third", "3rd");

				return (
					<div
						key={i}
						className={`float-left badge badge-pill badge-secondary d-block mt-1 mr-1`}
						title={a.seasons.join(", ")}
						style={style}
					>
						{a.count > 1 ? `${a.count}x ` : null}
						{type}
					</div>
				);
			})}
		</div>
	);
};

export default AwardsSummary;
