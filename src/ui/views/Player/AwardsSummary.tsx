import { OverlayTrigger, Tooltip } from "react-bootstrap";
import type { Player } from "../../../common/types.ts";
import { groupAwards } from "../../util/groupAwards.ts";
import { orderBy } from "../../../common/utils.ts";

const style = {
	fontSize: "120%",
	maxWidth: 520,
};

export const AwardsSummary = ({ awards }: { awards: Player["awards"] }) => {
	if (awards.length === 0) {
		return null;
	}

	const awardsGrouped = groupAwards(awards, true);

	return (
		<div style={style}>
			{awardsGrouped.map((a, i) => {
				const seasonsEntries = orderBy(Object.entries(a.seasons), 0, "asc");
				const hideLongName =
					seasonsEntries.length === 1 && seasonsEntries[0]![0] === a.type;
				return (
					<OverlayTrigger
						key={i}
						overlay={
							<Tooltip>
								{seasonsEntries.map(([long, allSeasons]) => {
									return (
										<div key={long}>
											{hideLongName ? null : `${long}: `}
											{allSeasons.join(", ")}
										</div>
									);
								})}
							</Tooltip>
						}
						placement="bottom"
					>
						<span
							className={`badge rounded-pill px-2 me-1 mt-2 ${
								a.type === "Hall of Fame" ? "bg-warning" : "bg-secondary"
							}`}
						>
							{a.count > 1 ? `${a.count}x ` : null}
							{a.type}
						</span>
					</OverlayTrigger>
				);
			})}
		</div>
	);
};
