import { FATIGUE_POS } from "../../../common/constants.football.ts";
import { posRatings } from "../../../common/posRatings.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import { ratingsGradientStyle } from "../../components/RatingsStatsPopover/ratingsGradientStyle.ts";
import { RatingWithChange } from "../../components/RatingWithChange.tsx";
import { type ReactNode } from "react";

export const RatingsOverview = ({
	ratings,
	season,
}: {
	ratings: any[];
	season?: number;
}) => {
	let currentSeason;
	if (season === undefined) {
		// Use latest season
		currentSeason = ratings.at(-1);
	} else {
		currentSeason =
			ratings.findLast((row) => row.season === season) ?? ratings.at(-1);
	}

	const lastSeason =
		ratings.findLast((row) => row.season === currentSeason.season - 1) ??
		currentSeason;

	const columns = bySport<
		Record<
			string,
			{
				label: ReactNode;
				rating: string;
			}[]
		>[]
	>({
		baseball: [
			{
				Physical: [
					{
						label: "Height",
						rating: "hgt",
					},
					{
						label: "Speed",
						rating: "spd",
					},
				],
				Hitting: [
					{
						label: "Power",
						rating: "hpw",
					},
					{
						label: "Contact",
						rating: "con",
					},
					{
						label: "Eye",
						rating: "eye",
					},
				],
			},
			{
				Defense: [
					{
						label: "Ground Balls",
						rating: "gnd",
					},
					{
						label: "Fly Balls",
						rating: "fly",
					},
					{
						label: "Throwing",
						rating: "thr",
					},
					{
						label: "Catcher",
						rating: "cat",
					},
				],
			},
			{
				Pitching: [
					{
						label: "Power",
						rating: "ppw",
					},
					{
						label: "Control",
						rating: "ctl",
					},
					{
						label: "Movement",
						rating: "mov",
					},
					{
						label: "Endurance",
						rating: "endu",
					},
				],
			},
		],
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
								Pass <span className="d-md-none">Block</span>
								<span className="d-none d-md-inline">Blocking</span>
							</>
						),
						rating: "pbk",
					},
					{
						label: (
							<>
								Run <span className="d-md-none">Block</span>
								<span className="d-none d-md-inline">Blocking</span>
							</>
						),
						rating: "rbk",
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

	// Generic physical ratings not included in posRatings
	const toHighlightPhysical = bySport({
		baseball:
			currentSeason.pos === "SP" || currentSeason.pos === "RP"
				? []
				: ["hgt", "spd"],
		basketball: [],
		football: FATIGUE_POS.has(currentSeason.pos)
			? ["hgt", "stre", "spd", "endu"]
			: ["hgt", "stre", "spd"],
		hockey: currentSeason.pos === "G" ? [] : ["hgt", "stre", "spd", "endu"],
	});

	// For non-basketball sports, only highlight ratings that are relevant to position
	const toHighlight = new Set([
		...toHighlightPhysical,
		...posRatings(currentSeason.pos),
	]);

	return (
		<div className="ratings-overview">
			<div className="d-flex gap-3 mb-2">
				<div className="ovr-stat">
					<div className="ovr-stat-label">OVR</div>
					<div className="ovr-stat-value">
						<RatingWithChange change={currentSeason.ovr - lastSeason.ovr}>
							{currentSeason.ovr}
						</RatingWithChange>
					</div>
				</div>
				<div className="ovr-stat">
					<div className="ovr-stat-label">POT</div>
					<div className="ovr-stat-value">
						<RatingWithChange change={currentSeason.pot - lastSeason.pot}>
							{currentSeason.pot}
						</RatingWithChange>
					</div>
				</div>
			</div>
			<div className="d-flex justify-content-between">
				{columns.map((column, i) => (
					<div key={i} className={i === 0 ? undefined : "ms-2 ms-sm-5"}>
						{Object.entries(column).map(([name, categories], j) => (
							<div key={name} className={j === 0 ? undefined : "mt-2"}>
								<div className="fw-bold">
									{name}
									<div
										className="ratings-overview-title-underline"
										style={{
											height: 2,
											width: "100%",
											marginTop: -4,
										}}
									/>
								</div>
								<table>
									<tbody>
										{categories.map(({ label, rating }, j) => {
											const highlightStyle = toHighlight.has(rating)
												? ratingsGradientStyle(currentSeason[rating])
												: undefined;
											const current = currentSeason[rating];
											const paddingTop = { paddingTop: 2 };
											return (
												<tr key={j}>
													<td className="px-0 pb-0" style={paddingTop}>
														<div className="flex-grow-1">
															<div className="d-flex">
																<span>{label}:&nbsp;</span>
																<span className="ms-auto">{current}</span>
															</div>
															<div
																style={{
																	...highlightStyle,
																	height: 2,
																	width: `${current < 50 ? 100 - current : current}%`,
																	marginTop: -4,
																}}
															/>
														</div>
													</td>
													<td className="px-0 pb-0 ps-1" style={paddingTop}>
														<RatingWithChange
															change={current - lastSeason[rating]}
														/>
													</td>
												</tr>
											);
										})}
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
