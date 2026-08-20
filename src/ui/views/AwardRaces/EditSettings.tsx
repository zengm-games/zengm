import { useId, type ChangeEvent, type ReactNode } from "react";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import { HelpPopover } from "../../components/HelpPopover.tsx";
import { TEAM_AWARD_INFO } from "../../../common/constants.ts";
import { helpers } from "../../util/helpers.ts";
import type { InputAward } from "./index.tsx";
import type {
	AwardInfoCommon,
	AwardSettingIndividual,
	AwardSettingTeam,
} from "../../../common/types.ts";

const awardToEditingState = (award: InputAward) => {
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

export const awardsToEditingState = (awards: InputAward[]) => {
	const output = [];
	const seenShortNames = new Set();
	for (const award of awards) {
		if (seenShortNames.has(award.shortName)) {
			output.push(undefined);
			continue;
		}
		seenShortNames.add(award.shortName);

		output.push(awardToEditingState(award));
	}

	return output;
};

export type EditingState = ReturnType<typeof awardToEditingState>;

export const editingStateToAward = (
	state: EditingState,
): AwardSettingIndividual | AwardSettingTeam => {
	const common: Omit<AwardInfoCommon, "group"> = {
		shortName: state.shortName,
		name: state.name,
		formula: state.formula,
		showStats: state.showStats,
	};

	const flags = ["bench", "mip", "rookie"] as const;
	for (const flag of flags) {
		if (state[flag]) {
			common[flag] = true;
		}
	}

	if (state.statRange !== "regularSeason") {
		common.statRange = state.statRange;
	}

	let award: AwardSettingIndividual | AwardSettingTeam;
	if (state.type === "individual") {
		award = {
			...common,
		};

		if (state.actAs !== "none") {
			award.actAs = state.actAs;
		}

		if (state.opoyFormula !== "") {
			award.opoyFormula = state.opoyFormula;
		}
	} else {
		const numTeams = Number.parseInt(state.numTeams);
		if (Number.isNaN(numTeams) || numTeams < 1) {
			throw new Error("numTeams must be an integer >= 1");
		}

		award = {
			...common,
			numTeams,
		};
	}

	if (state.group === "conf" || state.group === "div") {
		award.group = state.group;
	}

	return award;
};

export const EditSettings = ({
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
						: event.target.value;

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
				<div className="input-group">
					<input
						className="form-control"
						type="text"
						value={state.formula}
						onChange={changeHandler("formula")}
					/>
					{TEAM_AWARD_INFO.byPos ? (
						<button
							className="btn btn-secondary text-nowrap"
							title="By position"
						>
							By pos
						</button>
					) : null}
				</div>
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
