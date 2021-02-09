import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MoreLinks } from "../components";
import type { View } from "../../common/types";
import type { Col } from "../components/DataTable";
import classNames from "classnames";

const HeadToHeadAll = ({
	infoByTidByTid,
	season,
	teams,
	type,
	userTid,
}: View<"headToHeadAll">) => {
	useTitleBar({
		title: "Head-to-Head",
		dropdownView: "head2head_all",
		dropdownFields: {
			seasonsAndAll: season,
			playoffsAll: type,
		},
	});

	const cols = [
		...getCols("Team"),
		...teams.map(
			(t): Col => {
				return {
					classNames: classNames(
						"text-center",
						userTid === t.tid ? "table-info" : undefined,
					),
					desc: `${t.region} ${t.name}`,
					sortSequence: ["desc", "asc"],
					sortType: "number",
					title: t.abbrev,
				};
			},
		),
	];

	const rows = teams.map(t => {
		const infoByTid = infoByTidByTid.get(t.tid);

		return {
			key: t.tid,
			data: [
				{
					classNames: classNames(
						"align-middle text-center",
						userTid === t.tid ? "table-info" : undefined,
					),
					value: (
						<a
							href={helpers.leagueUrl([
								"head2head",
								`${t.abbrev}_${t.tid}`,
								season,
								type,
							])}
						>
							{t.abbrev}
						</a>
					),
				},
				...teams.map(t2 => {
					const info = infoByTid?.get(t2.tid);
					if (!info) {
						return null;
					}

					let record = `${info.won}-${info.lost}`;
					if (info.tied !== undefined && info.tied > 0) {
						record += `-${info.tied}`;
					}
					if (info.otl !== undefined && info.otl > 0) {
						record += `-${info.otl}`;
					}

					return {
						classNames: classNames("text-center", {
							"table-danger": info.winp <= 0.45,
							"table-success": info.winp >= 0.55,
						}),
						title: `${t.abbrev}'s record vs ${t2.abbrev}`,
						value: (
							<>
								{helpers.roundWinp(info.winp)}
								<br />
								<small className="text-muted">{record}</small>
							</>
						),
					};
				}),
			],
		};
	});

	return (
		<>
			<MoreLinks type="league" page="head2head_all" />

			<p>Each table cell shows the row team's record vs the column team.</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				hideAllControls
				name="HeadToHeadAll"
				nonfluid
				rows={rows}
			/>
		</>
	);
};

export default HeadToHeadAll;
