const ProgressBarText = ({
	percent,
	text,
}: {
	percent: number;
	text: string;
}) => {
	return (
		<>
			<div className="progress mb-1">
				<div
					className="progress-bar progress-bar-striped progress-bar-animated"
					role="progressbar"
					aria-valuenow={percent}
					aria-valuemin={0}
					aria-valuemax={100}
					style={{
						width: `${percent}%`,
					}}
				></div>
			</div>
			{text}
		</>
	);
};

export default ProgressBarText;
