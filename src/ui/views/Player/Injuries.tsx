import PropTypes from "prop-types";
import { DataTable } from "../../components";
import { getCols } from "../../util";

const cols = getCols(["Year", "Type", "Games", "Ovr Drop", "Pot Drop"], {
	Type: {
		width: "100%",
	},
});

const Injuries = ({
	injuries,
	showRatings,
}: {
	injuries: {
		games: number;
		season: number;
		type: string;
		ovrDrop?: number;
		potDrop?: number;
	}[];
	showRatings: boolean;
}) => {
	if (injuries === undefined || injuries.length === 0) {
		return <p>None</p>;
	}

	const totals = {
		games: 0,
		ovrDrop: undefined as number | undefined,
		potDrop: undefined as number | undefined,
	};
	for (const injury of injuries) {
		totals.games += injury.games;
		if (injury.ovrDrop !== undefined) {
			if (totals.ovrDrop === undefined) {
				totals.ovrDrop = 0;
			}
			totals.ovrDrop += injury.ovrDrop;
		}
		if (injury.potDrop !== undefined) {
			if (totals.potDrop === undefined) {
				totals.potDrop = 0;
			}
			totals.potDrop += injury.potDrop;
		}
	}

	return (
		<DataTable
			className="mb-3"
			cols={cols}
			defaultSort={[0, "asc"]}
			hideAllControls
			name="Player:Injuries"
			rows={injuries.map((injury, i) => {
				return {
					key: i,
					data: [
						{
							sortValue: i,
							value: injury.season,
						},
						injury.type,
						injury.games,
						showRatings ? injury.ovrDrop : null,
						showRatings ? injury.potDrop : null,
					],
				};
			})}
			footer={[
				"Total",
				null,
				totals.games,
				showRatings ? totals.ovrDrop : null,
				showRatings ? totals.potDrop : null,
			]}
		/>
	);
};

Injuries.propTypes = {
	injuries: PropTypes.arrayOf(
		PropTypes.shape({
			games: PropTypes.number.isRequired,
			season: PropTypes.number.isRequired,
			type: PropTypes.string.isRequired,
			ovrDrop: PropTypes.number,
			potDrop: PropTypes.number,
		}),
	).isRequired,
};

export default Injuries;
