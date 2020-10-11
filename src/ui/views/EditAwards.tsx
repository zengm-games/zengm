import React from "react";

import useTitleBar from "../hooks/useTitleBar";
import type { Player, View } from "../../common/types";
import Autocomplete from "react-autocomplete-select";

const EditAwards = ({
	godMode,
	playersAll,
	awards,
	season,
}: View<"editAwards">) => {
	useTitleBar({
		title: "Edit awards",
	});
	return (
		<div className="row">
			<form>
				<div>
					<label>Finals MVP</label>
					<Autocomplete
						options={playersAll}
						getOptionLabel={(option: Player) =>
							option.firstName + option.lastName
						}
						getOptionValue={(option: Player) => option.pid}
					></Autocomplete>
				</div>
			</form>
		</div>
	);
};
export default EditAwards;
