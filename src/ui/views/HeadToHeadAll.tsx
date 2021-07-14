import useTitleBar from "../hooks/useTitleBar";
import { getCols, gradientStyleFactory, helpers } from "../util";
import { DataTable, MoreLinks } from "../components";
import type { View } from "../../common/types";
import type { Col } from "../components/DataTable";
import classNames from "classnames";
import { useState } from "react";

const gradientStyle = gradientStyleFactory(0.38, 0.49, 0.51, 0.62);

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

	const [showInactive, setShowInactive] = useState(true);

	const hasInactiveTeams = season === "all" && teams.some(t => t.disabled);

	const teamsFiltered =
		!hasInactiveTeams || showInactive ? teams : teams.filter(t => !t.disabled);

	const cols = [
		...getCols(["Team"]),
		...teamsFiltered.map((t): Col => {
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
		}),
	];

	const rows = teamsFiltered.map(t => {
		const infoByTid = infoByTidByTid.get(t.tid);

		return {
			classNames: "text-center",
			key: t.tid,
			data: [
				{
					classNames: classNames(
						"align-middle",
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
				...teamsFiltered.map(t2 => {
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
						style: gradientStyle(info.winp),
						title: `${t.abbrev}'s record vs ${t2.abbrev}`,
						value: (
							<>
								{helpers.roundWinp(info.winp)}
								<br />
								<small>{record}</small>
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

			{rows.length === 0 ? (
				<p>No data {season !== "all" ? "for this season yet" : "yet"}.</p>
			) : (
				<>
					<p>Each table cell shows the row team's record vs the column team.</p>

					{hasInactiveTeams ? (
						<button
							className="btn btn-secondary mb-3"
							onClick={() => {
								setShowInactive(show => !show);
							}}
						>
							{showInactive ? "Hide inactive teams" : "Show inactive teams"}
						</button>
					) : null}

					<DataTable
						cols={cols}
						defaultSort={[0, "asc"]}
						hideAllControls
						name="HeadToHeadAll"
						rows={rows}
						striped={false}
					/>
				</>
			)}
		</>
	);
};

export default HeadToHeadAll;
