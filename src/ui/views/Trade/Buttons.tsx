import { ButtonGroup, Dropdown } from "react-bootstrap";

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
	teamNames,
}: {
	asking: boolean;
	enablePropose: boolean;
	forceTrade: boolean;
	godMode: boolean;
	handleClickAsk: () => void;
	handleClickClear: (
		type: "all" | "other" | "user" | "keepUntradeable",
	) => () => void;
	handleClickForceTrade: () => void;
	handleClickPropose: () => void;
	numAssets: number;
	teamNames: [string, string];
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
				<Dropdown as={ButtonGroup}>
					<button
						type="submit"
						className="btn btn-secondary"
						onClick={handleClickClear("all")}
					>
						Clear
					</button>

					<Dropdown.Toggle split variant="secondary" id="clear-trade-more" />

					<Dropdown.Menu>
						<Dropdown.Item onClick={handleClickClear("all")}>
							All (default)
						</Dropdown.Item>
						<Dropdown.Item onClick={handleClickClear("other")}>
							{teamNames[0]} only
						</Dropdown.Item>
						<Dropdown.Item onClick={handleClickClear("user")}>
							{teamNames[1]} only
						</Dropdown.Item>
						<Dropdown.Item onClick={handleClickClear("keepUntradeable")}>
							Keep untradeable
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
			</div>
		</>
	);
};

export default Buttons;
