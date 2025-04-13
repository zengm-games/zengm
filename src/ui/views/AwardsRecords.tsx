import { groupBy } from "../../common/utils.ts";
import { DataTable, MoreLinks } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";

const formatYear = (year: {
	[key: string]: { team: string; season: number }[];
}) => {
	return Object.keys(year).map((k, i) => {
		const years = helpers.yearRanges(year[k].map((y) => y.season)).join(", ");
		return (
			<span key={k}>
				{i > 0 ? ", " : null}
				{k} <small>({years})</small>
			</span>
		);
	});
};

const formatYearString = (year: {
	[key: string]: { team: string; season: number }[];
}) => {
	return Object.keys(year)
		.map((k, i) => {
			const years = helpers.yearRanges(year[k].map((y) => y.season)).join(", ");
			return `${i > 0 ? ", " : ""}${k} (${years})`;
		})
		.join("");
};

const CheckmarkOrCross = ({ success }: { success: boolean }) => {
	if (success) {
		return <span className="glyphicon glyphicon-ok text-success" />;
	}

	return <span className="glyphicon glyphicon-remove text-danger" />;
};

const AwardsRecords = ({
	awardType,
	awardTypeVal,
	awardsRecords,
	playerCount,
}: View<"awardsRecords">) => {
	useTitleBar({
		title: "Awards Records",
		dropdownView: "awards_records",
		dropdownFields: {
			awardType,
		},
	});
	const cols = getCols(["Name", "Count", "Year", "Last", "Retired", "HOF"], {
		Year: {
			searchType: "string",
		},
	});

	const rows: DataTableRow[] = awardsRecords.map((a) => {
		const yearsGrouped = groupBy(a.years, "team");

		return {
			key: a.pid,
			metadata: {
				type: "player",
				pid: a.pid,
				season: a.lastYear,
				playoffs: "regularSeason",
			},
			data: [
				wrappedPlayerNameLabels({
					pid: a.pid,
					firstName: a.firstName,
					firstNameShort: a.firstNameShort,
					lastName: a.lastName,
				}),
				a.count,
				{
					value: formatYear(yearsGrouped),
					searchValue: formatYearString(yearsGrouped),
					sortValue: a.years.map((year) => year.season).sort()[0],
				},
				a.lastYear,
				{
					value: <CheckmarkOrCross success={a.retired} />,
					sortValue: a.retired ? 1 : 0,
				},
				{
					value: <CheckmarkOrCross success={a.hof} />,
					sortValue: a.hof ? 1 : 0,
				},
			],
		};
	});

	return (
		<>
			<MoreLinks type="league" page="awards_records" />

			<h4 className="mb-3">
				{playerCount} players - {awardTypeVal}
			</h4>

			<DataTable
				cols={cols}
				defaultSort={[1, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				name="AwardsRecords"
				rows={rows}
				pagination
			/>
		</>
	);
};

export default AwardsRecords;
