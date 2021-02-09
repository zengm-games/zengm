import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MoreLinks } from "../components";
import type { View } from "../../common/types";
import type { Col } from "../components/DataTable";
import classNames from "classnames";

const gradientStyleFactory = (
	low: number,
	mid1: number,
	mid2: number,
	high: number,
) => (x: number) => {
	let backgroundColor;
	if (x < low) {
		backgroundColor = "var(--gradient-base-danger)";
	} else if (x < mid1) {
		const fraction = (mid1 - x) / (mid1 - low);
		backgroundColor = `rgba(var(--gradient-base-danger), ${fraction})`;
	} else if (x > mid2) {
		const fraction = (x - mid2) / (high - mid2);
		backgroundColor = `rgba(var(--gradient-base-success), ${fraction})`;
	} else if (x > high) {
		backgroundColor = "var(--gradient-base-success)";
	}

	if (!backgroundColor) {
		return;
	}

	return {
		backgroundColor,
	};
};

const gradientStyle = gradientStyleFactory(0.35, 0.49, 0.51, 0.65);

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

			<p>Each table cell shows the row team's record vs the column team.</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				hideAllControls
				name="HeadToHeadAll"
				nonfluid
				rows={rows}
				striped={false}
			/>
		</>
	);
};

export default HeadToHeadAll;
