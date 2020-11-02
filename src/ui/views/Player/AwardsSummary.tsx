import React from "react";
import type { Player } from "../../../common/types";
import { groupAwards } from "../../util";

const AwardsSummary = ({ awards }: { awards: Player["awards"] }) => {
	if (awards.length === 0) {
		return null;
	}

	const awardsGrouped = groupAwards(awards, true);

	return (
		<div className="clearfix awards-summary">
			{awardsGrouped.map((a, i) => {
				return (
					<div
						key={i}
						className="badge badge-pill badge-secondary d-block"
						title={a.seasons.join(", ")}
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
