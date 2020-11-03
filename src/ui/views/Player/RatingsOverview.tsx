import React from "react";
import RatingWithChange from "../../components/RatingWithChange";

const RatingsOverview = ({ ratings }: { ratings: any[] }) => {
	const r = ratings.length - 1;

	let lastSeason: any = ratings[r];
	// Search backwards to find the last entry from last season, in the case where there are multiple rows due to injuries
	for (let i = r; i >= 0; i--) {
		if (ratings[i].season === ratings[r].season - 1) {
			lastSeason = ratings[i];
			break;
		}
	}

	const columns: Record<
		string,
		{
			label: React.ReactNode;
			rating: string;
		}[]
	>[] =
		process.env.SPORT === "basketball"
			? [
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
			  ]
			: [
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
			  ];

	return (
		<div className="ratings-overview">
			<div className="d-flex justify-content-between">
				<h2 className="mr-3">
					Overall:{" "}
					<RatingWithChange change={ratings[r].ovr - lastSeason.ovr}>
						{ratings[r].ovr}
					</RatingWithChange>
				</h2>
				<h2>
					Potential:{" "}
					<RatingWithChange change={ratings[r].pot - lastSeason.pot}>
						{ratings[r].pot}
					</RatingWithChange>
				</h2>
			</div>
			<div className="d-flex justify-content-between">
				{columns.map((column, i) => (
					<div key={i} className={i === 0 ? undefined : "ml-2 ml-sm-5"}>
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
												<td className="p-0 pl-1">
													<RatingWithChange
														change={
															(ratings[r] as any)[rating] -
															(lastSeason as any)[rating]
														}
													>
														{(ratings[r] as any)[rating]}
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
