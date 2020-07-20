import PropTypes from "prop-types";
import React from "react";
import type { PlayerRatings } from "../../../common/types.basketball";
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
					Jumping:&nbsp;
					<RatingWithChange
						change={ratings[r].jmp - Math.max(...lastSeason.map(a => a.jmp))}
					>
						{ratings[r].jmp}
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
					<b>Shooting</b>
					<br />
					Inside Scoring:&nbsp;
					<RatingWithChange
						change={ratings[r].ins - Math.max(...lastSeason.map(a => a.ins))}
					>
						{ratings[r].ins}
					</RatingWithChange>
					<br />
					Dunks/Layups:&nbsp;
					<RatingWithChange
						change={ratings[r].dnk - Math.max(...lastSeason.map(a => a.dnk))}
					>
						{ratings[r].dnk}
					</RatingWithChange>
					<br />
					Free Throws:&nbsp;
					<RatingWithChange
						change={ratings[r].ft - Math.max(...lastSeason.map(a => a.ft))}
					>
						{ratings[r].ft}
					</RatingWithChange>
					<br />
					Two Pointers:&nbsp;
					<RatingWithChange
						change={ratings[r].fg - Math.max(...lastSeason.map(a => a.fg))}
					>
						{ratings[r].fg}
					</RatingWithChange>
					<br />
					Three Pointers:&nbsp;
					<RatingWithChange
						change={ratings[r].tp - Math.max(...lastSeason.map(a => a.tp))}
					>
						{ratings[r].tp}
					</RatingWithChange>
				</div>
				<div className="col-4">
					<b>Skill</b>
					<br />
					Offensive IQ:&nbsp;
					<RatingWithChange
						change={ratings[r].oiq - Math.max(...lastSeason.map(a => a.oiq))}
					>
						{ratings[r].oiq}
					</RatingWithChange>
					<br />
					Defensive IQ:&nbsp;
					<RatingWithChange
						change={ratings[r].diq - Math.max(...lastSeason.map(a => a.diq))}
					>
						{ratings[r].diq}
					</RatingWithChange>
					<br />
					Dribbling:&nbsp;
					<RatingWithChange
						change={ratings[r].drb - Math.max(...lastSeason.map(a => a.drb))}
					>
						{ratings[r].drb}
					</RatingWithChange>
					<br />
					Passing:&nbsp;
					<RatingWithChange
						change={ratings[r].pss - Math.max(...lastSeason.map(a => a.pss))}
					>
						{ratings[r].pss}
					</RatingWithChange>
					<br />
					Rebounding:&nbsp;
					<RatingWithChange
						change={ratings[r].reb - Math.max(...lastSeason.map(a => a.reb))}
					>
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
