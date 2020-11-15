import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";

const TradeSummary = (props: View<"tradeSummary">) => {
	useTitleBar({
		title: "Trade Summary",
	});

	if (props) {
		return <p>Trade not found.</p>;
	}

	return (
		<>
			<h2>Trade during the 2020 draft</h2>
			<h3>Team 1 recieved:</h3>
			<h3>Team 2 recieved:</h3>
		</>
	);
};

export default TradeSummary;
