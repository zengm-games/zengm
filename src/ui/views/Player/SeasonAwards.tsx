import { Fragment } from "react/jsx-runtime";
import type { PlayerAwardBuiltIn } from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";
import { formatPlayerAwardName } from "../../../common/awards.ts";

const getAwardText = (award: PlayerAwardBuiltIn) => {
	return `${award.shortName}${award.numTeams === 1 ? "" : award.numTeams !== undefined ? award.rank : `-${award.rank}`}`;
};

const SeasonAwards = ({
	awards,
	season,
}: {
	awards: PlayerAwardBuiltIn[];
	season: number;
}) => {
	if (awards.length === 0) {
		return;
	}

	return (
		<>
			{awards.map((award, i) => {
				const className =
					award.numTeams === undefined && award.rank === 1
						? "fw-bold"
						: undefined;
				return (
					<Fragment key={i}>
						{i > 0 ? "," : undefined}
						<a
							href={helpers.leagueUrl(["award_races", season])}
							className={className}
							title={formatPlayerAwardName(award, {
								includeIndividualRank: true,
							})}
						>
							{getAwardText(award)}
						</a>
					</Fragment>
				);
			})}
		</>
	);
};

export const wrappedSeasonAwards = ({
	awards = [],
	season,
}: {
	awards: PlayerAwardBuiltIn[] | undefined;
	season: number;
}) => {
	const searchValue = awards.map(getAwardText).join(" ");
	const sortValue = awards.length;
	return {
		value: <SeasonAwards awards={awards} season={season} />,
		searchValue,
		sortValue,
	};
};
