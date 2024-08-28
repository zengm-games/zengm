import {
	PlayerNameLabels,
	RatingWithChange,
	ResponsiveTableWrapper,
} from "../../components";
import { getCols, helpers } from "../../util";
import type { View } from "../../../common/types";
import { DEPTH_CHART_NAME, isSport } from "../../../common";
import { Contract } from "../../components/contract";

const StartingLineup = ({
	challengeNoRatings,
	numPlayersOnCourt,
	starters,
	startersStats,
}: Pick<
	View<"leagueDashboard">,
	"challengeNoRatings" | "numPlayersOnCourt" | "starters" | "startersStats"
>) => {
	const statCols = getCols(startersStats.map(stat => `stat:${stat}`));

	return (
		<>
			<h2>
				{(isSport("basketball") && numPlayersOnCourt >= starters.length) ||
				(isSport("hockey") && numPlayersOnCourt === starters.length)
					? "Starting Lineup"
					: "Top Players"}
			</h2>
			<ResponsiveTableWrapper nonfluid className="mb-0">
				<table className="table table-striped table-borderless table-sm sticky-x">
					<thead>
						<tr>
							<th>Name</th>
							<th title="Position">Pos</th>
							<th>Age</th>
							<th title="Years With Team">YWT</th>
							<th title="Overall Rating">Ovr</th>
							<th title="Potential Rating">Pot</th>
							<th>Contract</th>
							{statCols.map(({ desc, title }) => (
								<th key={title} title={desc}>
									{title}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{starters.map(p => (
							<tr key={p.pid}>
								<td>
									<PlayerNameLabels
										injury={p.injury}
										jerseyNumber={p.jerseyNumber}
										pid={p.pid}
										skills={p.ratings.skills}
										watch={p.watch}
										firstName={p.firstName}
										firstNameShort={p.firstNameShort}
										lastName={p.lastName}
									/>
								</td>
								<td>{p.ratings.pos}</td>
								<td>{p.age}</td>
								<td>{p.stats.yearsWithTeam}</td>
								<td>
									{!challengeNoRatings ? (
										<RatingWithChange change={p.ratings.dovr}>
											{p.ratings.ovr}
										</RatingWithChange>
									) : null}
								</td>
								<td>
									{!challengeNoRatings ? (
										<RatingWithChange change={p.ratings.dpot}>
											{p.ratings.pot}
										</RatingWithChange>
									) : null}
								</td>
								<td>
									<Contract p={p} />
								</td>
								{startersStats.map(stat => (
									<td key={stat}>{helpers.roundStat(p.stats[stat], stat)}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</ResponsiveTableWrapper>
			<div />
			{DEPTH_CHART_NAME ? (
				<a href={helpers.leagueUrl(["depth"])}>» {DEPTH_CHART_NAME}</a>
			) : (
				<a href={helpers.leagueUrl(["roster"])}>» Full Roster</a>
			)}
		</>
	);
};

export default StartingLineup;
