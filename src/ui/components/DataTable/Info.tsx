import PropTypes from "prop-types";

const Info = ({
	end,
	numRows,
	numRowsUnfiltered,
	start,
}: {
	end: number;
	numRows: number;
	numRowsUnfiltered: number;
	start: number;
}) => {
	const filteredText =
		numRows !== numRowsUnfiltered
			? ` (filtered from ${numRowsUnfiltered})`
			: null;
	return (
		<div className="datatable-info d-none d-sm-block">
			{numRows === 0 ? 0 : start} to {end} of {numRows}
			{filteredText}
		</div>
	);
};

Info.propTypes = {
	end: PropTypes.number.isRequired,
	numRows: PropTypes.number.isRequired,
	numRowsUnfiltered: PropTypes.number.isRequired,
	start: PropTypes.number.isRequired,
};

export default Info;
