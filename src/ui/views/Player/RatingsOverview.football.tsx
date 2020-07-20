import PropTypes from "prop-types";
import React from "react";
import type { PlayerRatings } from "../../../common/types.football";
import RatingWithChange from "../../components/RatingWithChange";

const RatingsOverview = ({ ratings }: { ratings: PlayerRatings[] }) => {
	const r = ratings.length - 1;
	const lastSeason: PlayerRatings[] =
		ratings.length > 1
			? ratings.filter(s => s.season == ratings[r].season - 1)
			: new Array(ratings[r]);

	return (
		<>
			<div className="d-none d-lg-flex row">
				<div className="col-lg-8">
					<h2>
						Overall:&nbsp;
						<RatingWithChange
							change={ratings[r].ovr - Math.max(...lastSeason.map(a => a.ovr))}
						>
							{ratings[r].ovr}
						</RatingWithChange>
					</h2>
				</div>
				<div className="col-lg-4">
					<h2>
						Potential:&nbsp;
						<RatingWithChange
							change={ratings[r].pot - Math.max(...lastSeason.map(a => a.pot))}
						>
							{ratings[r].pot}
						</RatingWithChange>
					</h2>
				</div>
			</div>
			<div className="d-lg-none row">
				<div className="col-6">
					<h2>
						Overall:&nbsp;
						<RatingWithChange
							change={ratings[r].ovr - Math.max(...lastSeason.map(a => a.ovr))}
						>
							{ratings[r].ovr}
						</RatingWithChange>
					</h2>
				</div>
				<div className="col-6">
					<h2 className="float-right">
						Potential:&nbsp;
						<RatingWithChange
							change={ratings[r].pot - Math.max(...lastSeason.map(a => a.pot))}
						>
							{ratings[r].pot}
						</RatingWithChange>
					</h2>
				</div>
			</div>
			<div className="row">
				<div className="col-4">
					<b>Physical</b>
					<br />
					Height:&nbsp;
					<RatingWithChange
						change={ratings[r].hgt - Math.max(...lastSeason.map(a => a.hgt))}
					>
						{ratings[r].hgt}
					</RatingWithChange>
					<br />
					Strength:&nbsp;
					<RatingWithChange
						change={ratings[r].stre - Math.max(...lastSeason.map(a => a.stre))}
					>
						{ratings[r].stre}
					</RatingWithChange>
					<br />
					Speed:&nbsp;
					<RatingWithChange
						change={ratings[r].spd - Math.max(...lastSeason.map(a => a.spd))}
					>
						{ratings[r].spd}
					</RatingWithChange>
					<br />
					Endurance:&nbsp;
					<RatingWithChange
						change={ratings[r].endu - Math.max(...lastSeason.map(a => a.endu))}
					>
						{ratings[r].endu}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Passing</b>
					<br />
					Vision:&nbsp;
					<RatingWithChange
						change={ratings[r].thv - Math.max(...lastSeason.map(a => a.thv))}
					>
						{ratings[r].thv}
					</RatingWithChange>
					<br />
					Power:&nbsp;
					<RatingWithChange
						change={ratings[r].thp - Math.max(...lastSeason.map(a => a.thp))}
					>
						{ratings[r].thp}
					</RatingWithChange>
					<br />
					Accuracy:&nbsp;
					<RatingWithChange
						change={ratings[r].tha - Math.max(...lastSeason.map(a => a.tha))}
					>
						{ratings[r].tha}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Rushing/Receiving</b>
					<br />
					Elusiveness:&nbsp;
					<RatingWithChange
						change={ratings[r].elu - Math.max(...lastSeason.map(a => a.elu))}
					>
						{ratings[r].elu}
					</RatingWithChange>
					<br />
					Route Running:&nbsp;
					<RatingWithChange
						change={ratings[r].rtr - Math.max(...lastSeason.map(a => a.rtr))}
					>
						{ratings[r].rtr}
					</RatingWithChange>
					<br />
					Hands:&nbsp;
					<RatingWithChange
						change={ratings[r].hnd - Math.max(...lastSeason.map(a => a.hnd))}
					>
						{ratings[r].hnd}
					</RatingWithChange>
					<br />
					Ball Security:&nbsp;
					<RatingWithChange
						change={ratings[r].bsc - Math.max(...lastSeason.map(a => a.bsc))}
					>
						{ratings[r].bsc}
					</RatingWithChange>
				</div>
			</div>
			<div className="row mt-2">
				<div className="col-4">
					<b>Blocking</b>
					<br />
					Run Blocking:&nbsp;
					<RatingWithChange
						change={ratings[r].rbk - Math.max(...lastSeason.map(a => a.rbk))}
					>
						{ratings[r].rbk}
					</RatingWithChange>
					<br />
					Pass Blocking:&nbsp;
					<RatingWithChange
						change={ratings[r].pbk - Math.max(...lastSeason.map(a => a.pbk))}
					>
						{ratings[r].pbk}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Defense</b>
					<br />
					Pass Coverage:&nbsp;
					<RatingWithChange
						change={ratings[r].pcv - Math.max(...lastSeason.map(a => a.pcv))}
					>
						{ratings[r].pcv}
					</RatingWithChange>
					<br />
					Tackling:&nbsp;
					<RatingWithChange
						change={ratings[r].tck - Math.max(...lastSeason.map(a => a.tck))}
					>
						{ratings[r].tck}
					</RatingWithChange>
					<br />
					Pass Rushing:&nbsp;
					<RatingWithChange
						change={ratings[r].prs - Math.max(...lastSeason.map(a => a.prs))}
					>
						{ratings[r].prs}
					</RatingWithChange>
					<br />
					Run Stopping:&nbsp;
					<RatingWithChange
						change={ratings[r].rns - Math.max(...lastSeason.map(a => a.rns))}
					>
						{ratings[r].rns}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Kicking</b>
					<br />
					Kick Power:&nbsp;
					<RatingWithChange
						change={ratings[r].kpw - Math.max(...lastSeason.map(a => a.kpw))}
					>
						{ratings[r].kpw}
					</RatingWithChange>
					<br />
					Kick Accuracy:&nbsp;
					<RatingWithChange
						change={ratings[r].kac - Math.max(...lastSeason.map(a => a.kac))}
					>
						{ratings[r].kac}
					</RatingWithChange>
					<br />
					Punt Power:&nbsp;
					<RatingWithChange
						change={ratings[r].ppw - Math.max(...lastSeason.map(a => a.ppw))}
					>
						{ratings[r].ppw}
					</RatingWithChange>
					<br />
					Punt Accura:&nbsp;
					<RatingWithChange
						change={ratings[r].pac - Math.max(...lastSeason.map(a => a.pac))}
					>
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
