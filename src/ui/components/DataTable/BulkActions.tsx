import { Dropdown } from "react-bootstrap";
import { Flag } from "../WatchBlock";
import { useLocalPartial } from "../../util";

export const BulkActions = ({
	hasSomeSelected,
	name,
}: {
	hasSomeSelected: boolean;
	name: string;
}) => {
	const { numWatchColors } = useLocalPartial(["numWatchColors"]);

	return (
		<Dropdown className="float-start">
			<Dropdown.Toggle
				id={`datatable-bulk-actions-${name}`}
				size="sm"
				title="Bulk actions"
				variant={hasSomeSelected ? "primary" : "secondary"}
			>
				Bulk actions
			</Dropdown.Toggle>
			<Dropdown.Menu>
				<Dropdown.Item>Compare players</Dropdown.Item>
				<Dropdown.Item>Export players</Dropdown.Item>
				<Dropdown.Item>
					{numWatchColors > 1 ? "Cycle" : "Toggle"} watch list{" "}
					<Flag watch={1} />
				</Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown>
	);
};
