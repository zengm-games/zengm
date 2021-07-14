import { groupBy } from "../../common/groupBy";
import PropTypes from "prop-types";
import { DataTable, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";

const formatYear = (year: {
	[key: string]: { team: string; season: number }[];
}) => {
	return Object.keys(year).map((k, i) => {
		const years = helpers.yearRanges(year[k].map(y => y.season)).join(", ");
		return (
			<span key={k}>
				{i > 0 ? ", " : null}
				{k} <small>({years})</small>
			</span>
		);
	});
};

const CheckmarkOrCross = ({ success }: { success: boolean }) => {
	if (success) {
		return <span className="glyphicon glyphicon-ok text-success" />;
	}

	return <span className="glyphicon glyphicon-remove text-danger" />;
};
CheckmarkOrCross.propTypes = {
	success: PropTypes.bool.isRequired,
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
	const cols = getCols(["Name", "Count", "Year", "Last", "Retired", "HOF"]);

	const rows = awardsRecords.map(a => {
		return {
			key: a.pid,
			data: [
				<a href={helpers.leagueUrl(["player", a.pid])}>{a.name}</a>,
				a.count,
				{
					value: formatYear(groupBy(a.years, "team")),
					sortValue: a.years
						.map(year => year.team)
						.sort()
						.join(","),
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
				name="AwardsRecords"
				rows={rows}
				pagination
			/>
		</>
	);
};

AwardsRecords.propTypes = {
	awardType: PropTypes.string.isRequired,
	awardTypeVal: PropTypes.string.isRequired,
	awardsRecords: PropTypes.arrayOf(PropTypes.object).isRequired,
	playerCount: PropTypes.number.isRequired,
};

export default AwardsRecords;
