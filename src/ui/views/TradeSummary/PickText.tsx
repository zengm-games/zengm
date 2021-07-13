import type { DraftPickSeason } from "../../../common/types";
import { helpers } from "../../util";

const PickText = ({
	asset,
	season,
}: {
	asset: {
		abbrev?: string;
		pick?: number;
		round: number;
		season: DraftPickSeason;
		tid: number;
		type: "realizedPick" | "unrealizedPick";
	};
	season: number;
}) => {
	const details = [];

	if (asset.pick !== undefined && asset.pick > 0) {
		details.push(`#${asset.pick}`);
	}

	if (asset.abbrev) {
		details.push(
			<a
				href={helpers.leagueUrl([
					"roster",
					`${asset.abbrev}_${asset.tid}`,
					typeof asset.season === "number" ? asset.season : season,
				])}
			>
				{asset.abbrev}
			</a>,
		);
	}

	return (
		<>
			{asset.season === "fantasy" ? (
				`${season} fantasy draft`
			) : asset.season === "expansion" ? (
				`${season} expansion draft`
			) : (
				<a
					href={
						asset.type === "realizedPick"
							? helpers.leagueUrl(["draft_summary", asset.season])
							: helpers.leagueUrl(["draft_scouting"])
					}
				>
					{asset.season}
				</a>
			)}{" "}
			{helpers.ordinal(asset.round)} round pick
			{details.length > 0 ? (
				<>
					{" "}
					({details[0]}
					{details.length > 1 ? <>, {details[1]}</> : null})
				</>
			) : null}
		</>
	);
};

export default PickText;
