import PropTypes from "prop-types";

const PlusMinus = ({
	children,
	decimalPlaces = 1,
}: {
	children: number;
	decimalPlaces?: number;
}) => {
	const formattedNumber = children.toLocaleString("en-US", {
		maximumFractionDigits: decimalPlaces,
		minimumFractionDigits: decimalPlaces,
	});

	return (
		<>
			{children !== 0 ? (
				<span className={children < 0 ? "text-danger" : "text-success"}>
					{formattedNumber}
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
