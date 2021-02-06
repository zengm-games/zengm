import classNames from "classnames";
import PropTypes from "prop-types";
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

StatWithChange.propTypes = {
	change: PropTypes.number.isRequired,
	children: PropTypes.number.isRequired,
	stat: PropTypes.string.isRequired,
};

export default StatWithChange;
