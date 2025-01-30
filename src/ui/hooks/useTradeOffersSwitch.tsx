import { useMemo } from "react";
import useLocalStorageState from "use-local-storage-state";

const DEFAULT_LIST = window.screen.width < 992;

const useTradeOffersSwitch = () => {
	const [value, setValue] = useLocalStorageState<"table" | "list">(
		"tradeOffersOverride",
		{
			defaultValue: DEFAULT_LIST ? "list" : "table",
		},
	);

	const toggle = useMemo(
		() => (
			<form className="mb-2 d-flex justify-content-end">
				<select
					className="form-select"
					style={{ width: 100 }}
					value={value}
					onChange={(event) => {
						setValue(event.target.value as any);
					}}
				>
					<option value="list">List</option>
					<option value="table">Table</option>
				</select>
			</form>
		),
		[setValue, value],
	);

	return {
		toggle,
		value,
	};
};

export default useTradeOffersSwitch;
