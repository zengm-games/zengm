import classNames from "classnames";
import PropTypes from "prop-types";
import { memo, SyntheticEvent, useCallback } from "react";
import { toWorker } from "../util";

type Props = {
	className?: string;
	pid: number;
	watch: boolean;
};

const WatchBlock = memo(({ className, pid, watch }: Props) => {
	const handleClick = useCallback(
		async (e: SyntheticEvent) => {
			e.preventDefault();
			await toWorker("main", "updatePlayerWatch", pid, !watch);
		},
		[pid, watch],
	);

	if (watch) {
		return (
			<span
				className={classNames(
					"glyphicon glyphicon-flag watch watch-active",
					className,
				)}
				onClick={handleClick}
				title="Remove from Watch List"
			/>
		);
	}

	return (
		<span
			className={classNames("glyphicon glyphicon-flag watch", className)}
			onClick={handleClick}
			title="Add to Watch List"
		/>
	);
});

// @ts-ignore
WatchBlock.propTypes = {
	pid: PropTypes.number.isRequired,
	watch: PropTypes.bool.isRequired,
};

export default WatchBlock;
