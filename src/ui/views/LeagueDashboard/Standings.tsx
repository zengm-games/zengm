import classNames from "classnames";
import PropTypes from "prop-types";
import { helpers } from "../../util";
import { ColPtsOrGB, TeamColumn } from "../Standings";
import type { View } from "../../../common/types";

const width100 = {
	width: "100%",
};

const Standings = ({
	confTeams,
	numPlayoffTeams,
	playoffsByConf,
	pointsFormula,
	usePts,
	userTid,
}: Pick<
	View<"leagueDashboard">,
	| "confTeams"
	| "numPlayoffTeams"
	| "playoffsByConf"
	| "pointsFormula"
	| "usePts"
	| "userTid"
>) => (
	<>
		<table className="table table-striped table-bordered table-sm mb-1">
			<thead>
				<tr>
					<th style={width100}>Team</th>
					<ColPtsOrGB
						alignRight
						pointsFormula={pointsFormula}
						usePts={usePts}
					/>
				</tr>
			</thead>
			<tbody>
				{confTeams.map((t, i) => {
					return (
						<tr
							key={t.tid}
							className={classNames({
								separator: i === numPlayoffTeams - 1 && playoffsByConf,
								"table-info": t.tid === userTid,
							})}
						>
							<TeamColumn rank={t.rank} rankWidth={15} t={t} />
							<td className="text-right">
								{usePts ? Math.round(t.seasonAttrs.pts) : t.gb}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
		<a href={helpers.leagueUrl(["standings"])}>» League Standings</a>
	</>
);

Standings.propTypes = {
	confTeams: PropTypes.arrayOf(PropTypes.object).isRequired,
	numPlayoffTeams: PropTypes.number.isRequired,
	playoffsByConf: PropTypes.bool.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default Standings;
