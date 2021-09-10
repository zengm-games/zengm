const PlayPauseNext = ({
	onPlay,
	onPause,
	onNext,
	paused,
	titlePlay = "Play",
	titlePause = "Pause",
	titleNext = "Next",
}: {
	onPlay: () => void;
	onPause: () => void;
	onNext: () => void;
	paused: boolean;
	titlePlay?: string;
	titlePause?: string;
	titleNext?: string;
}) => {
	return (
		<div className="btn-group">
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
