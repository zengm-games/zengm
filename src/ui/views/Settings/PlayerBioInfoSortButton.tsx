import { Dropdown } from "react-bootstrap";
import { helpers, safeLocalStorage } from "../../util";
import type { PLAYER_BIO_INFO_SORT_DEFAULT } from "./PlayerBioInfo";

type PlayerBioInfoSortDefault = typeof PLAYER_BIO_INFO_SORT_DEFAULT;

const SortButton = <Type extends "names" | "colleges" | "countries">({
	onClick,
	type,
}: {
	onClick: (
		field: PlayerBioInfoSortDefault[Type][0],
		direction: PlayerBioInfoSortDefault[Type][1],
	) => void;
	type: Type;
}) => {
	const nameKey = type === "countries" ? "country" : "name";

	const handleClick = (
		field: PlayerBioInfoSortDefault[Type][0],
		direction: PlayerBioInfoSortDefault[Type][1],
	) => {
		let prev;
		try {
			const temp = safeLocalStorage.getItem("playerBioInfoSort");
			if (temp) {
				prev = JSON.parse(temp);
			}
		} catch (error) {}

		if (!prev) {
			prev = {};
		}

		prev[type] = [field, direction];
		safeLocalStorage.setItem("playerBioInfoSort", JSON.stringify(prev));

		onClick(field, direction);
	};

	return (
		<Dropdown>
			<Dropdown.Toggle
				className="btn-light-bordered btn-light-bordered-group-right"
				variant="foo"
				id={`dropdown-sort-${type}`}
			>
				Sort
			</Dropdown.Toggle>

			<Dropdown.Menu>
				<Dropdown.Item
					onClick={() => {
						handleClick(nameKey, "asc");
					}}
				>
					{helpers.upperCaseFirstLetter(nameKey)} (asc)
				</Dropdown.Item>
				<Dropdown.Item
					onClick={() => {
						handleClick(nameKey, "desc");
					}}
				>
					{helpers.upperCaseFirstLetter(nameKey)} (desc)
				</Dropdown.Item>
				<Dropdown.Item
					onClick={() => {
						handleClick("frequency", "asc");
					}}
				>
					Frequency (asc)
				</Dropdown.Item>
				<Dropdown.Item
					onClick={() => {
						handleClick("frequency", "desc");
					}}
				>
					Frequency (desc)
				</Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown>
	);
};

export default SortButton;
