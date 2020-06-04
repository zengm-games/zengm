import React from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";

const News = ({ events }: View<"news">) => {
	useTitleBar({
		title: "League News",
	});
	console.log("events", events);

	return (
		<div className="row">
			{events.map(e => (
				<div key={e.eid} className="col-lg-3 col-md-4 col-sm-6 col-12">
					<div className="card mb-3">
						<div className="p-2">
							<span className="badge badge-news badge-primary mr-1">
								{e.type}
							</span>
							<SafeHtml dirty={e.text} />
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default News;
