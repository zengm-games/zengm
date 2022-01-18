const PlusMinus = ({
	children,
	decimalPlaces = 1,
	includePlus,
}: {
	children: number | null | undefined;
	decimalPlaces?: number;
	includePlus?: boolean;
}) => {
	if (children == undefined) {
		return null;
	}

	const formattedNumber = children.toLocaleString("en-US", {
		maximumFractionDigits: decimalPlaces,
		minimumFractionDigits: decimalPlaces,
	});

	return (
		<>
			{children !== 0 ? (
				<span
					className={
						children < 0
							? "text-danger"
							: children > 0
							? "text-success"
							: undefined
					}
				>
					{includePlus && children > 0 ? "+" : null}
					{formattedNumber}
				</span>
			) : (
				(0).toFixed(decimalPlaces)
			)}
		</>
	);
};

export default PlusMinus;
