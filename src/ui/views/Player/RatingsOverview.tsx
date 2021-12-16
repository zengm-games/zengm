import { bySport } from "../../../common";
import RatingWithChange from "../../components/RatingWithChange";
import type { ReactNode } from "react";

const RatingsOverview = ({
	ratings,
	season,
}: {
	ratings: any[];
	season?: number;
}) => {
	let currentSeason: any;

	if (season === undefined) {
		// Use latest season
		currentSeason = ratings.at(-1);
	} else {
		currentSeason =
			ratings.find(row => row.season === season) ?? ratings.at(-1);
	}

	let lastSeason = currentSeason;
	// Search backwards to find the last entry from last season, in the case where there are multiple rows due to injuries
	for (let i = ratings.length - 1; i >= 0; i--) {
		if (ratings[i].season === currentSeason.season - 1) {
			lastSeason = ratings[i];
			break;
		}
	}

	const columns = bySport<
		Record<
			string,
			{
				label: ReactNode;
				rating: string;
			}[]
		>[]
	>({
		basketball: [
			{
				Physical: [
					{
						label: "Height",
						rating: "hgt",
					},
					{
						label: "Strength",
						rating: "stre",
					},
					{
						label: "Speed",
						rating: "spd",
					},
					{
						label: "Jumping",
						rating: "jmp",
					},
					{
						label: "Endurance",
						rating: "endu",
					},
				],
			},
			{
				Shooting: [
					{
						label: "Inside",
						rating: "ins",
					},
					{
						label: (
							<>
								<span className="d-md-none">Layups</span>
								<span className="d-none d-md-inline">Dunks/Layups</span>
							</>
						),
						rating: "dnk",
					},
					{
						label: (
							<>
								<span className="d-md-none">FT</span>
								<span className="d-none d-md-inline">Free Throws</span>
							</>
						),
						rating: "ft",
					},
					{
						label: "Mid Range",
						rating: "fg",
					},
					{
						label: (
							<>
								<span className="d-md-none">3</span>
								<span className="d-none d-md-inline">Three</span> Pointers
							</>
						),
						rating: "tp",
					},
				],
			},
			{
				Skill: [
					{
						label: (
							<>
								<span className="d-md-none">Off</span>
								<span className="d-none d-md-inline">Offensive</span> IQ
							</>
						),
						rating: "oiq",
					},
					{
						label: (
							<>
								<span className="d-md-none">Def</span>
								<span className="d-none d-md-inline">Defensive</span> IQ
							</>
						),
						rating: "diq",
					},
					{
						label: "Dribbling",
						rating: "drb",
					},
					{
						label: "Passing",
						rating: "pss",
					},
					{
						label: (
							<>
								<span className="d-md-none">Reb</span>
								<span className="d-none d-md-inline">Rebounding</span>
							</>
						),
						rating: "reb",
					},
				],
			},
		],
		football: [
			{
				Physical: [
					{
						label: "Height",
						rating: "hgt",
					},
					{
						label: "Strength",
						rating: "stre",
					},
					{
						label: "Speed",
						rating: "spd",
					},
					{
						label: "Endurance",
						rating: "endu",
					},
				],
				Blocking: [
					{
						label: (
							<>
								Run <span className="d-md-none">Block</span>
								<span className="d-none d-md-inline">Blocking</span>
							</>
						),
						rating: "rbk",
					},
					{
						label: (
							<>
								Pass <span className="d-md-none">Block</span>
								<span className="d-none d-md-inline">Blocking</span>
							</>
						),
						rating: "pbk",
					},
				],
			},
			{
				Passing: [
					{
						label: "Vision",
						rating: "thv",
					},
					{
						label: "Power",
						rating: "thp",
					},
					{
						label: "Accuracy",
						rating: "tha",
					},
				],
				Defense: [
					{
						label: (
							<>
								Pass <span className="d-md-none">Cover</span>
								<span className="d-none d-md-inline">Coverage</span>
							</>
						),
						rating: "pcv",
					},
					{
						label: "Tackling",
						rating: "tck",
					},
					{
						label: (
							<>
								Pass <span className="d-md-none">Rush</span>
								<span className="d-none d-md-inline">Rushing</span>
							</>
						),
						rating: "prs",
					},
					{
						label: (
							<>
								Run <span className="d-md-none">Stop</span>
								<span className="d-none d-md-inline">Stopping</span>
							</>
						),
						rating: "rns",
					},
				],
			},
			{
				"Rushing/Receiving": [
					{
						label: (
							<>
								<span className="d-md-none">Elusive</span>
								<span className="d-none d-md-inline">Elusiveness</span>
							</>
						),
						rating: "elu",
					},
					{
						label: (
							<>
								<span className="d-md-none">Routes</span>
								<span className="d-none d-md-inline">Route Running</span>
							</>
						),
						rating: "rtr",
					},
					{
						label: "Hands",
						rating: "hnd",
					},
					{
						label: (
							<>
								Ball <span className="d-md-none">Sec</span>
								<span className="d-none d-md-inline">Security</span>
							</>
						),
						rating: "bsc",
					},
				],
				Kicking: [
					{
						label: (
							<>
								Kick <span className="d-md-none">Pow</span>
								<span className="d-none d-md-inline">Power</span>
							</>
						),
						rating: "kpw",
					},
					{
						label: (
							<>
								Kick <span className="d-md-none">Acc</span>
								<span className="d-none d-md-inline">Accuracy</span>
							</>
						),
						rating: "kac",
					},
					{
						label: (
							<>
								Punt <span className="d-md-none">Pow</span>
								<span className="d-none d-md-inline">Power</span>
							</>
						),
						rating: "ppw",
					},
					{
						label: (
							<>
								Punt <span className="d-md-none">Acc</span>
								<span className="d-none d-md-inline">Accuracy</span>
							</>
						),
						rating: "pac",
					},
				],
			},
		],
		hockey: [
			{
				Physical: [
					{
						label: "Height",
						rating: "hgt",
					},
					{
						label: "Strength",
						rating: "stre",
					},
					{
						label: "Speed",
						rating: "spd",
					},
					{
						label: "Endurance",
						rating: "endu",
					},
				],
			},
			{
				Offense: [
					{
						label: (
							<>
								<span className="d-md-none">Off</span>
								<span className="d-none d-md-inline">Offensive</span> IQ
							</>
						),
						rating: "oiq",
					},
					{
						label: "Passing",
						rating: "pss",
					},
					{
						label: "Wristshot",
						rating: "wst",
					},
					{
						label: "Slapshot",
						rating: "sst",
					},
					{
						label: (
							<>
								<span className="d-md-none">Stickhndl</span>
								<span className="d-none d-md-inline">Stickhandling</span>
							</>
						),
						rating: "stk",
					},
				],
			},
			{
				Defense: [
					{
						label: (
							<>
								<span className="d-md-none">Def</span>
								<span className="d-none d-md-inline">Defensive</span> IQ
							</>
						),
						rating: "diq",
					},
					{
						label: "Checking",
						rating: "chk",
					},
					{
						label: (
							<>
								<span className="d-none d-md-inline">Shot </span>
								Blocking
							</>
						),
						rating: "blk",
					},
					{
						label: "Faceoffs",
						rating: "fcf",
					},
					{
						label: (
							<>
								<span className="d-md-none">Goalie</span>
								<span className="d-none d-md-inline">Goalkeeping</span>
							</>
						),
						rating: "glk",
					},
				],
			},
		],
	});

	return (
		<div className="ratings-overview">
			<div className="d-flex justify-content-between">
				<h2 className="me-3">
					Overall:{" "}
					<RatingWithChange change={currentSeason.ovr - lastSeason.ovr}>
						{currentSeason.ovr}
					</RatingWithChange>
				</h2>
				<h2>
					Potential:{" "}
					<RatingWithChange change={currentSeason.pot - lastSeason.pot}>
						{currentSeason.pot}
					</RatingWithChange>
				</h2>
			</div>
			<div className="d-flex justify-content-between">
				{columns.map((column, i) => (
					<div key={i} className={i === 0 ? undefined : "ms-2 ms-sm-5"}>
						{Object.entries(column).map(([name, categories], j) => (
							<div key={name} className={j === 0 ? undefined : "mt-2"}>
								<table>
									<thead>
										<tr className="border-bottom">
											<th className="p-0" colSpan={2}>
												{name}
											</th>
										</tr>
									</thead>
									<tbody>
										{categories.map(({ label, rating }, j) => (
											<tr key={j}>
												<td className="p-0">{label}:</td>
												<td className="p-0 ps-1">
													<RatingWithChange
														change={
															(currentSeason as any)[rating] -
															(lastSeason as any)[rating]
														}
													>
														{(currentSeason as any)[rating]}
													</RatingWithChange>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default RatingsOverview;
