import orderBy from "lodash/orderBy";
import PropTypes from "prop-types";
import React, {
	useState,
	FormEvent,
	ChangeEvent,
	MouseEvent,
	ReactNode,
} from "react";
import {
	PHASE,
	PLAYER,
	RATINGS,
	POSITIONS,
	MOOD_TRAITS,
} from "../../../common";
import { PlayerPicture, HelpPopover } from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers, realtimeUpdate, toWorker, logEvent } from "../../util";
import RatingsForm from "./RatingsForm";
import RelativesForm from "./RelativesForm";
import type { View, Phase, PlayerWithoutKey } from "../../../common/types";
import posRatings from "../../../common/posRatings";

// A player can never have KR or PR as his main position
const bannedPositions = ["KR", "PR"];

const copyValidValues = (
	source: PlayerWithoutKey,
	target: PlayerWithoutKey,
	minContract: number,
	phase: Phase,
	season: number,
) => {
	// Should be true if a player is becoming "active" (moving to a team from a non-team, such as free agent, retired, draft prospect, or new player)
	// @ts-ignore
	const activated = source.tid >= 0 && parseInt(target.tid, 10) < 0;

	for (const attr of ["hgt", "tid", "weight"] as const) {
		// @ts-ignore
		const val = parseInt(source[attr], 10);
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
			award => !award.type.includes("Hall of Fame"),
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

	// jerseyNumber? could be in root or stats
	if (target.jerseyNumber !== source.jerseyNumber) {
		target.jerseyNumber = source.jerseyNumber;
		if (target.jerseyNumber === "") {
			target.jerseyNumber = undefined;
		}
	}
	if (target.stats.length > 0 && source.stats.length > 0) {
		target.stats[target.stats.length - 1].jerseyNumber =
			source.stats[source.stats.length - 1].jerseyNumber;
		if (target.stats[target.stats.length - 1].jerseyNumber === "") {
			target.jerseyNumber = undefined;
			target.stats[target.stats.length - 1].jerseyNumber = undefined;
		}
	}

	let updatedRatingsOrAge = false;
	{
		// @ts-ignore
		const age = parseInt(source.age, 10);
		if (!Number.isNaN(age)) {
			const bornYear = season - age;
			if (bornYear !== target.born.year) {
				target.born.year = bornYear;
				updatedRatingsOrAge = true;
			}
		}
	}

	target.born.loc = source.born.loc;

	target.college = source.college;

	{
		// @ts-ignore
		const diedYear = parseInt(source.diedYear, 10);
		if (!Number.isNaN(diedYear)) {
			target.diedYear = diedYear;
		} else {
			target.diedYear = undefined;
		}
	}

	const oldContract = {
		...target.contract,
	};

	let contractChanged = false;

	{
		// Allow any value, even above or below normal limits, but round to $10k and convert from M to k
		// @ts-ignore
		let amount = Math.round(100 * parseFloat(source.contract.amount)) * 10;
		if (Number.isNaN(amount)) {
			amount = minContract;
		}

		if (target.contract.amount !== amount) {
			target.contract.amount = amount;
			contractChanged = true;
		}
	}

	{
		// @ts-ignore
		let exp = parseInt(source.contract.exp, 10);
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
			target.salaries = target.salaries.filter(salary => {
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
		// @ts-ignore
		const draftYear = parseInt(source.draft.year, 10);
		if (!Number.isNaN(draftYear)) {
			target.draft.year = draftYear;
		}
	}

	{
		// @ts-ignore
		let gamesRemaining = parseInt(source.injury.gamesRemaining, 10);
		if (Number.isNaN(gamesRemaining) || gamesRemaining < 0) {
			gamesRemaining = 0;
		}
		target.injury.gamesRemaining = gamesRemaining;
	}

	target.injury.type = source.injury.type;

	{
		const r = source.ratings.length - 1;
		for (const rating of Object.keys(source.ratings[r])) {
			if (rating === "pos") {
				if (target.ratings[r].pos !== source.ratings[r].pos) {
					target.ratings[r].pos = source.ratings[r].pos;
					target.pos = source.ratings[r].pos; // Keep this way forever because fun
				}
			} else if (RATINGS.includes(rating)) {
				const val = helpers.bound(
					parseInt(source.ratings[r][rating], 10),
					0,
					100,
				);
				if (!Number.isNaN(val)) {
					if (target.ratings[r][rating] !== val) {
						target.ratings[r][rating] = val;
						updatedRatingsOrAge = true;
					}
				}
			} else if (rating === "locked") {
				target.ratings[r].locked = source.ratings[r].locked;
			}
		}
	}

	// @ts-ignore
	target.face = JSON.parse(source.face);

	target.relatives = source.relatives
		.map(rel => {
			// @ts-ignore
			rel.pid = parseInt(rel.pid, 10);
			return rel;
		})
		.filter(rel => !Number.isNaN(rel.pid));

	return updatedRatingsOrAge;
};

const CustomizePlayer = (props: View<"customizePlayer">) => {
	const [state, setState] = useState(() => {
		const p = helpers.deepCopy(props.p);
		if (p) {
			// @ts-ignore
			p.age = props.season - p.born.year;
			p.contract.amount /= 1000;
			// @ts-ignore
			p.face = JSON.stringify(p.face, null, 2);
		}

		return {
			appearanceOption: props.appearanceOption,
			saving: false,
			p,
		};
	});

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setState(prevState => ({
			...prevState,
			saving: true,
		}));

		const p = props.p;

		// Copy over values from state, if they're valid
		const updatedRatingsOrAge = copyValidValues(
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
			const pid = await toWorker(
				"main",
				"upsertCustomizedPlayer",
				p,
				props.originalTid,
				props.season,
				updatedRatingsOrAge,
			);

			realtimeUpdate([], helpers.leagueUrl(["player", pid]));
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			setState(prevState => ({
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
		// @ts-ignore
		const checked = event.target.checked;

		setState(prevState => {
			const p: any = prevState.p;

			if (type === "root") {
				if (field === "hof") {
					p[field] = val === "true";
				} else if (field === "jerseyNumber") {
					if (p.stats.length > 0) {
						p.stats[p.stats.length - 1].jerseyNumber = val;
					} else {
						p.jerseyNumber = val;
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
				if (field === "locked") {
					p.ratings[p.ratings.length - 1][field] = checked;
				} else {
					p.ratings[p.ratings.length - 1][field] = val;
				}
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
		setState(prevState => ({
			...prevState,
			appearanceOption: value,
		}));
	};

	const randomizeFace = async (event: MouseEvent) => {
		event.preventDefault(); // Don't submit whole form

		const face = await toWorker("main", "generateFace");

		setState(prevState => {
			// @ts-ignore
			prevState.p.face = JSON.stringify(face, null, 2);
			return {
				...prevState,
				p: prevState.p,
			};
		});
	};

	const { godMode, originalTid, playerMoodTraits, teams } = props;
	const { appearanceOption, p, saving } = state;

	const title = originalTid === undefined ? "Create Player" : "Edit Player";

	useTitleBar({ title });

	const r = p.ratings.length - 1;

	let parsedFace;
	try {
		// @ts-ignore
		parsedFace = JSON.parse(p.face);
	} catch (error) {}

	const faceHash = parsedFace ? btoa(JSON.stringify(parsedFace)) : "";

	let pictureDiv: ReactNode = null;
	if (appearanceOption === "Cartoon Face") {
		pictureDiv = (
			<div className="row">
				<div className="col-sm-4">
					<div style={{ maxHeight: "225px", maxWidth: "150px" }}>
						{parsedFace ? <PlayerPicture face={parsedFace} /> : "Invalid JSON"}
					</div>
				</div>
				<div className="col-sm-8">
					<p>
						You can edit this JSON here, but you'll probably find it easier to
						use{" "}
						<a
							href={`http://dumbmatter.com/facesjs/editor.html#${faceHash}`}
							rel="noopener noreferrer"
							target="_blank"
						>
							the face editor
						</a>{" "}
						and copy the results back here. Team colors set there will be
						overridden here.
					</p>
					<textarea
						className="form-control"
						onChange={handleChange.bind(null, "root", "face")}
						rows={10}
						value={p.face as any}
					/>
					<button
						type="button"
						className="btn btn-secondary mt-1"
						onClick={randomizeFace}
					>
						Randomize
					</button>
				</div>
			</div>
		);
	} else {
		pictureDiv = (
			<div className="form-group">
				<label>Image URL</label>
				<input
					type="text"
					className="form-control"
					onChange={handleChange.bind(null, "root", "imgURL")}
					value={p.imgURL}
				/>
				<span className="text-muted">
					Your image must be hosted externally. If you need to upload an image,
					try using{" "}
					<a href="http://imgur.com/" rel="noopener noreferrer" target="_blank">
						imgur
					</a>
					. For ideal display, crop your image so it has a 2:3 aspect ratio
					(such as 100px wide and 150px tall).
				</span>
			</div>
		);
	}

	const adjustRatings = (amount: number) => async (event: MouseEvent) => {
		event.preventDefault();
		setState(prevState => {
			const p = prevState.p;
			const oldRatings = p.ratings[r];
			const pos = p.ratings[r].pos;

			const keys = posRatings(pos);
			if (process.env.SPORT === "football") {
				keys.push("stre", "spd", "endu");
			}

			const newRatings: any = {};
			for (const key of keys) {
				if (key === "hgt") {
					continue;
				}
				newRatings[key] = helpers.bound(
					parseInt(oldRatings[key]) + amount,
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
				<a href={`https://${process.env.SPORT}-gm.com/manual/customization/`}>
					custom League File
				</a>
				.
			</p>

			<form onSubmit={handleSubmit}>
				<div className="row">
					<div className="col-md-7">
						<h2>Attributes</h2>

						<div className="row">
							<div className="col-sm-3 form-group">
								<label>First Name</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "firstName")}
									value={p.firstName}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Last Name</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "lastName")}
									value={p.lastName}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Age</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "age")}
									value={(p as any).age}
									disabled={!godMode}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Team</label>
								<select
									className="form-control"
									onChange={handleChange.bind(null, "root", "tid")}
									value={p.tid}
									disabled={!godMode}
								>
									<option value={PLAYER.RETIRED}>Retired</option>
									<option value={PLAYER.UNDRAFTED}>Draft Prospect</option>
									<option value={PLAYER.FREE_AGENT}>Free Agent</option>
									{orderBy(teams, ["text", "tid"]).map(t => {
										return (
											<option key={t.tid} value={t.tid}>
												{t.text}
											</option>
										);
									})}
								</select>
							</div>
							<div className="col-sm-3 form-group">
								<label>
									Height (inches){" "}
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
							<div className="col-sm-3 form-group">
								<label>
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
							<div className="col-sm-3 form-group">
								<label>Position</label>
								<select
									className="form-control"
									onChange={handleChange.bind(null, "rating", "pos")}
									value={p.ratings[r].pos}
									disabled={!godMode}
								>
									{POSITIONS.filter(pos => {
										if (
											process.env.SPORT === "football" &&
											bannedPositions.includes(pos)
										) {
											return false;
										}
										return true;
									}).map(pos => {
										return (
											<option key={pos} value={pos}>
												{pos}
											</option>
										);
									})}
								</select>
							</div>
							<div className="col-sm-3 form-group">
								<label>Jersey Number</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "jerseyNumber")}
									value={jerseyNumber}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Hometown</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "born", "loc")}
									value={p.born.loc}
									disabled={!godMode}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>College</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "college")}
									value={p.college}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Draft Class</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "draft", "year")}
									value={p.draft.year}
									disabled={!godMode}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Year of Death</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "diedYear")}
									value={p.diedYear}
									disabled={!godMode}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Hall of Fame</label>
								<select
									className="form-control"
									onChange={handleChange.bind(null, "root", "hof")}
									value={String(p.hof)}
									disabled={!godMode}
								>
									<option value="true">Yes</option>
									<option value="false">No</option>
								</select>
							</div>
						</div>
						<div className="row">
							<div className="col-sm-6 form-group">
								<label>Contract Amount</label>
								<div className="input-group">
									<div className="input-group-prepend">
										<div className="input-group-text">$</div>
									</div>
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "contract", "amount")}
										value={p.contract.amount}
										disabled={!godMode}
									/>
									<div className="input-group-append">
										<div className="input-group-text">M per year</div>
									</div>
								</div>
							</div>
							<div className="col-sm-6 form-group">
								<label>Contract Expiration</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "contract", "exp")}
									value={p.contract.exp}
									disabled={!godMode}
								/>
							</div>
							<div className="col-sm-6 form-group">
								<label>Injury</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "injury", "type")}
									value={p.injury.type}
									disabled={!godMode}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Games Out</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "injury", "gamesRemaining")}
									value={p.injury.gamesRemaining}
									disabled={!godMode}
								/>
							</div>
							{playerMoodTraits ? (
								<div className="col-sm-3 form-group">
									<label>Mood Traits</label>
									{helpers.keys(MOOD_TRAITS).map(trait => (
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
						</div>

						<h2>Appearance</h2>

						<div className="form-group">
							<label>
								You can either create a cartoon face or specify the URL to an
								image.
							</label>
							<select
								className="form-control"
								onChange={handleChangeAppearanceOption}
								style={{ maxWidth: "150px" }}
								value={appearanceOption}
							>
								<option value="Cartoon Face">Cartoon Face</option>
								<option value="Image URL">Image URL</option>
							</select>
						</div>

						{pictureDiv}
					</div>

					<div className="col-md-5">
						<div className="float-right d-flex flex-column">
							<button
								type="button"
								className="btn btn-secondary btn-sm mb-1"
								title={`Ratings will be taken from a randomly generated player with the same age${
									process.env.SPORT === "football" ? " and position" : ""
								} as this player`}
								onClick={async event => {
									event.preventDefault();
									const { hgt, ratings } = await toWorker(
										"main",
										"getRandomRatings",
										(p as any).age,
										process.env.SPORT === "football"
											? p.ratings[r].pos
											: undefined,
									);

									setState(prevState => {
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

							<div className="ml-1 btn-group">
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

						<p>All ratings are on a scale of 0 to 100.</p>

						<RatingsForm
							godMode={godMode}
							handleChange={handleChange}
							ratingsRow={p.ratings[r]}
						/>

						<h2>Relatives</h2>

						<RelativesForm
							godMode={godMode}
							handleChange={handleChange}
							relatives={p.relatives}
						/>
					</div>
				</div>

				<br />
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

CustomizePlayer.propTypes = {
	appearanceOption: PropTypes.oneOf(["Cartoon Face", "Image URL"]),
	originalTid: PropTypes.number,
	minContract: PropTypes.number,
	phase: PropTypes.number,
	p: PropTypes.object,
	season: PropTypes.number,
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			text: PropTypes.string.isRequired,
			tid: PropTypes.number.isRequired,
		}),
	),
};

export default CustomizePlayer;
