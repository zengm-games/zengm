import { useId, type ChangeEvent, type ReactNode } from "react";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import { HelpPopover } from "../../components/HelpPopover.tsx";
import {
	NOT_REAL_POSITIONS_AWARDS,
	POSITIONS,
	TEAM_AWARD_INFO,
} from "../../../common/constants.ts";
import { helpers } from "../../util/helpers.ts";
import type { InputAward } from "../AwardRaces.tsx";
import type {
	AwardInfoCommon,
	AwardSettingIndividual,
	AwardSettingTeam,
} from "../../../common/types.ts";
import { Dropdown, DropdownButton } from "react-bootstrap";

const SUPPORT_OPOY_STUFF = isSport("football");
const OPOY_FORMULA_NAME = "OPOY (including QB)";

export const awardToEditingState = (award: InputAward) => {
	const group =
		!award.group || award.group?.type === "playoffSeries"
			? "league"
			: award.group?.type;

	const common = {
		shortName: award.shortName,
		name: award.name,
		formula: award.formula,
		formulaByPos: award.formulaByPos ? { ...award.formulaByPos } : {},
		showByPos: !!award.formulaByPos,
		statRange: award.statRange ?? "regularSeason",
		showStats: award.showStats,
		group,
		bench: !!award.bench,
		mip: !!award.mip,
		rookie: !!award.rookie,
	} as const;

	type ActAs = "mvp" | "roy" | "opoy" | "none";

	if (award.numTeams === undefined) {
		return {
			...common,
			type: "individual" as const,
			actAs:
				award.actAs ??
				((award.opoyFormula !== undefined ? "opoy" : "none") as ActAs),
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

export const awardsToEditingState = (groups: InputAward[][]) => {
	return groups
		.filter((awards) => awards.length > 0)
		.map((awards) => {
			return {
				awards,
				editing: awardToEditingState(awards[0]!),
			};
		});
};

export type EditingState = ReturnType<typeof awardToEditingState>;

export const editingStateToAward = (state: EditingState, index: number) => {
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

	const errorMessages: { index: number; message: string }[] = [];

	let award: AwardSettingIndividual | AwardSettingTeam;
	if (state.type === "individual") {
		award = {
			...common,
		};

		if (state.actAs !== "none" && state.actAs !== "opoy") {
			award.actAs = state.actAs;
		}

		if (state.actAs === "opoy" && state.opoyFormula !== "") {
			award.opoyFormula = state.opoyFormula;
		}
	} else {
		let numTeams = Number.parseInt(state.numTeams);
		if (Number.isNaN(numTeams) || numTeams < 1) {
			// Annoying to encode this in awardSettingTeamSchema due to the union of team and individual awards. Could be done in awardSettingsSchema superRefine, but then we need to change the other schemas to explicitly allow NaN which is a bit weird. So maybe this is better?
			errorMessages.push({
				index,
				message: "numTeams must be an integer >= 1",
			});
			numTeams = 1;
		}

		award = {
			...common,
			numTeams,
		};
	}

	if (state.group === "conf" || state.group === "div") {
		award.group = state.group;
	}

	if (state.showByPos) {
		const entries = Object.entries(state.formulaByPos).filter(
			(entry) => entry[1].trim() !== "",
		);
		if (entries.length > 0) {
			award.formulaByPos = {};
			for (const [pos, formula] of entries) {
				award.formulaByPos[pos] = formula;
			}
		}
	}

	return {
		award,
		errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
	};
};

export const EditSettings = ({
	canMoveDown,
	canMoveUp,
	disabled,
	move,
	numGamesPlayoffSeries,
	playoffsByConf,
	remove,
	setState,
	state,
}: {
	canMoveDown: boolean;
	canMoveUp: boolean;
	disabled: boolean;
	move: (direction: -1 | 1) => void;
	numGamesPlayoffSeries: number[];
	playoffsByConf: number | false;
	remove: () => void;
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

	if (SUPPORT_OPOY_STUFF) {
		actAss.push({ key: "opoy", text: "OPOY" });
	}

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
	const opoyId = useId();

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
						disabled={disabled}
						type="text"
						value={state.name}
						onChange={changeHandler("name")}
					/>
				</label>
				<label style={{ width: 100 }}>
					<div className="mb-1">Abbrev</div>
					<input
						className="form-control"
						disabled={disabled}
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
						disabled={disabled}
						type="text"
						value={state.formula}
						onChange={changeHandler("formula")}
					/>
					{TEAM_AWARD_INFO.byPos ? (
						<button
							type="button"
							className="btn btn-secondary text-nowrap"
							disabled={disabled}
							title="By position"
							onClick={() => {
								setState({
									...state,
									showByPos: !state.showByPos,
								});
							}}
						>
							By pos
						</button>
					) : null}
				</div>
			</label>
			{state.showByPos ? (
				<>
					<div className="mt-2 d-flex align-items-center gap-2">
						<DropdownButton
							disabled={disabled}
							variant="secondary"
							title="Add position-speicifc formula"
						>
							{POSITIONS.map((pos) => {
								if (
									NOT_REAL_POSITIONS_AWARDS.has(pos) ||
									state.formulaByPos[pos] !== undefined
								) {
									return null;
								}

								return (
									<Dropdown.Item
										key={pos}
										onClick={() => {
											setState({
												...state,
												formulaByPos: {
													...state.formulaByPos,
													[pos]: "",
												},
											});
										}}
									>
										{pos}
									</Dropdown.Item>
								);
							})}
						</DropdownButton>
						<HelpPopover title="Position-specific formulas">
							<p>
								By default, the same formula is used for players at every
								position.
							</p>
							<p>
								If you want to override that formula for some positions, specify
								them here.
							</p>
							<p>
								For any other positions, or for any blank position-specific
								formulas, the main formula will be used.
							</p>
						</HelpPopover>
					</div>
					{POSITIONS.map((pos) => {
						const formula = state.formulaByPos[pos];
						if (formula === undefined) {
							return null;
						}

						return (
							<label key={pos} className="mt-2 d-flex align-items-center gap-3">
								<span className="text-end" style={{ minWidth: 47 }}>
									{pos}
								</span>
								<input
									className="form-control"
									disabled={disabled}
									type="text"
									value={formula}
									onChange={(event) => {
										setState({
											...state,
											formulaByPos: {
												...state.formulaByPos,
												[pos]: event.target.value,
											},
										});
									}}
								/>
								<button
									className="btn-close"
									disabled={disabled}
									onClick={() => {
										const formulaByPos = {
											...state.formulaByPos,
										};
										delete formulaByPos[pos];
										setState({
											...state,
											formulaByPos,
										});
									}}
									title={`Delete ${pos} formula`}
									type="button"
								></button>
							</label>
						);
					})}
				</>
			) : null}
			<div className="mt-2 d-flex gap-3">
				<label>
					<div className="mb-1">Grouping</div>
					<select
						className="form-select"
						disabled={disabled}
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
						disabled={disabled}
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
					<div className="mb-1 text-nowrap">UI stats</div>
					<select
						className="form-select"
						disabled={disabled}
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
									disabled={disabled}
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
						disabled={disabled}
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
								{SUPPORT_OPOY_STUFF
									? " In FBGM it also is used if you enable the OPOY formula for an award (see below)."
									: null}
							</p>
							<p>ROY: shows up on the Draft History page.</p>
							{SUPPORT_OPOY_STUFF ? (
								<>
									<p>
										OPOY: This enables "OPOY mode", see the help icon by "
										{OPOY_FORMULA_NAME}" for more info.
									</p>
								</>
							) : null}
						</HelpPopover>
						<select
							id={actAsId}
							className="form-select"
							disabled={disabled}
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
								disabled={disabled}
								onChange={changeHandler("numTeams")}
								type="number"
								value={state.numTeams}
							/>
						</label>
					</div>
				)}
				<button
					type="button"
					className="ms-auto btn btn-secondary"
					disabled={disabled || !canMoveUp}
					onClick={() => {
						move(-1);
					}}
				>
					<span
						style={{ paddingRight: 2 }}
						className="glyphicon glyphicon-arrow-up"
					/>
				</button>
				<button
					type="button"
					className="btn btn-secondary"
					disabled={disabled || !canMoveDown}
					onClick={() => {
						move(1);
					}}
				>
					<span
						style={{ paddingRight: 2 }}
						className="glyphicon glyphicon-arrow-down"
					/>
				</button>
				<button
					type="button"
					className="btn btn-danger"
					disabled={disabled}
					onClick={remove}
				>
					Delete
				</button>
			</div>
			{SUPPORT_OPOY_STUFF &&
			state.type === "individual" &&
			state.actAs === "opoy" ? (
				<div className="mt-2 d-flex align-items-center">
					<label className="flex-shrink-0" htmlFor={opoyId}>
						{OPOY_FORMULA_NAME}
					</label>
					<HelpPopover title="OPOY" className="ms-2">
						<p>
							The intended use case of "OPOY mode" is for you to write a normal
							formula that doesn't include QB stats (such as just rushing and
							receiving stats), and then in this special "{OPOY_FORMULA_NAME}"
							field, enter an alternative formula that also includes passing
							stats. Then, if a QB wins MVP, the "{OPOY_FORMULA_NAME}" formula
							will be applied to the MVP and and the OPOY leader, and if the
							MVP's score is 20% higher, the MVP will win OPOY too.
						</p>
						<p>
							I apologize that the OPOY stuff is complicated. OPOY is a weird
							award since usually the MVP is an offensive player, so OPOY should
							arguably always be the same player in those cases, but then it's
							kind of a redundant award. The method described above lets you use
							OPOY to mean "best non-QB offensive player, unless the QB had an
							exceptional season", which I think at least makes some sense.
							Great QBs will win MVPs, and rarely may even win OPOY too. Great
							RB/WR/TE will win OPOYs, and rarely may even win MVP too.
						</p>
					</HelpPopover>
					<input
						className="form-control ms-3"
						disabled={disabled}
						id={opoyId}
						type="text"
						value={state.opoyFormula}
						onChange={changeHandler("opoyFormula")}
					/>
				</div>
			) : null}
		</div>
	);
};
