import React from "react";

const Buttons = ({
	asking,
	enablePropose,
	forceTrade,
	godMode,
	handleClickAsk,
	handleClickClear,
	handleClickForceTrade,
	handleClickPropose,
	numAssets,
}: {
	asking: boolean;
	enablePropose: boolean;
	forceTrade: boolean;
	godMode: boolean;
	handleClickAsk: () => void;
	handleClickClear: () => void;
	handleClickForceTrade: () => void;
	handleClickPropose: () => void;
	numAssets: number;
}) => {
	return (
		<>
			{godMode ? (
				<div className="mt-2">
					<label className="god-mode god-mode-text mb-0">
						<input
							type="checkbox"
							onChange={handleClickForceTrade}
							checked={forceTrade}
						/>
						Force Trade
					</label>
				</div>
			) : null}
			<div>
				<button
					type="submit"
					className="btn btn-secondary mt-2"
					disabled={asking || numAssets === 0}
					onClick={handleClickAsk}
				>
					{asking ? "Waiting for answer..." : "What would make this deal work?"}
				</button>
			</div>
			<div className="btn-group mt-2">
				<button
					type="submit"
					className="btn btn-primary"
					disabled={!enablePropose && !forceTrade}
					onClick={handleClickPropose}
				>
					Propose Trade
				</button>
				<button
					type="submit"
					className="btn btn-secondary"
					onClick={handleClickClear}
				>
					Clear Trade
				</button>
			</div>
		</>
	);
};

export default Buttons;
