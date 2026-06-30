import { helpers } from "../../util/helpers.ts";
import type { View } from "../../../common/types.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import { PlayerNameLabels } from "../../components/PlayerNameLabels.tsx";

const Leader = ({
	abbrev,
	firstName,
	firstNameShort,
	lastName,
	pid,
	stat,
	tid,
	value,
}: {
	abbrev?: string;
	firstName: string;
	firstNameShort: string;
	lastName: string;
	pid: number;
	stat: string;
	tid?: number;
	value: number;
}) => {
	const numberToDisplay = bySport({
		baseball: helpers.numberWithCommas(value),
		basketball: helpers.roundStat(value, stat),
		football: helpers.numberWithCommas(value),
		hockey: helpers.numberWithCommas(value),
	});

	return (
		<div className="dashboard-leader">
			<div className="dashboard-leader-name">
				<PlayerNameLabels
					pid={pid}
					firstName={firstName}
					firstNameShort={firstNameShort}
					lastName={lastName}
				/>
				{abbrev && tid !== undefined ? (
					<span className="text-body-secondary ms-1">
						<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`])}>
							{abbrev}
						</a>
					</span>
				) : null}
			</div>
			<div className="dashboard-leader-stat">
				<span className="dashboard-leader-value">{numberToDisplay}</span>
				<span className="dashboard-leader-label">{stat}</span>
			</div>
		</div>
	);
};

const Leaders = ({
	leagueLeaders,
	teamLeaders,
}: Pick<View<"leagueDashboard">, "leagueLeaders" | "teamLeaders">) => (
	<>
		<h2>Team Leaders</h2>
		<div className="team-card mb-3">
			{teamLeaders.map((leader) => (
				<Leader key={leader.stat} {...leader} />
			))}
			<div className="mt-2">
				<a href={helpers.leagueUrl(["roster"])}>» Full Roster</a>
			</div>
		</div>
		<h2>League Leaders</h2>
		<div className="team-card mb-3">
			{leagueLeaders.map((leader) => (
				<Leader key={leader.stat} {...leader} />
			))}
			<div className="mt-2">
				<a href={helpers.leagueUrl(["leaders"])}>» League Leaders</a>
				<span className="mx-2">·</span>
				<a href={helpers.leagueUrl(["player_stats"])}>» Player Stats</a>
			</div>
		</div>
	</>
);

export default Leaders;
