import type { SyntheticEvent } from "react";

const PerPage = ({
	onChange,
	value,
}: {
	onChange: (a: SyntheticEvent<HTMLSelectElement>) => void;
	value: number;
}) => {
	return (
		<div className="datatable-perpage">
			<label className="form-label">
				<select
					className="form-select form-select-sm"
					onChange={onChange}
					value={value}
				>
					<option value="10">10</option>
					<option value="25">25</option>
					<option value="50">50</option>
					<option value="100">100</option>
				</select>{" "}
				per page
			</label>
		</div>
	);
};

export default PerPage;
