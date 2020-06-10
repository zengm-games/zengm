import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../util";
import type { View } from "../../../common/types";

const width100 = {
	width: "100%",
};

const Standings = ({
	confTeams,
	numPlayoffTeams,
	playoffsByConference,
	userTid,
}: Pick<
	View<"leagueDashboard">,
	"confTeams" | "numPlayoffTeams" | "playoffsByConference" | "userTid"
>) => (
	<>
		<table className="table table-striped table-bordered table-sm mb-1">
			<thead>
				<tr>
					<th style={width100}>Team</th>
					<th>GB</th>
				</tr>
			</thead>
			<tbody>
				{confTeams.map((t, i) => {
					return (
						<tr
							key={t.tid}
							className={classNames({
								separator: i === numPlayoffTeams - 1 && playoffsByConference,
								"table-info": t.tid === userTid,
							})}
						>
							<td>
								{t.rank}.{" "}
								<a
									href={helpers.leagueUrl([
										"roster",
										`${t.seasonAttrs.abbrev}_${t.tid}`,
									])}
								>
									{t.seasonAttrs.region}
								</a>
								{t.seasonAttrs.clinchedPlayoffs
									? ` ${t.seasonAttrs.clinchedPlayoffs}`
									: null}
							</td>
							<td className="text-right">{t.gb}</td>
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
	playoffsByConference: PropTypes.bool.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default Standings;
