import { OverlayTrigger, Tooltip } from "react-bootstrap";
import type { Player } from "../../../common/types.ts";
import { groupAwards } from "../../util/groupAwards.ts";

const style = {
	fontSize: "120%",
	maxWidth: 520,
};

const AwardsSummary = ({ awards }: { awards: Player["awards"] }) => {
	if (awards.length === 0) {
		return null;
	}

	const awardsGrouped = groupAwards(awards, true);

	return (
		<div style={style}>
			{awardsGrouped.map((a, i) => {
				const seasons = a.seasons.join(", ");
				return (
					<OverlayTrigger
						key={i}
						overlay={
							<Tooltip>
								{seasons}
								{a.long !== a.type ? (
									<>
										<br />
										{a.long}
									</>
								) : null}
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

export default AwardsSummary;
