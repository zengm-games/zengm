import { ButtonGroup, Dropdown } from "react-bootstrap";
import useLocalStorageState from "use-local-storage-state";
import { ActionButton } from "../../components";

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
		{
			defaultValue: "all",
		},
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
							className="form-check-input me-1"
							type="checkbox"
							onChange={handleClickForceTrade}
							checked={forceTrade}
						/>
						Force Trade
					</label>
				</div>
			) : null}
			<div className="mb-2">
				<ActionButton
					type="submit"
					variant="secondary"
					disabled={numAssets === 0}
					processing={asking}
					onClick={handleClickAsk}
				>
					What would make this deal work?
				</ActionButton>
			</div>
			<div className="d-flex justify-content-center gap-2">
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
