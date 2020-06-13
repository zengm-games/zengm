import PropTypes from "prop-types";
import React from "react";
import { DataTable } from "../../components";
import { getCols } from "../../util";

const cols = getCols("Year", "Type", "Games", "Ovr Drop", "Pot Drop");
cols[1].width = "100%";

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
	if (injuries.length === 0) {
		return <p>None</p>;
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
