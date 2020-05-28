import PropTypes from "prop-types";
import React from "react";
import { DataTable } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols } from "../util";
import type { Col } from "../components/DataTable";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";

const RosterContinuity = ({
	abbrevs,
	season,
	seasons,
	userTid,
}: View<"rosterContinuity">) => {
	useTitleBar({
		title: "Roster Continuity",
		customMenu: frivolitiesMenu,
	});
	const cols = [
		...getCols("Season"),
		...abbrevs.map(
			(abbrev, i): Col => {
				return {
					classNames: userTid === i ? "table-info" : undefined,
					sortSequence: ["desc", "asc"],
					sortType: "number",
					title: abbrev,
				};
			},
		),
	];
	const rows = seasons.map((seasonRow, i) => {
		return {
			key: season - i,
			data: [
				season - i,
				...seasonRow.map(pct => {
					if (pct === undefined) {
						return null;
					}

					return {
						classNames:
							process.env.SPORT === "basketball"
								? {
										"table-danger": pct < 0.7,
										"table-warning": pct >= 0.7 && pct < 0.85,
										"table-success": pct >= 0.85,
								  }
								: {
										"table-danger": pct < 0.725,
										"table-warning": pct >= 0.725 && pct < 0.825,
										"table-success": pct >= 0.825,
								  },
						value: pct.toFixed(2),
					};
				}),
			],
		};
	});
	return (
		<>
			<p>
				Each cell in the table shows the percentage of minutes played that
				season by players who were on the same team the previous season.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				name="RosterContinuity"
				pagination={rows.length > 100}
				rows={rows}
			/>
		</>
	);
};

RosterContinuity.propTypes = {
	abbrevs: PropTypes.arrayOf(PropTypes.string).isRequired,
	season: PropTypes.number.isRequired,
	seasons: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default RosterContinuity;
