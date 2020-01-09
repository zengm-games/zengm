import PropTypes from "prop-types";
import React, { useCallback } from "react";
import { toWorker } from "../util";
type Props = {
	pid: number;
	watch: boolean;
}; // $FlowFixMe

const WatchBlock = React.memo(({ pid, watch }: Props) => {
	const handleClick = useCallback(
		async (e: SyntheticEvent) => {
			e.preventDefault();
			await toWorker("updatePlayerWatch", pid, !watch);
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
}); // $FlowFixMe

WatchBlock.propTypes = {
	pid: PropTypes.number.isRequired,
	watch: PropTypes.bool.isRequired,
};
export default WatchBlock;
