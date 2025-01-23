import { Dropdown } from "react-bootstrap";

export const BulkActions = ({ name }: { name: string }) => {
	return (
		<Dropdown className="float-start">
			<Dropdown.Toggle
				id={`datatable-bulk-actions-${name}`}
				size="sm"
				title="Bulk actions"
				variant="secondary"
			>
				Bulk actions
			</Dropdown.Toggle>
			<Dropdown.Menu>
				<Dropdown.Item></Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown>
	);
};
