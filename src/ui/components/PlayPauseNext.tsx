import classNames from "classnames";

const PlayPauseNext = ({
	className,
	onPlay,
	onPause,
	onNext,
	paused,
	titlePlay = "Play",
	titlePause = "Pause",
	titleNext = "Next",
}: {
	className?: string;
	onPlay: () => void;
	onPause: () => void;
	onNext: () => void;
	paused: boolean;
	titlePlay?: string;
	titlePause?: string;
	titleNext?: string;
}) => {
	return (
		<div className={classNames("btn-group", className)}>
			{paused ? (
				<button
					className="btn btn-light-bordered"
					onClick={onPlay}
					title={titlePlay}
				>
					<span className="glyphicon glyphicon-play" />
				</button>
			) : (
				<button
					className="btn btn-light-bordered"
					onClick={onPause}
					title={titlePause}
				>
					<span className="glyphicon glyphicon-pause" />
				</button>
			)}
			<button
				className="btn btn-light-bordered"
				disabled={!paused}
				onClick={onNext}
				title={titleNext}
			>
				<span className="glyphicon glyphicon-step-forward" />
			</button>
		</div>
	);
};

export default PlayPauseNext;
