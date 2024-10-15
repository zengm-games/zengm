const PlusMinus = ({
	children,
	color = true,
	decimalPlaces = 1,
}: {
	children: number | null | undefined;
	color?: boolean;
	decimalPlaces?: number;
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
						color && children < 0
							? "text-danger"
							: color && children > 0
								? "text-success"
								: undefined
					}
				>
					{children > 0 ? "+" : null}
					{formattedNumber}
				</span>
			) : (
				(0).toFixed(decimalPlaces)
			)}
		</>
	);
};

export default PlusMinus;
