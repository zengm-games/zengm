import PropTypes from "prop-types";
import React from "react";
import type { PlayerRatings } from "../../../common/types.football";
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
					<h2 className="float-right">
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
					Endurance:{" "}
					<RatingWithChange change={ratings[r].endu - lastSeason.endu}>
						{ratings[r].endu}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Passing</b>
					<br />
					Vision:{" "}
					<RatingWithChange change={ratings[r].thv - lastSeason.thv}>
						{ratings[r].thv}
					</RatingWithChange>
					<br />
					Power:{" "}
					<RatingWithChange change={ratings[r].thp - lastSeason.thp}>
						{ratings[r].thp}
					</RatingWithChange>
					<br />
					Accuracy:{" "}
					<RatingWithChange change={ratings[r].tha - lastSeason.tha}>
						{ratings[r].tha}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Rushing/Receiving</b>
					<br />
					Elusiveness:{" "}
					<RatingWithChange change={ratings[r].elu - lastSeason.elu}>
						{ratings[r].elu}
					</RatingWithChange>
					<br />
					Route Running:{" "}
					<RatingWithChange change={ratings[r].rtr - lastSeason.rtr}>
						{ratings[r].rtr}
					</RatingWithChange>
					<br />
					Hands:{" "}
					<RatingWithChange change={ratings[r].hnd - lastSeason.hnd}>
						{ratings[r].hnd}
					</RatingWithChange>
					<br />
					Ball Security:{" "}
					<RatingWithChange change={ratings[r].bsc - lastSeason.bsc}>
						{ratings[r].bsc}
					</RatingWithChange>
				</div>
			</div>
			<div className="row mt-2">
				<div className="col-4">
					<b>Blocking</b>
					<br />
					Run Blocking:{" "}
					<RatingWithChange change={ratings[r].rbk - lastSeason.rbk}>
						{ratings[r].rbk}
					</RatingWithChange>
					<br />
					Pass Blocking:{" "}
					<RatingWithChange change={ratings[r].pbk - lastSeason.pbk}>
						{ratings[r].pbk}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Defense</b>
					<br />
					Pass Coverage:{" "}
					<RatingWithChange change={ratings[r].pcv - lastSeason.pcv}>
						{ratings[r].pcv}
					</RatingWithChange>
					<br />
					Tackling:{" "}
					<RatingWithChange change={ratings[r].tck - lastSeason.tck}>
						{ratings[r].tck}
					</RatingWithChange>
					<br />
					Pass Rushing:{" "}
					<RatingWithChange change={ratings[r].prs - lastSeason.prs}>
						{ratings[r].prs}
					</RatingWithChange>
					<br />
					Run Stopping:{" "}
					<RatingWithChange change={ratings[r].rns - lastSeason.rns}>
						{ratings[r].rns}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Kicking</b>
					<br />
					Kick Power:{" "}
					<RatingWithChange change={ratings[r].kpw - lastSeason.kpw}>
						{ratings[r].kpw}
					</RatingWithChange>
					<br />
					Kick Accuracy:{" "}
					<RatingWithChange change={ratings[r].kac - lastSeason.kac}>
						{ratings[r].kac}
					</RatingWithChange>
					<br />
					Punt Power:{" "}
					<RatingWithChange change={ratings[r].ppw - lastSeason.ppw}>
						{ratings[r].ppw}
					</RatingWithChange>
					<br />
					Punt Accura:{" "}
					<RatingWithChange change={ratings[r].pac - lastSeason.pac}>
						{ratings[r].pac}
					</RatingWithChange>
				</div>
			</div>
		</>
	);
};

RatingsOverview.propTypes = {
	ratings: PropTypes.arrayOf(
		PropTypes.shape({
			ovr: PropTypes.number.isRequired,
			pot: PropTypes.number.isRequired,
			hgt: PropTypes.number.isRequired,
			stre: PropTypes.number.isRequired,
			spd: PropTypes.number.isRequired,
			endu: PropTypes.number.isRequired,
			thv: PropTypes.number.isRequired,
			thp: PropTypes.number.isRequired,
			tha: PropTypes.number.isRequired,
			bsc: PropTypes.number.isRequired,
			elu: PropTypes.number.isRequired,
			rtr: PropTypes.number.isRequired,
			hnd: PropTypes.number.isRequired,
			rbk: PropTypes.number.isRequired,
			pbk: PropTypes.number.isRequired,
			pcv: PropTypes.number.isRequired,
			tck: PropTypes.number.isRequired,
			prs: PropTypes.number.isRequired,
			rns: PropTypes.number.isRequired,
			kpw: PropTypes.number.isRequired,
			kac: PropTypes.number.isRequired,
			ppw: PropTypes.number.isRequired,
			pac: PropTypes.number.isRequired,
		}),
	).isRequired,
};

export default RatingsOverview;
