import clsx from "clsx";

const RatingWithChange = ({
	change,
	children,
}: {
	change: number;
	children: number;
}) => {
	return (
		<>
			{children}
			{change !== 0 ? (
				<span
					className={clsx({
						"text-success": change > 0,
						"text-danger": change < 0,
					})}
				>
					{" "}
					({change > 0 ? "+" : null}
					{change})
				</span>
			) : null}
		</>
	);
};

export const wrappedRatingWithChange = (rating: number, change: number) => {
	const formatted = `${rating} ${change !== 0 ? `(${change > 0 ? "+" : ""}{change})` : ""}`;

	return {
		value: <RatingWithChange change={change}>{rating}</RatingWithChange>,
		sortValue: rating + (change + 500) / 1000,
		searchValue: formatted,
	};
};

export default RatingWithChange;
