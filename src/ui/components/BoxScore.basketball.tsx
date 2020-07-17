import PropTypes from "prop-types";
import React from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import SafeHtml from "../components/SafeHtml";
import { helpers } from "../util";

const BoxScore = ({
	boxScore,
	Row,
	forceRowUpdate,
}: {
	boxScore: any;
	Row: any;
	forceRowUpdate: boolean;
}) => {
	return (
		<>
			{boxScore.teams.map((t: any) => (
				<div key={t.abbrev} className="mb-3">
					<h2>
						{t.tid >= 0 ? (
							<a
								href={helpers.leagueUrl([
									"roster",
									`${t.abbrev}_${t.tid}`,
									boxScore.season,
								])}
							>
								{t.region} {t.name}
							</a>
						) : (
							<>
								{t.region} {t.name}
							</>
						)}
					</h2>
					<ResponsiveTableWrapper>
						<table className="table table-striped table-bordered table-sm table-hover">
							<thead>
								<tr>
									<th>Name</th>
									{typeof t.players[0].abbrev === "string" ? (
										<th>Team</th>
									) : null}
									<th>Pos</th>
									<th>MP</th>
									<th>FG</th>
									<th>3Pt</th>
									<th>FT</th>
									<th>ORB</th>
									<th>TRB</th>
									<th>AST</th>
									<th>TO</th>
									<th>STL</th>
									<th>BLK</th>
									<th>BA</th>
									<th>PF</th>
									<th>PTS</th>
									<th>+/-</th>
									<th title="Game Score">GmSc</th>
								</tr>
							</thead>
							<tbody>
								{t.players.map((p: any, i: number) => {
									return (
										<Row key={p.pid} i={i} p={p} forceUpdate={forceRowUpdate} />
									);
								})}
							</tbody>
							<tfoot>
								<tr>
									<th>Total</th>
									<th />
									{typeof t.players[0].abbrev === "string" ? <th /> : null}
									<th>{Number.isInteger(t.min) ? t.min : t.min.toFixed(1)}</th>
									<th>
										{t.fg}-{t.fga}
									</th>
									<th>
										{t.tp}-{t.tpa}
									</th>
									<th>
										{t.ft}-{t.fta}
									</th>
									<th>{t.orb}</th>
									<th>{t.drb + t.orb}</th>
									<th>{t.ast}</th>
									<th>{t.tov}</th>
									<th>{t.stl}</th>
									<th>{t.blk}</th>
									<th>{t.ba}</th>
									<th>{t.pf}</th>
									<th>{t.pts}</th>
									<th />
									<th />
								</tr>
								<tr>
									<th>Percentages</th>
									<th />
									{typeof t.players[0].abbrev === "string" ? <th /> : null}
									<th />
									<th>{helpers.roundStat((100 * t.fg) / t.fga, "fgp")}%</th>
									<th>{helpers.roundStat((100 * t.tp) / t.tpa, "tpp")}%</th>
									<th>{helpers.roundStat((100 * t.ft) / t.fta, "ftp")}%</th>
									<th />
									<th />
									<th />
									<th />
									<th />
									<th />
									<th />
									<th />
									<th />
									<th />
									<th />
								</tr>
							</tfoot>
						</table>
					</ResponsiveTableWrapper>
				</div>
			))}
			{boxScore.gameOver !== false &&
			boxScore.clutchPlays &&
			boxScore.clutchPlays.length > 0
				? boxScore.clutchPlays.map((text: string, i: number) => (
						<p key={i}>
							<SafeHtml dirty={text} />
						</p>
				  ))
				: null}
		</>
	);
};

BoxScore.propTypes = {
	boxScore: PropTypes.object.isRequired,
	Row: PropTypes.any,
	forceRowUpdate: PropTypes.bool.isRequired,
};

export default BoxScore;
