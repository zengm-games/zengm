import PropTypes from "prop-types";
import React, { useState } from "react";
import { PHASE } from "../../../common";
import { PlayerPicture } from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers, overrides, realtimeUpdate, toWorker } from "../../util";
import RatingsForm from "./RatingsForm";
import RelativesForm from "./RelativesForm";

// A player can never have KR or PR as his main position
const bannedPositions = ["KR", "PR"];

const copyValidValues = (source, target, minContract, phase, season) => {
	for (const attr of ["hgt", "tid", "weight"]) {
		const val = parseInt(source[attr], 10);
		if (!Number.isNaN(val)) {
			target[attr] = val;
		}
	}

	target.firstName = source.firstName;
	target.lastName = source.lastName;
	target.imgURL = source.imgURL;

	let updatedRatingsOrAge = false;
	{
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
		const diedYear = parseInt(source.diedYear, 10);
		if (!Number.isNaN(diedYear)) {
			target.diedYear = diedYear;
		} else {
			target.diedYear = undefined;
		}
	}

	{
		// Allow any value, even above or below normal limits, but round to $10k and convert from M to k
		let amount = Math.round(100 * parseFloat(source.contract.amount)) * 10;
		if (Number.isNaN(amount)) {
			amount = minContract;
		}
		target.contract.amount = amount;
	}

	{
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

			target.contract.exp = exp;
		}
	}

	{
		const draftYear = parseInt(source.draft.year, 10);
		if (!Number.isNaN(draftYear)) {
			target.draft.year = draftYear;
		}
	}

	{
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
			} else if (overrides.common.constants.RATINGS.includes(rating)) {
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
			}
		}
	}

	target.face = JSON.parse(source.face);

	target.relatives = source.relatives
		.map(rel => {
			rel.pid = parseInt(rel.pid, 10);
			return rel;
		})
		.filter(rel => !Number.isNaN(rel.pid));

	return updatedRatingsOrAge;
};

const CustomizePlayer = props => {
	const [state, setState] = useState(() => {
		const p = helpers.deepCopy(props.p);
		if (p !== undefined) {
			p.age = props.season - p.born.year;
			p.contract.amount /= 1000;
			p.face = JSON.stringify(p.face, null, 2);
		}

		return {
			appearanceOption: props.appearanceOption,
			saving: false,
			p,
		};
	});

	const handleSubmit = async event => {
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

		const pid = await toWorker(
			"upsertCustomizedPlayer",
			p,
			props.originalTid,
			props.season,
			updatedRatingsOrAge,
		);

		realtimeUpdate([], helpers.leagueUrl(["player", pid]));
	};

	const handleChange = (type, field, event) => {
		const val = event.target.value;
		const checked = event.target.checked;

		setState(prevState => {
			const p = prevState.p;

			if (type === "root") {
				p[field] = val;
			} else if (["born", "contract", "draft", "injury"].includes(type)) {
				p[type][field] = val;
			} else if (type === "rating") {
				p.ratings[p.ratings.length - 1][field] = val;
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

	const handleChangeAppearanceOption = event => {
		const value = event.target.value;
		setState(prevState => ({
			...prevState,
			appearanceOption: value,
		}));
	};

	const randomizeFace = async event => {
		event.preventDefault(); // Don't submit whole form

		const face = await toWorker("generateFace");

		setState(prevState => {
			prevState.p.face = JSON.stringify(face, null, 2);
			return {
				...prevState,
				p: prevState.p,
			};
		});
	};

	const { godMode, originalTid, teams } = props;
	const { appearanceOption, p, saving } = state;

	const title = originalTid === undefined ? "Create Player" : "Edit Player";

	useTitleBar({ title });

	if (!godMode) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You can't customize players unless you enable{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
				</p>
			</div>
		);
	}

	const r = p.ratings.length - 1;

	let parsedFace;
	try {
		parsedFace = JSON.parse(p.face);
	} catch (error) {}

	const faceHash = parsedFace ? btoa(JSON.stringify(parsedFace)) : "";

	let pictureDiv = null;
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
						rows="10"
						value={p.face}
					/>
					<button
						type="button"
						className="btn btn-light-bordered mt-1"
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
					try using <a href="http://imgur.com/">imgur</a>. For ideal display,
					crop your image so it has a 2:3 aspect ratio (such as 100px wide and
					150px tall).
				</span>
			</div>
		);
	}

	return (
		<>
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
									value={p.age}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Team</label>
								<select
									className="form-control"
									onChange={handleChange.bind(null, "root", "tid")}
									value={p.tid}
								>
									{teams.map(t => {
										return (
											<option key={t.tid} value={t.tid}>
												{t.text}
											</option>
										);
									})}
								</select>
							</div>
							<div className="col-sm-3 form-group">
								<label>Height (inches)</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "hgt")}
									value={p.hgt}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Weight (lbs)</label>
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
								>
									{overrides.common.constants.POSITIONS.filter(pos => {
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
								<label>Hometown</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "born", "loc")}
									value={p.born.loc}
								/>
							</div>
							<div className="col-sm-6 form-group">
								<label>Year of Death (blank for alive)</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "root", "diedYear")}
									value={p.diedYear}
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
								/>
							</div>
							<div className="col-sm-6 form-group">
								<label>Contract Amount</label>
								<div className="input-group">
									<div className="input-group-append">
										<div className="input-group-text">$</div>
									</div>
									<input
										type="text"
										className="form-control"
										onChange={handleChange.bind(null, "contract", "amount")}
										value={p.contract.amount}
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
								/>
							</div>
							<div className="col-sm-6 form-group">
								<label>Injury</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "injury", "type")}
									value={p.injury.type}
								/>
							</div>
							<div className="col-sm-3 form-group">
								<label>Games Out</label>
								<input
									type="text"
									className="form-control"
									onChange={handleChange.bind(null, "injury", "gamesRemaining")}
									value={p.injury.gamesRemaining}
								/>
							</div>
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
						<h2>Ratings</h2>

						<p>All ratings are on a scale of 0 to 100.</p>

						<RatingsForm
							handleChange={handleChange}
							ratingsRow={p.ratings[r]}
						/>

						<h2>Relatives</h2>

						<RelativesForm
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
	godMode: PropTypes.bool.isRequired,
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
