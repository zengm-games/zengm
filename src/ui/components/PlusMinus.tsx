import PropTypes from "prop-types";

const PlusMinus = ({
	children,
	decimalPlaces = 1,
}: {
	children: number;
	decimalPlaces?: number;
}) => {
	return (
		<>
			{children !== 0 ? (
				<span className={children < 0 ? "text-danger" : "text-success"}>
					{children > 0 ? "+" : null}
					{children.toFixed(decimalPlaces)}
				</span>
			) : (
				(0).toFixed(decimalPlaces)
			)}
		</>
	);
};

PlusMinus.propTypes = {
	children: PropTypes.number.isRequired,
};

export default PlusMinus;
