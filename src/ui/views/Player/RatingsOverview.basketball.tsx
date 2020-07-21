import PropTypes from "prop-types";
import React from "react";
import type { PlayerRatings } from "../../../common/types.basketball";
import RatingWithChange from "../../components/RatingWithChange";

const RatingsOverview = ({ ratings }: { ratings: PlayerRatings[] }) => {
	const r = ratings.length - 1;

	let lastSeason: PlayerRatings = ratings[r];
	// Search backwards to find the last entry from last season, in the case where there are multiple rows due to injuries
	for (let i = r; i >= 0; i--) {
		if (ratings[i].season === ratings[r].season - 1) {
			lastSeason = ratings[i];
			break;
		}
	}

	return (
		<>
			<div className="d-none d-lg-flex row">
				<div className="col-lg-8">
					<h2>
						Overall:{" "}
						<RatingWithChange change={ratings[r].ovr - lastSeason.ovr}>
							{ratings[r].ovr}
						</RatingWithChange>
					</h2>
				</div>
				<div className="col-lg-4">
					<h2>
						Potential:{" "}
						<RatingWithChange change={ratings[r].pot - lastSeason.pot}>
							{ratings[r].pot}
						</RatingWithChange>
					</h2>
				</div>
			</div>
			<div className="d-lg-none row">
				<div className="col-6">
					<h2>
						Overall:{" "}
						<RatingWithChange change={ratings[r].ovr - lastSeason.ovr}>
							{ratings[r].ovr}
						</RatingWithChange>
					</h2>
				</div>
				<div className="col-6">
					<h2>
						Potential:{" "}
						<RatingWithChange change={ratings[r].pot - lastSeason.pot}>
							{ratings[r].pot}
						</RatingWithChange>
					</h2>
				</div>
			</div>
			<div className="row">
				<div className="col-4">
					<b>Physical</b>
					<br />
					Height:{" "}
					<RatingWithChange change={ratings[r].hgt - lastSeason.hgt}>
						{ratings[r].hgt}
					</RatingWithChange>
					<br />
					Strength:{" "}
					<RatingWithChange change={ratings[r].stre - lastSeason.stre}>
						{ratings[r].stre}
					</RatingWithChange>
					<br />
					Speed:{" "}
					<RatingWithChange change={ratings[r].spd - lastSeason.spd}>
						{ratings[r].spd}
					</RatingWithChange>
					<br />
					Jumping:{" "}
					<RatingWithChange change={ratings[r].jmp - lastSeason.jmp}>
						{ratings[r].jmp}
					</RatingWithChange>
					<br />
					Endurance:{" "}
					<RatingWithChange change={ratings[r].endu - lastSeason.endu}>
						{ratings[r].endu}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Shooting</b>
					<br />
					Inside:{" "}
					<RatingWithChange change={ratings[r].ins - lastSeason.ins}>
						{ratings[r].ins}
					</RatingWithChange>
					<br />
					<span className="d-md-none">Layups</span>
					<span className="d-none d-md-inline">Dunks/Layups</span>:{" "}
					<RatingWithChange change={ratings[r].dnk - lastSeason.dnk}>
						{ratings[r].dnk}
					</RatingWithChange>
					<br />
					<span className="d-md-none">FT</span>
					<span className="d-none d-md-inline">Free Throws</span>:{" "}
					<RatingWithChange change={ratings[r].ft - lastSeason.ft}>
						{ratings[r].ft}
					</RatingWithChange>
					<br />
					Mid Range:{" "}
					<RatingWithChange change={ratings[r].fg - lastSeason.fg}>
						{ratings[r].fg}
					</RatingWithChange>
					<br />3 Pointers:{" "}
					<RatingWithChange change={ratings[r].tp - lastSeason.tp}>
						{ratings[r].tp}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Skill</b>
					<br />
					<span className="d-md-none">Off</span>
					<span className="d-none d-md-inline">Offensive</span> IQ:{" "}
					<RatingWithChange change={ratings[r].oiq - lastSeason.oiq}>
						{ratings[r].oiq}
					</RatingWithChange>
					<br />
					<span className="d-md-none">Def</span>
					<span className="d-none d-md-inline">Defensive</span> IQ:{" "}
					<RatingWithChange change={ratings[r].diq - lastSeason.diq}>
						{ratings[r].diq}
					</RatingWithChange>
					<br />
					Dribbling:{" "}
					<RatingWithChange change={ratings[r].drb - lastSeason.drb}>
						{ratings[r].drb}
					</RatingWithChange>
					<br />
					Passing:{" "}
					<RatingWithChange change={ratings[r].pss - lastSeason.pss}>
						{ratings[r].pss}
					</RatingWithChange>
					<br />
					<span className="d-md-none">Reb</span>
					<span className="d-none d-md-inline">Rebounding</span>:{" "}
					<RatingWithChange change={ratings[r].reb - lastSeason.reb}>
						{ratings[r].reb}
					</RatingWithChange>
				</div>
			</div>
		</>
	);
};

RatingsOverview.propTypes = {
	ratings: PropTypes.arrayOf(
		PropTypes.shape({
			diq: PropTypes.number.isRequired,
			dnk: PropTypes.number.isRequired,
			drb: PropTypes.number.isRequired,
			endu: PropTypes.number.isRequired,
			fg: PropTypes.number.isRequired,
			ft: PropTypes.number.isRequired,
			hgt: PropTypes.number.isRequired,
			ins: PropTypes.number.isRequired,
			jmp: PropTypes.number.isRequired,
			oiq: PropTypes.number.isRequired,
			ovr: PropTypes.number.isRequired,
			pot: PropTypes.number.isRequired,
			pss: PropTypes.number.isRequired,
			reb: PropTypes.number.isRequired,
			spd: PropTypes.number.isRequired,
			stre: PropTypes.number.isRequired,
			tp: PropTypes.number.isRequired,
		}),
	).isRequired,
};

export default RatingsOverview;
