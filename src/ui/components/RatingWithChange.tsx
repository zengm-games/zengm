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

export default RatingWithChange;
