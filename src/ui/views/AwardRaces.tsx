import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import { getCols } from "../../common/getCols.ts";
import { DataTable } from "../components/DataTable/index.tsx";
import { MoreLinks } from "../components/MoreLinks.tsx";
import type { View } from "../../common/types.ts";
import { PLAYER, TEAM_AWARD_INFO } from "../../common/constants.ts";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { RatingWithChange } from "../components/RatingWithChange.tsx";
import { StatWithChange } from "../components/StatWithChange.tsx";
import { useLocal } from "../util/local.ts";
import { getCol } from "../../common/getCol.ts";
import { useId, useState, type ChangeEvent, type ReactNode } from "react";
import { bySport, isSport } from "../../common/sportFunctions.ts";
import { HelpPopover } from "../components/HelpPopover.tsx";
import { StickyBottomButtons } from "../components/StickyBottomButtons.tsx";

const MARGIN = 14;

type InputAward = View<"awardRaces">["awardCandidates"][number];

const Title = ({
	asterisk,
	award,
	confs,
	divs,
}: {
	asterisk: boolean;
	award: InputAward;
} & Pick<View<"awardRaces">, "confs" | "divs">) => {
	const { group, name } = award;
	return (
		<div>
			<h2>
				{name}
				{asterisk ? "*" : null}
			</h2>
			{group && group.type !== "playoffSeries" ? (
				<h3>
					{group.type === "conf"
						? confs[group.cid]?.name
						: divs[group.did]?.name}
				</h3>
			) : null}
		</div>
	);
};

const getRows = ({
	award,
	challengeNoRatings,
	currentSeason,
	season,
	teams,
	userTid,
}: {
	award: InputAward;
	challengeNoRatings: boolean;
	currentSeason: number;
	userTid: number;
} & Pick<View<"awardRaces">, "season" | "teams">) => {
	const { mip, rookie, players, stats } = award;

	const rows: DataTableRow[] = players.map((p, j) => {
		const ps = p.currentStats;
		const pr = p.ratings.findLast((row) => row.season === season);

		const pos = pr?.pos ?? "?";
		const abbrev = ps?.abbrev;
		const tid = ps?.tid;
		const t = teams[tid];

		let recordOrPick = null;
		if (rookie) {
			if (p.draft.round > 0) {
				recordOrPick = `${p.draft.round}-${p.draft.pick}`;
				if (p.draft.year !== season - 1) {
					recordOrPick += ` (${p.draft.year})`;
				}
			}
		} else {
			if (t) {
				recordOrPick = helpers.formatRecord(t.seasonAttrs);
			}
		}

		const data: DataTableRow["data"] = [
			j + 1,
			wrappedPlayerNameLabels({
				injury: season === currentSeason ? p.injury : undefined,
				jerseyNumber: ps ? ps.jerseyNumber : undefined,
				pid: p.pid,
				season,
				skills: pr ? pr.skills : [],
				defaultWatch: p.watch,
				firstName: p.firstName,
				firstNameShort: p.firstNameShort,
				lastName: p.lastName,
			}),
			pos,
			p.age,
			<>
				<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`, season])}>
					{abbrev}
				</a>
			</>,
			recordOrPick,
		];

		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		if (mip) {
			data.push(
				pr && showRatings ? (
					<RatingWithChange change={pr.dovr}>{pr.ovr}</RatingWithChange>
				) : null,
			);

			const ps2 = p.stats.findLast((row) => {
				if (row.season !== season - 1) {
					return false;
				}

				if (award.statRange === undefined && ps.playoffs !== false) {
					return false;
				}
				if (award.statRange === "playoffs" && ps.playoffs !== true) {
					return false;
				}
				if (award.statRange === "combined" && ps.playoffs !== "combined") {
					return false;
				}

				return true;
			});

			const comparePlayersRange =
				award.statRange === "playoffs"
					? "p"
					: award.statRange === "combined"
						? "c"
						: "r";

			data.push(
				...stats.map((stat) => {
					if (!ps && !ps2) {
						return null;
					}

					if (!ps2 || stat === "score" || stat === "keyStats") {
						return helpers.roundStat(ps[stat], stat);
					}

					return (
						<StatWithChange change={ps[stat] - ps2[stat]} stat={stat}>
							{ps[stat]}
						</StatWithChange>
					);
				}),
				<a
					href={helpers.leagueUrl([
						"compare_players",
						`${p.pid}-${season - 1}-${comparePlayersRange},${p.pid}-${season}-${comparePlayersRange}`,
					])}
				>
					Compare
				</a>,
			);
		} else {
			data.push(pr && showRatings ? pr.ovr : null);
			const statsRow = stats.map((stat) => {
				if (p.opoyOverride && stat === "score") {
					// Hide score from UI if opoyOverride because this player was put at #1 due to a different formula (opoyFormula)
					return {
						value: null,
						sortValue: Infinity,
					};
				}

				return ps
					? helpers.roundStat(
							p.statOverrides ? p.statOverrides[stat] : ps[stat],
							stat,
						)
					: null;
			});
			data.push(...statsRow);
		}

		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season,
				playoffs: "regularSeason",
			},
			data,
			classNames: {
				"table-danger": p.hof,
				"table-info": tid === userTid,
			},
		};
	});

	return rows;
};

const getInitialEditingState = (award: InputAward) => {
	const group =
		!award.group || award.group?.type === "playoffSeries"
			? "league"
			: award.group?.type;

	const common = {
		shortName: award.shortName,
		name: award.name,
		formula: award.formula,
		formulaByPos: award.formulaByPos ? { ...award.formulaByPos } : undefined,
		statRange: award.statRange ?? "regularSeason",
		showStats: award.showStats,
		group,
		bench: !!award.bench,
		mip: !!award.mip,
		rookie: !!award.rookie,
	} as const;

	type ActAs = "mvp" | "roy" | "none";

	if (award.numTeams === undefined) {
		return {
			...common,
			type: "individual" as const,
			actAs: award.actAs ?? ("none" as ActAs),
			opoyFormula: award.opoyFormula ?? "",
			numTeams: "1",
		};
	}

	return {
		...common,
		type: "team" as const,
		actAs: "none" as ActAs,
		opoyFormula: "",
		numTeams: String(award.numTeams),
	};
};

type EditingState = ReturnType<typeof getInitialEditingState>;

const EditSettings = ({
	numGamesPlayoffSeries,
	playoffsByConf,
	setState,
	state,
}: {
	numGamesPlayoffSeries: number[];
	playoffsByConf: number | false;
	setState: (state: EditingState) => void;
	state: EditingState;
}) => {
	const groups: {
		key: EditingState["group"];
		text: string;
	}[] = [
		{
			key: "league",
			text: "Leaguewide",
		},
		{
			key: "conf",
			text: "Conference",
		},
		{
			key: "div",
			text: "Division",
		},
	];

	const numPlayoffRounds = numGamesPlayoffSeries.length;

	const statRanges: {
		key: EditingState["statRange"];
		text: string;
	}[] = [
		{
			key: "regularSeason",
			text: "Regular season",
		},
		{
			key: "playoffs",
			text: "Playoffs",
		},
		{
			key: "combined",
			text: "Combined",
		},
		...numGamesPlayoffSeries.map((numGames, i) => {
			return {
				key: -(i + 1),
				text: helpers.upperCaseFirstLetter(
					helpers.playoffRoundName(
						numPlayoffRounds - i - 1,
						numPlayoffRounds,
						playoffsByConf,
					),
				),
			};
		}),
	];

	// Handle invalid statRange value, like if playoff size changed and a round is no longer valid
	if (!statRanges.some((row) => row.key === state.statRange)) {
		statRanges.push({
			key: state.statRange,
			text: "Invalid round",
		});
	}

	const showStatss: {
		key: EditingState["showStats"];
		text: string;
	}[] = bySport({
		baseball: [
			{ key: "overall", text: "Overall" },
			{ key: "sp", text: "Starting Pitching" },
			{ key: "rp", text: "Relief Pitching" },
			{ key: "offense", text: "Overall" },
			{ key: "defense", text: "Defense" },
		],
		basketball: [
			{ key: "offense", text: "Overall" },
			{ key: "defense", text: "Defense" },
		],
		football: [
			{ key: "overall", text: "Overall" },
			{ key: "defense", text: "Defense" },
			{ key: "blocking", text: "Blocking" },
		],
		hockey: [
			{ key: "overall", text: "Overall" },
			{ key: "defense", text: "Defense" },
			{ key: "goalkeeping", text: "Goalkeeping" },
		],
	});

	const actAss: {
		key: EditingState["actAs"];
		text: string;
	}[] = [
		{
			key: "mvp",
			text: "MVP",
		},
		{
			key: "roy",
			text: "ROY",
		},
		{
			key: "none",
			text: "None",
		},
	];

	const flags: {
		key: "bench" | "mip" | "rookie";
		text: string;
		help: ReactNode;
		id: string;
	}[] = [
		{
			key: "rookie",
			text: "Rookie only",
			help: bySport({
				baseball:
					"Rookies are defined similar to MLB (130 AB or 50 IP, scaled for season length) except in the first season of a league with no historical data (such as a new league) where rookies are defined based on draft year.",
				default:
					"Rookies are defined based on the season they first played, except in the first season of a league with no historical data (such as a new league) where rookies are defined based on draft year.",
			}),
			id: useId(),
		},
		{
			key: "bench",
			text: "Bench only",
			help: 'Only players who came off the bench more than they started are eligible, similar to a "Sixth Man of the Year" award in basketball.',
			id: useId(),
		},
		{
			key: "mip",
			text: "Most Improved Player",
			help: (
				<>
					<p>
						If we call this award's formula <code>f(season)</code> and the score
						is normally calculated as <code>f(this season)</code>, then enabling
						this option makes the score{" "}
						<code>
							2*f(this season) - f(last season) - f(best previous season)
						</code>
						.
					</p>
					<p>
						This option also requires 1st round picks to be in their 3rd+ season
						after being drafted, since it's expected that top prospects will
						improve after their first year.
					</p>
				</>
			),
			id: useId(),
		},
	];

	const actAsId = useId();

	const changeHandler =
		<Key extends keyof EditingState>(
			key: Key,
			processValue?: (value: string) => EditingState[Key],
		) =>
		(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const value =
				event.target instanceof HTMLInputElement &&
				event.target.type === "checkbox"
					? event.target.checked
					: processValue
						? processValue(event.target.value)
						: processValue;

			setState({
				...state,
				[key]: value,
			});
		};

	return (
		<div>
			<div className="d-flex gap-3">
				<label className="flex-grow-1">
					<div className="mb-1">Name</div>
					<input
						className="form-control"
						type="text"
						value={state.name}
						onChange={changeHandler("name")}
					/>
				</label>
				<label style={{ width: 100 }}>
					<div className="mb-1">Abbrev</div>
					<input
						className="form-control"
						type="text"
						value={state.shortName}
						onChange={changeHandler("shortName")}
					/>
				</label>
			</div>
			<label className="mt-2 d-flex align-items-center gap-3">
				<span>Formula</span>
				<input
					className="form-control"
					type="text"
					value={state.formula}
					onChange={changeHandler("formula")}
				/>
				{TEAM_AWARD_INFO.byPos ? (
					<button className="btn-secondary" title="By position">
						By pos
					</button>
				) : null}
			</label>
			<div className="mt-2 d-flex gap-3">
				<label>
					<div className="mb-1">Grouping</div>
					<select
						className="form-select"
						onChange={changeHandler("group")}
						value={state.group}
					>
						{groups.map(({ key, text }) => (
							<option key={key} value={key}>
								{text}
							</option>
						))}
					</select>
				</label>
				<label>
					<div className="mb-1">Range</div>
					<select
						className="form-select"
						onChange={changeHandler("statRange", (value) => {
							const newStatRange = (
								value.startsWith("-") ? Number.parseInt(value) : value
							) as EditingState["statRange"];
							return newStatRange;
						})}
						value={state.statRange}
					>
						{statRanges.map(({ key, text }) => (
							<option key={key} value={key}>
								{text}
							</option>
						))}
					</select>
				</label>
				<label>
					<div className="mb-1">UI stats</div>
					<select
						className="form-select"
						onChange={changeHandler("showStats")}
						value={state.showStats}
					>
						{showStatss.map(({ key, text }) => (
							<option key={key} value={key}>
								{text}
							</option>
						))}
					</select>
				</label>
				<div className="text-nowrap">
					{flags.map(({ help, id, key, text }) => {
						return (
							<div key={key} className="form-check">
								<input
									className="form-check-input"
									id={id}
									type="checkbox"
									checked={state[key]}
									onChange={changeHandler(key)}
								/>
								<label className="form-check-label" htmlFor={id}>
									{text}
								</label>
								<HelpPopover className="ms-2" title={text}>
									{help}
								</HelpPopover>
							</div>
						);
					})}
				</div>
			</div>
			<div className="mt-1 d-flex gap-3 align-items-center">
				<div>
					<select
						className="form-select"
						onChange={changeHandler("type")}
						value={state.type}
					>
						<option value="individual">Individual award</option>
						<option value="team">Team award</option>
					</select>
				</div>
				{state.type === "individual" ? (
					<div>
						<label className="mb-1" htmlFor={actAsId}>
							Act as
						</label>
						<HelpPopover title="Act as" className="ms-1">
							<p>
								A few places in the UI rely on one award to be known as the
								"MVP" or "ROY" award. That can be any award, you just need to
								label it that way here.
							</p>
							<p>Specifically these places are:</p>
							<p>
								MVP: shows up on Draft History, draft class frivolities, and the
								Hall of Fame page.
								{isSport("football")
									? " In FBGM it also is used if you enable the OPOY formula for an award (see below)."
									: null}
							</p>
							<p>ROY: shows up on the Draft History page.</p>
						</HelpPopover>
						<select
							id={actAsId}
							className="form-select"
							onChange={changeHandler("actAs")}
							value={state.actAs}
						>
							{actAss.map(({ key, text }) => (
								<option key={key} value={key}>
									{text}
								</option>
							))}
						</select>
					</div>
				) : (
					<div>
						<label>
							<div className="mb-1"># teams</div>
							<input
								className="form-control"
								onChange={changeHandler("numTeams")}
								value={state.numTeams}
							/>
						</label>
					</div>
				)}
			</div>
			{state.type === "individual" && isSport("football") ? (
				<div className="mt-2">OPOY formula stuff</div>
			) : null}
		</div>
	);
};

const AwardRaces = ({
	awardCandidates,
	confs,
	divs,
	numGamesPlayoffSeries,
	playoffsByConf,
	season,
	teams,
}: View<"awardRaces">) => {
	useTitleBar({
		title: "Award Races",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "award_races",
		dropdownFields: {
			seasons: season,
		},
	});

	const {
		challengeNoRatings,
		season: currentSeason,
		userTid,
	} = useLocal(["challengeNoRatings", "season", "userTid"]);

	const [editSettings, setEditSettings] = useState<
		| {
				editing: false;
				awards?: EditingState[];
		  }
		| {
				editing: true;
				awards: EditingState[];
		  }
	>({
		editing: false,
	});
	const [saving, setSaving] = useState(false);

	const globalCols = getCols(["#", "Name", "Pos", "Age", "Team"]);

	return (
		<>
			<MoreLinks type="awards" page="award_races" season={season} />

			{!editSettings.editing ? (
				<div className="mb-3">
					<button
						className="btn btn-secondary"
						onClick={() => {
							setEditSettings((state) => ({
								editing: true,
								awards:
									state.awards ?? awardCandidates.map(getInitialEditingState),
							}));
						}}
					>
						Edit award settings
					</button>
				</div>
			) : null}

			<div className="row" style={{ marginTop: -MARGIN }}>
				{awardCandidates.map((award, i) => {
					const { group, mip, rookie, stats } = award;

					const asterisk =
						isSport("football") &&
						award.numTeams === undefined &&
						award.opoyFormula !== undefined;

					const cols = [
						...globalCols,
						...getCols([rookie ? "Pick" : "Record", "Ovr"]),
						...getCols(stats.map((stat) => `stat:${stat}`)),
					];
					if (mip) {
						cols.push(getCol("Compare"));
					}

					const rows = getRows({
						award,
						challengeNoRatings,
						currentSeason,
						season,
						teams,
						userTid,
					});

					const title = (
						<Title
							asterisk={asterisk}
							award={award}
							confs={confs}
							divs={divs}
						/>
					);
					const key = `${award.shortName}-${group === undefined ? "" : group.type === "conf" ? group.cid : group.type === "div" ? group.did : `${group.tids[0]}-${group.tids[1]}`}`;

					return (
						<div
							key={key}
							className={mip ? "col-12 col-lg-9" : "col-12 col-lg-6"}
							style={{ marginTop: MARGIN }}
						>
							{editSettings.editing ? (
								<div>
									{editSettings.awards[i] ? (
										<EditSettings
											numGamesPlayoffSeries={numGamesPlayoffSeries}
											playoffsByConf={playoffsByConf}
											setState={(state) => {
												setEditSettings((oldState) => {
													return oldState.awards
														? {
																...oldState,
																awards: oldState.awards.map((award, j) => {
																	return i === j ? state : award;
																}),
															}
														: {
																editing: false,
															};
												});
											}}
											state={editSettings.awards[i]}
										/>
									) : (
										title
									)}
								</div>
							) : null}
							{rows.length > 0 ? (
								<DataTable
									classNameWrapper="mb-1"
									cols={cols}
									defaultSort={[0, "asc"]}
									defaultStickyCols={window.mobile ? 0 : 2}
									hideAllControls
									name={`AwardRaces${key}`}
									rows={rows}
									title={editSettings ? undefined : title}
								/>
							) : (
								<>
									{editSettings ? undefined : title}
									<p>No candidates yet...</p>
								</>
							)}
							{asterisk ? (
								<div className="text-body-secondary">
									* Exceptional QBs can win both MVP and {award.shortName}
								</div>
							) : null}
						</div>
					);
				})}
			</div>

			{editSettings.editing ? (
				<StickyBottomButtons>
					<button
						className="btn btn-primary me-2"
						type="submit"
						disabled={saving}
						onClick={() => {
							setSaving(true);

							setSaving(false);
						}}
					>
						Save award settings
					</button>
				</StickyBottomButtons>
			) : null}
		</>
	);
};

export default AwardRaces;
