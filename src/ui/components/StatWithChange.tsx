import classNames from "classnames";
import { helpers } from "../util";

const StatWithChange = ({
	change,
	children,
	stat,
}: {
	change: number;
	children: number;
	stat: string;
}) => {
	return (
		<>
			{helpers.roundStat(children, stat)}
			{change !== 0 ? (
				<span
					className={classNames({
						"text-success": change > 0,
						"text-danger": change < 0,
					})}
				>
					{" "}
					({change > 0 ? "+" : null}
					{helpers.roundStat(change, stat)})
				</span>
			) : null}
		</>
	);
};

export default StatWithChange;
