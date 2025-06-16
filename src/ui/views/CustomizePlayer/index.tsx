import {
	useState,
	type FormEvent,
	type ChangeEvent,
	type MouseEvent,
	useEffect,
	useLayoutEffect,
} from "react";
import {
	PHASE,
	PLAYER,
	RATINGS,
	POSITIONS,
	MOOD_TRAITS,
	WEBSITE_ROOT,
	bySport,
	NOT_REAL_POSITIONS,
} from "../../../common/index.ts";
import { HelpPopover } from "../../components/index.tsx";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import {
	helpers,
	realtimeUpdate,
	toWorker,
	logEvent,
} from "../../util/index.ts";
import RatingsForm from "./RatingsForm.tsx";
import RelativesForm from "./RelativesForm.tsx";
import type { View, Phase, PlayerWithoutKey } from "../../../common/types.ts";
import posRatings from "../../../common/posRatings.ts";
import { orderBy } from "../../../common/utils.ts";
import CustomMoodItemsForm from "./CustomMoodItemsForm.tsx";
import { roundContract } from "../../../common/roundContract.ts";
import { Face } from "./Face.tsx";
import { CurrencyInputGroup } from "../../components/CurrencyInputGroup.tsx";

const copyValidValues = (
	source: PlayerWithoutKey,
	target: PlayerWithoutKey,
	minContract: number,
	phase: Phase,
	season: number,
) => {
	// Should be true if a player is becoming "active" (moving to a team from a non-team, such as free agent, retired, draft prospect, or new player)
	// @ts-expect-error
	const activated = source.tid >= 0 && Number.parseInt(target.tid) < 0;

	for (const attr of ["hgt", "tid", "weight"] as const) {
		// @ts-expect-error
		const val = Number.parseInt(source[attr]);
		if (!Number.isNaN(val)) {
			target[attr] = val;
		}
	}

	target.firstName = source.firstName;
	target.lastName = source.lastName;
	target.imgURL = source.imgURL;
	target.moodTraits = source.moodTraits;
	target.moodTraits.sort();

	// HoF toggle? Need to update awards list too.
	if (target.hof !== source.hof) {
		// Always remove old entries, so there are never duplicates
		target.awards = target.awards.filter(
			(award) => !award.type.includes("Hall of Fame"),
		);
		if (!target.hof && source.hof) {
			// Add to HoF
			target.awards.push({
				season,
				type: "Inducted into the Hall of Fame",
			});
		}
	}
	target.hof = source.hof;

	if (target.jerseyNumber !== source.jerseyNumber) {
		target.jerseyNumber = source.jerseyNumber;
		if (target.jerseyNumber === "") {
			target.jerseyNumber = undefined;
		}
	}

	// Always recompute for a new player
	let recomputePosOvrPot = target.pid === undefined;

	{
		// @ts-expect-error
		const age = Number.parseInt(source.age);
		if (!Number.isNaN(age)) {
			const bornYear = season - age;
			if (bornYear !== target.born.year) {
				target.born.year = bornYear;
				recomputePosOvrPot = true;
			}
		}
	}

	target.born.loc = source.born.loc;

	target.college = source.college;

	const ovrByPos = bySport({
		baseball: true,
		basketball: false,
		football: true,
		hockey: true,
	});

	if (source.pos === undefined) {
		if (target.pos !== undefined) {
			delete target.pos;
			if (ovrByPos) {
				recomputePosOvrPot = true;
			}
		}
	} else {
		if (target.pos !== source.pos) {
			target.pos = source.pos;
			if (ovrByPos) {
				recomputePosOvrPot = true;
			}
		}
	}

	{
		// @ts-expect-error
		const diedYear = Number.parseInt(source.diedYear);
		if (!Number.isNaN(diedYear)) {
			target.diedYear = diedYear;
		} else {
			target.diedYear = undefined;
		}
	}

	// This preserves contract.rookie
	const oldContract = {
		...target.contract,
	};

	let contractChanged = false;

	{
		// Allow any value, even above or below normal limits, but round and convert from M to k
		let amount = roundContract(
			1000 * helpers.localeParseFloat(String(source.contract.amount)),
			minContract,
		);
		if (Number.isNaN(amount)) {
			amount = minContract;
		}

		if (target.contract.amount !== amount) {
			target.contract.amount = amount;
			contractChanged = true;
		}
	}

	{
		// @ts-expect-error
		let exp = Number.parseInt(source.contract.exp);
		if (!Number.isNaN(exp)) {
			// No contracts expiring in the past
			if (exp < season) {
				exp = season;
			}

			// If current season contracts already expired, then current season can't be allowed for new contract
			if (exp === season && phase >= PHASE.RESIGN_PLAYERS) {
				exp += 1;
			}

			if (target.contract.exp !== exp) {
				target.contract.exp = exp;
				contractChanged = true;
			}
		}
	}

	// Keep salaries log updated with contract
	if (contractChanged || activated) {
		// This code is similar to player.setContract

		// Is this contract beginning with an in-progress season, or next season?
		let start = season;

		if (phase > PHASE.AFTER_TRADE_DEADLINE) {
			start += 1;
		}

		if (contractChanged && !activated) {
			// Remove entries from old contract
			target.salaries = target.salaries.filter((salary) => {
				return salary.season < start || salary.amount !== oldContract.amount;
			});
		}

		if (target.tid >= 0) {
			// Add entries for new contract
			for (let i = start; i <= target.contract.exp; i++) {
				target.salaries.push({
					season: i,
					amount: target.contract.amount,
				});
			}
		}
	}

	{
		const prevDraftTid = target.draft.tid;

		const draftInts = ["year", "round", "pick", "tid"] as const;
		for (const key of draftInts) {
			const int = Number.parseInt(source.draft[key] as any);
			if (!Number.isNaN(int)) {
				target.draft[key] = int;
			}
		}
		if (target.draft.tid === PLAYER.UNDRAFTED) {
			target.draft.round = 0;
			target.draft.pick = 0;
		}

		if (prevDraftTid !== target.draft.tid) {
			// dpid no longer makes sense to store, since player was drafted with a fake pick now
			delete target.draft.dpid;

			// No UI to set originalTid, yet so always change
			target.draft.originalTid = target.draft.tid;
		}
	}

	{
		// @ts-expect-error
		let gamesRemaining = Number.parseInt(source.injury.gamesRemaining);
		if (Number.isNaN(gamesRemaining) || gamesRemaining < 0) {
			gamesRemaining = 0;
		}
		target.injury.gamesRemaining = gamesRemaining;
	}

	target.injury.type = source.injury.type;

	{
		const r = source.ratings.length - 1;
		for (const rating of Object.keys(source.ratings[r])) {
			if (RATINGS.includes(rating)) {
				const val = helpers.bound(
					Number.parseInt(source.ratings[r][rating]),
					0,
					100,
				);
				if (!Number.isNaN(val)) {
					if (target.ratings[r][rating] !== val) {
						target.ratings[r][rating] = val;
						recomputePosOvrPot = true;
					}
				}
			} else if (rating === "locked") {
				target.ratings[r].locked = source.ratings[r].locked;
			}
		}
	}

	// @ts-expect-error
	target.face = JSON.parse(source.face);

	target.relatives = source.relatives
		.map((rel) => {
			// @ts-expect-error
			rel.pid = Number.parseInt(rel.pid);
			return rel;
		})
		.filter((rel) => !Number.isNaN(rel.pid));

	target.customMoodItems = source.customMoodItems?.map((row) => {
		let amount;
		if (typeof row.amount === "number") {
			amount = row.amount;
		} else {
			amount = helpers.localeParseFloat(row.amount);
		}

		if (Number.isNaN(amount)) {
			amount = 0;
		}

		return {
			...row,
			amount,
		};
	});
	if (target.customMoodItems && target.customMoodItems.length === 0) {
		delete target.customMoodItems;
	}

	return recomputePosOvrPot;
};

const useJerseyNumberConflictInfo = (
	pid: number | undefined,
	tid: number,
	jerseyNumber: string,
) => {
	const [jerseyNumberConflictInfo, setJerseyNumberConflictInfo] = useState<
		| {
				type: "player";
				name: string;
				pid: number;
		  }
		| {
				type: "multiple";
		  }
		| {
				type: "retiredJerseyNumber";
		  }
		| undefined
	>();
	useLayoutEffect(() => {
		let mounted = true;

		(async () => {
			if (tid >= 0) {
				const conflictInfo = await toWorker("main", "getJerseyNumberConflict", {
					pid,
					tid,
					jerseyNumber,
				});

				if (!mounted) {
					return;
				}

				setJerseyNumberConflictInfo(conflictInfo);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [jerseyNumber, pid, tid]);

	return jerseyNumberConflictInfo;
};

const CustomizePlayer = (props: View<"customizePlayer">) => {
	const [state, setState] = useState(() => {
		const p = helpers.deepCopy(props.p);
		if (p) {
			// @ts-expect-error
			p.age = props.season - p.born.year;
			p.contract.amount /= 1000;
			// @ts-expect-error
			p.face = JSON.stringify(p.face, null, 2);
		}

		return {
			appearanceOption: props.appearanceOption,
			saving: false,
			p,
		};
	});

	const [autoPos, setAutoPos] = useState(props.initialAutoPos);

	const lastRatings = state.p.ratings.at(-1);
	useEffect(() => {
		let mounted = true;
		(async () => {
			const pos = await toWorker("main", "getAutoPos", lastRatings);

			if (mounted) {
				setAutoPos(pos);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [lastRatings]);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setState((prevState) => ({
			...prevState,
			saving: true,
		}));

		const p = props.p;

		// Copy over values from state, if they're valid
		const recomputePosOvrPot = copyValidValues(
			state.p,
			p,
			props.minContract,
			props.phase,
			props.season,
		);

		// Only save image URL if it's selected
		if (state.appearanceOption !== "Image URL") {
			p.imgURL = "";
		}

		try {
			const pid = await toWorker("main", "upsertCustomizedPlayer", {
				p,
				originalTid: props.originalTid,
				season: props.season,
				recomputePosOvrPot,
			});

			realtimeUpdate([], helpers.leagueUrl(["player", pid]));
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			setState((prevState) => ({
				...prevState,
				saving: false,
			}));
		}
	};

	const handleChange = (
		type: string,
		field: string,
		event:
			| ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
			| {
					target: {
						value: any;
					};
			  },
	) => {
		const val = event.target.value;
		// @ts-expect-error
		const checked = event.target.checked;

		setState((prevState) => {
			const p: any = prevState.p;

			if (type === "root") {
				if (field === "hof") {
					if (val === "yes") {
						p[field] = 1;
					} else {
						delete p[field];
					}
				} else if (field === "jerseyNumber") {
					p.jerseyNumber = val;
				} else if (field === "pos") {
					if (val === "auto") {
						delete p.pos;
					} else {
						p.pos = val;
					}
				} else {
					p[field] = val;
				}
			} else if (type === "moodTraits") {
				if (p.moodTraits.includes(field)) {
					p.moodTraits = p.moodTraits.filter(
						(trait: string) => trait !== field,
					);
				} else {
					p.moodTraits.push(field);
					p.moodTraits.sort();
				}
			} else if (["born", "contract", "draft", "injury"].includes(type)) {
				p[type][field] = val;
			} else if (type === "rating") {
				p.ratings[p.ratings.length - 1] = {
					...p.ratings.at(-1),
					[field]: field === "locked" ? checked : val,
				};
			} else if (type === "face") {
				if (["eye", "hair", "mouth", "nose"].includes(field)) {
					p[type][field].id = val;
				} else if (["eye-angle", "fatness"].includes(field)) {
					if (field === "eye-angle") {
						p[type].eye.angle = val;
					} else {
						p[type][field] = val;
					}
				} else if (field === "color") {
					p[type].head[field] = val;
				} else if (field === "nose-flip") {
					p[type].nose.flip = checked;
				}
			}

			return {
				...prevState,
				p,
			};
		});
	};

	const handleChangeAppearanceOption = (
		event: ChangeEvent<HTMLSelectElement>,
	) => {
		const value = event.target.value;
		setState((prevState) => ({
			...prevState,
			appearanceOption: value,
		}));
	};

	const randomizeFace = async () => {
		const face = await toWorker("main", "generateFace", p.born.loc);

		setState((prevState) => {
			// @ts-expect-error
			prevState.p.face = JSON.stringify(face, null, 2);
			return {
				...prevState,
				p: prevState.p,
			};
		});
	};

	const {
		challengeNoRatings,
		faceCount,
		gender,
		godMode,
		originalTid,
		playerMoodTraits,
		playersRelativesList,
		teams,
	} = props;
	const { appearanceOption, p, saving } = state;

	const title = originalTid === undefined ? "Create Player" : "Edit Player";

	useTitleBar({ title });

	const r = p.ratings.length - 1;

	const adjustRatings = (amount: number) => async (event: MouseEvent) => {
		event.preventDefault();
		setState((prevState) => {
			const p = prevState.p;
			const oldRatings = p.ratings[r];
			const pos = p.pos ?? autoPos;

			const extraKeys = bySport({
				baseball: ["spd"],
				basketball: [],
				football: ["stre", "spd", "endu"],
				hockey: ["stre", "spd", "endu"],
			});
			const keys = [...posRatings(pos), ...extraKeys];

			const newRatings: any = {};
			for (const key of keys) {
				if (key === "hgt") {
					continue;
				}
				newRatings[key] = helpers.bound(
					Number.parseInt(oldRatings[key]) + amount,
					0,
					100,
				);
			}

			const p2: any = {
				...p,
			};
			p2.ratings[r] = {
				...oldRatings,
				...newRatings,
			};

			return {
				...prevState,
				p: p2,
			};
		});
	};

	let jerseyNumber = helpers.getJerseyNumber(p);
	if (!jerseyNumber) {
		jerseyNumber = "";
	}

	const jerseyNumberConflictInfo = useJerseyNumberConflictInfo(
		p.pid,
		p.tid,
		jerseyNumber,
	);

	const draftTeamUndrafted =
		p.draft.tid === PLAYER.UNDRAFTED ||
		(p.draft.tid as any) === String(PLAYER.UNDRAFTED);

	return (
		<>
			{!godMode ? (
				<p className="alert alert-warning d-inline-block">
					Enable <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a> to edit
					all of these fields.
				</p>
			) : null}

			<p>
				Here, you can{" "}
				{originalTid === undefined
					? "create a custom player with"
					: "edit a player to have"}{" "}
				whatever attributes and ratings you want. If you want to make a whole
				league of custom players, you should probably create a{" "}
				<a href={`https://${WEBSITE_ROOT}/manual/customization/`}>
					custom League File
				</a>
				.
			</p>

			<form onSubmit={handleSubmit}>
				<div className="row">
					<div className="col-md-7 mb-3">
						<h2>Attributes</h2>

						<div className="row">
							<div className="col-sm-6 mb-3">
								<label className="form-label">Name</label>
								<div className="input-group">
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "root", "firstName")}
										value={p.firstName}
									/>
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "root", "lastName")}
										value={p.lastName}
									/>
									<button
										className="btn btn-secondary"
										type="button"
										onClick={async (event) => {
											event.preventDefault();

											const { firstName, lastName } = await toWorker(
												"main",
												"getRandomName",
												p.born.loc,
											);

											setState((prevState) => {
												const p: any = {
													...prevState.p,
													firstName,
													lastName,
												};

												return {
													...prevState,
													p,
												};
											});
										}}
									>
										Random
									</button>
								</div>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Age</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "age")}
									value={(p as any).age}
									disabled={!godMode}
								/>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Team</label>
								<select
									className="form-select"
									onChange={handleChange.bind(null, "root", "tid")}
									value={p.tid}
									disabled={!godMode}
								>
									<option value={PLAYER.RETIRED}>Retired</option>
									<option value={PLAYER.UNDRAFTED}>Draft Prospect</option>
									<option value={PLAYER.FREE_AGENT}>Free Agent</option>
									{orderBy(teams, ["text", "tid"]).map((t) => {
										return (
											<option key={t.tid} value={t.tid}>
												{t.text}
											</option>
										);
									})}
								</select>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">
									Height (in){" "}
									<HelpPopover title="Height (inches)">
										Height (inches) is just for show. The height rating is what
										actually gets used in game simulations.
									</HelpPopover>
								</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "hgt")}
									value={p.hgt}
								/>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">
									Weight (lbs){" "}
									<HelpPopover title="Weight (lbs)">
										Weight (lbs) is just for show. The height and strength
										ratings are what actually gets used in game simulations.
									</HelpPopover>
								</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "weight")}
									value={p.weight}
								/>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">
									Position{" "}
									<HelpPopover title="Position">
										<p>
											Leave this set to Auto and it will automatically determine
											the player's position based on their ratings. That
											position can also change in the future as the player's
											ratings change.
										</p>
										<p>
											If you change this to manually specify a position, then
											the player's position will never change in the future.
										</p>
									</HelpPopover>
								</label>
								<select
									className="form-select"
									onChange={handleChange.bind(null, "root", "pos")}
									value={p.pos ?? "auto"}
									disabled={!godMode && p.tid !== PLAYER.RETIRED}
								>
									<option value="auto">
										Auto{autoPos !== undefined ? ` (${autoPos})` : null}
									</option>
									{POSITIONS.filter(
										(pos) => !NOT_REAL_POSITIONS.includes(pos),
									).map((pos) => {
										return (
											<option key={pos} value={pos}>
												{pos}
											</option>
										);
									})}
								</select>
							</div>
							<div className="col-6 col-sm-3 mb-3">
								<label className="form-label">Jersey Number</label>
								<div className="input-group">
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "root", "jerseyNumber")}
										value={jerseyNumber}
									/>
									<button
										className="btn btn-secondary"
										type="button"
										onClick={async (event) => {
											event.preventDefault();

											const jerseyNumber = await toWorker(
												"main",
												"getRandomJerseyNumber",
												{
													pid: p.pid,
													tid: p.tid,
													pos: p.pos ?? autoPos,
												},
											);

											// Ugly, but needed for easy updating in root and stats
											handleChange("root", "jerseyNumber", {
												target: { value: jerseyNumber ?? "" },
											});
										}}
										title="Picks a random jersey number, ignoring retired jersey numbers and other numbers already used by teammates"
									>
										Rand
										<span className="d-inline d-md-none d-lg-inline">om</span>
									</button>
								</div>
								{jerseyNumberConflictInfo ? (
									<span className="form-text text-danger">
										{jerseyNumberConflictInfo.type === "player" ? (
											<>
												Conflicts with{" "}
												<a
													href={helpers.leagueUrl([
														"player",
														jerseyNumberConflictInfo.pid,
													])}
												>
													{jerseyNumberConflictInfo.name}
												</a>
											</>
										) : jerseyNumberConflictInfo.type ===
										  "retiredJerseyNumber" ? (
											"Retired jersey number"
										) : (
											"Conflicts with multiple teammates"
										)}
									</span>
								) : null}
							</div>
							<div className="col-6 mb-3">
								<label className="form-label">Country</label>
								<div className="input-group">
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "born", "loc")}
										value={p.born.loc}
										disabled={!godMode}
									/>
									<button
										className="btn btn-secondary"
										type="button"
										disabled={!godMode}
										onClick={async (event) => {
											event.preventDefault();

											const country = await toWorker(
												"main",
												"getRandomCountry",
												undefined,
											);

											setState((prevState) => {
												const p: any = {
													...prevState.p,
													born: {
														...prevState.p.born,
														loc: country,
													},
												};

												return {
													...prevState,
													p,
												};
											});
										}}
									>
										Random
									</button>
								</div>
							</div>
							<div className="col-6 mb-3">
								<label className="form-label">College</label>
								<div className="input-group">
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "root", "college")}
										value={p.college}
									/>
									<button
										className="btn btn-secondary"
										type="button"
										onClick={async (event) => {
											event.preventDefault();

											const college = await toWorker(
												"main",
												"getRandomCollege",
												undefined,
											);

											setState((prevState) => {
												const p: any = {
													...prevState.p,
													college,
												};

												return {
													...prevState,
													p,
												};
											});
										}}
									>
										Random
									</button>
								</div>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Draft Class</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "draft", "year")}
									value={p.draft.year}
									disabled={!godMode}
								/>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Draft Round</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "draft", "round")}
									value={draftTeamUndrafted ? 0 : p.draft.round}
									disabled={!godMode || draftTeamUndrafted}
								/>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Draft Pick</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "draft", "pick")}
									value={draftTeamUndrafted ? 0 : p.draft.pick}
									disabled={!godMode || draftTeamUndrafted}
								/>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Draft Team</label>
								<select
									className="form-select"
									onChange={handleChange.bind(null, "draft", "tid")}
									value={p.draft.tid}
									disabled={!godMode}
								>
									<option value={PLAYER.UNDRAFTED}>Undrafted</option>
									{orderBy(teams, ["text", "tid"]).map((t) => {
										return (
											<option key={t.tid} value={t.tid}>
												{t.text}
											</option>
										);
									})}
								</select>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Year of Death</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "diedYear")}
									value={p.diedYear}
									disabled={!godMode}
								/>
							</div>
							<div className="col-3 mb-3">
								<label className="form-label">Hall of Fame</label>
								<select
									className="form-select"
									onChange={handleChange.bind(null, "root", "hof")}
									value={p.hof ? "yes" : "no"}
									disabled={!godMode}
								>
									<option value="yes">Yes</option>
									<option value="no">No</option>
								</select>
							</div>
							<div className="col-sm-6 mb-3">
								<label className="form-label">Injury and Games Out</label>
								<div className="input-group">
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "injury", "type")}
										value={p.injury.type}
										disabled={!godMode}
									/>
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(
											null,
											"injury",
											"gamesRemaining",
										)}
										value={p.injury.gamesRemaining}
										disabled={!godMode}
										style={{
											maxWidth: 70,
										}}
									/>
									{p.injury.type !== "Healthy" ||
									p.injury.gamesRemaining !== 0 ? (
										<button
											className="btn btn-secondary"
											type="button"
											onClick={async (event) => {
												event.preventDefault();

												setState((prevState) => {
													const p: any = {
														...prevState.p,
														injury: {
															type: "Healthy",
															gamesRemaining: 0,
														},
													};

													return {
														...prevState,
														p,
													};
												});
											}}
											disabled={!godMode}
										>
											Heal
										</button>
									) : (
										<button
											className="btn btn-secondary"
											type="button"
											onClick={async (event) => {
												event.preventDefault();

												const injury = await toWorker(
													"main",
													"getRandomInjury",
													undefined,
												);
												if (injury.gamesRemaining === 0) {
													injury.gamesRemaining = 1;
												}

												setState((prevState) => {
													const p: any = {
														...prevState.p,
														injury,
													};

													return {
														...prevState,
														p,
													};
												});
											}}
											disabled={!godMode}
										>
											Injure
										</button>
									)}
								</div>
							</div>
						</div>
						<div className="row">
							<div className="col-6 mb-3">
								<label className="form-label">Contract Amount</label>
								<CurrencyInputGroup displayUnit="M">
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "contract", "amount")}
										value={p.contract.amount}
										disabled={!godMode}
									/>
								</CurrencyInputGroup>
							</div>
							<div className="col-6 mb-3">
								<label className="form-label">Contract Expiration</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "contract", "exp")}
									value={p.contract.exp}
									disabled={!godMode}
								/>
							</div>
							{playerMoodTraits ? (
								<div className="col-3 mb-3">
									<label className="form-label">Mood Traits</label>
									{helpers.keys(MOOD_TRAITS).map((trait) => (
										<div className="form-check" key={trait}>
											<label className="form-check-label">
												<input
													className="form-check-input"
													type="checkbox"
													checked={p.moodTraits.includes(trait)}
													disabled={!godMode}
													onChange={handleChange.bind(
														null,
														"moodTraits",
														trait,
													)}
												/>
												{MOOD_TRAITS[trait]}
											</label>
										</div>
									))}
								</div>
							) : null}
							<div className="col-sm-9 mb-3">
								<label className="form-label">
									Custom Mood Items{" "}
									<HelpPopover title="Custom Mood Items">
										Add custom entries to a player's mood calculation. By
										default you see things like "+2 Enjoys playing in a large
										market", and with this setting you can add custom text with
										any numeric value to alter a player's mood towards a
										specific team or towards all teams.
									</HelpPopover>
								</label>
								<CustomMoodItemsForm
									godMode={godMode}
									handleChange={handleChange}
									customMoodItems={p.customMoodItems}
								/>
							</div>
						</div>

						<h2>Appearance</h2>

						<div>
							<label className="form-label">
								You can either create a cartoon face or specify the URL to an
								image.
							</label>
							<select
								className="form-select"
								onChange={handleChangeAppearanceOption}
								style={{ maxWidth: "150px" }}
								value={appearanceOption}
							>
								<option value="Cartoon Face">Cartoon Face</option>
								<option value="Image URL">Image URL</option>
							</select>
						</div>

						{appearanceOption === "Cartoon Face" ? (
							<Face
								face={p.face as any}
								faceCount={faceCount}
								onChange={(face) => {
									setState((prevState) => {
										return {
											...prevState,
											p: {
												...prevState.p,
												face: face as any,
											},
										};
									});
								}}
								randomizeFace={randomizeFace}
							/>
						) : (
							<div className="my-3">
								<label className="form-label">Image URL</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "imgURL")}
									value={p.imgURL}
								/>
								<span className="text-body-secondary">
									Your image must be hosted externally. If you need to upload an
									image, try using{" "}
									<a href="http://imgur.com/" target="_blank">
										imgur
									</a>
									. For more details, see{" "}
									<a
										href={`https://${WEBSITE_ROOT}/manual/customization/player-photos-team-logos/`}
										target="_blank"
									>
										the manual
									</a>
									.
								</span>
							</div>
						)}
					</div>

					<div className="col-md-5 mb-3">
						<div className="float-end d-flex flex-column">
							<button
								type="button"
								className="btn btn-secondary btn-sm mb-1"
								title={`Ratings will be taken from a randomly generated player with the same age${bySport(
									{
										baseball: " and position",
										basketball: "",
										football: " and position",
										hockey: " and position",
									},
								)} as this player`}
								onClick={async (event) => {
									event.preventDefault();
									const { hgt, ratings } = await toWorker(
										"main",
										"getRandomRatings",
										{
											age: (p as any).age,
											pos: bySport({
												baseball: p.pos ?? autoPos,
												basketball: undefined,
												football: p.pos ?? autoPos,
												hockey: p.pos ?? autoPos,
											}),
										},
									);

									setState((prevState) => {
										const p: any = {
											...prevState.p,
											hgt,
										};
										p.ratings[r] = {
											...p.ratings[r],
											...ratings,
										};

										return {
											...prevState,
											p,
										};
									});
								}}
								disabled={!godMode}
							>
								Randomize
							</button>

							<div className="ms-1 btn-group">
								<button
									type="button"
									className="btn btn-secondary btn-sm"
									onClick={adjustRatings(-1)}
									disabled={!godMode}
								>
									<span className="glyphicon glyphicon-minus" />
								</button>
								<button
									type="button"
									className="btn btn-secondary btn-sm"
									onClick={adjustRatings(1)}
									disabled={!godMode}
								>
									<span className="glyphicon glyphicon-plus" />
								</button>
							</div>
						</div>

						<h2>Ratings</h2>

						<RatingsForm
							challengeNoRatings={challengeNoRatings}
							godMode={godMode}
							handleChange={handleChange}
							pos={p.pos ?? autoPos}
							ratingsRow={p.ratings[r]}
						/>

						<h2>Relatives</h2>

						<RelativesForm
							gender={gender}
							godMode={godMode}
							handleChange={handleChange}
							initialPlayers={playersRelativesList}
							relatives={p.relatives}
						/>
					</div>
				</div>

				<div className="text-center">
					<button
						type="submit"
						className="btn btn-primary btn-lg"
						disabled={saving}
					>
						{title}
					</button>
				</div>
			</form>
		</>
	);
};

export default CustomizePlayer;
