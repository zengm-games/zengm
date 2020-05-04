import React, { useReducer, ChangeEvent, FormEvent } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../../util";
import type { View } from "../../common/types";
import { PHASE } from "../../common";

const nextSeasonWarning =
	"Because the regular season is already over, changes will not be fully applied until next season.";

const ManageTeams = (props: View<"manageConfs">) => {
	useTitleBar({ title: "Manage Conferences" });

	return <p>Hi</p>;
};

export default ManageTeams;
