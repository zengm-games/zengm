import { ButtonGroup, Dropdown } from "react-bootstrap";
import { useLocalStorageState } from "use-local-storage-state";

export type TradeClearType = "all" | "other" | "user" | "keepUntradeable";

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
	) => Promise<void>;
	handleClickForceTrade: () => void;
	handleClickPropose: () => void;
	numAssets: number;
	teamNames: [string, string];
}) => {
	const [defaultType, setDefaultType] = useLocalStorageState<TradeClearType>(
		"trade-clear-type",
		"all",
	);

	const onClick = (type: TradeClearType) => async () => {
		setDefaultType(type);
		await handleClickClear(type);
	};

	return (
		<>
			{godMode ? (
				<div className="mb-2">
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
					className="btn btn-secondary mb-2"
					disabled={asking || numAssets === 0}
					onClick={handleClickAsk}
				>
					{asking ? "Waiting for answer..." : "What would make this deal work?"}
				</button>
			</div>
			<div className="btn-group">
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
						onClick={onClick(defaultType)}
					>
						Clear
					</button>

					<Dropdown.Toggle split variant="secondary" id="clear-trade-more" />

					<Dropdown.Menu>
						<Dropdown.Item onClick={onClick("all")}>
							All{defaultType === "all" ? " (default)" : null}
						</Dropdown.Item>
						<Dropdown.Item onClick={onClick("other")}>
							{teamNames[0]} only{defaultType === "other" ? " (default)" : null}
						</Dropdown.Item>
						<Dropdown.Item onClick={onClick("user")}>
							{teamNames[1]} only{defaultType === "user" ? " (default)" : null}
						</Dropdown.Item>
						<Dropdown.Item onClick={onClick("keepUntradeable")}>
							Keep untradeable
							{defaultType === "keepUntradeable" ? " (default)" : null}
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
			</div>
		</>
	);
};

export default Buttons;
