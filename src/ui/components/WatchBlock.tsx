import PropTypes from "prop-types";
import React, { SyntheticEvent, useCallback } from "react";
import { toWorker } from "../util";

type Props = {
	pid: number;
	watch: boolean;
};

const WatchBlock = React.memo(({ pid, watch }: Props) => {
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
				className="glyphicon glyphicon-flag watch watch-active"
				onClick={handleClick}
				title="Remove from Watch List"
			/>
		);
	}

	return (
		<span
			className="glyphicon glyphicon-flag watch"
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
