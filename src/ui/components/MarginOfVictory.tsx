import PropTypes from "prop-types";
import React from "react";

const MarginOfVictory = ({ children }: { children: number }) => {
	return (
		<>
			{children !== 0 ? (
				<span className={children < 0 ? "text-danger" : "text-success"}>
					{children > 0 ? "+" : null}
					{children.toFixed(1)}
				</span>
			) : (
				"0.0"
			)}
		</>
	);
};

MarginOfVictory.propTypes = {
	children: PropTypes.number.isRequired,
};

export default MarginOfVictory;
