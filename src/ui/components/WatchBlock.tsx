import classNames from "classnames";
import { memo, SyntheticEvent } from "react";
import { toWorker } from "../util";

type Props = {
	className?: string;
	pid: number;
	watch: boolean;

	// Not needed if you pass watch down all the way from a worker view, only needed if you're handling it in the UI only
	onChange?: (watch: boolean) => void;
};

const WatchBlock = memo(({ className, onChange, pid, watch }: Props) => {
	const handleClick = async (event: SyntheticEvent) => {
		event.preventDefault();
		const newWatch = !watch;
		onChange?.(newWatch);
		await toWorker("main", "updatePlayerWatch", { pid, watch: newWatch });
	};

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

export default WatchBlock;
