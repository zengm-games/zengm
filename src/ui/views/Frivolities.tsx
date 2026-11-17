import { Fragment } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import {
	type Category,
	frivolities,
	frivolitiesMenu,
} from "../util/frivolities.ts";

const style = { maxWidth: 1000 };

const Frivolities = () => {
	useTitleBar({
		title: "Frivolities",
		customMenu: frivolitiesMenu,
	});

	const columns: Category[][] = [
		["Draft", "Player Bios", "Teams", "Trades"],
		["Player Rankings"],
	];

	return (
		<>
			<p>
				In the spirit of{" "}
				<a href="https://www.basketball-reference.com/friv/">
					Basketball Reference
				</a>
				, here is some fun stuff.
			</p>

			<p>
				<span className="text-danger">Warning:</span> most of these will be slow
				if you've played hundreds of seasons in this league.
			</p>

			<div className="row" style={style}>
				{columns.map((categories, i) => (
					<div
						key={i}
						className={`col-12 col-md-6${i > 0 ? " mt-3 mt-md-0" : ""}`}
					>
						{categories.map((category, i) => (
							<Fragment key={category}>
								<h3 className={`ms-1${i > 0 ? " mt-3" : ""}`}>{category}</h3>
								<div className="list-group">
									{frivolities[category].map((frivolity) => (
										<a
											key={frivolity.name}
											href={helpers.leagueUrl([
												"frivolities",
												...frivolity.urlParts,
											])}
											className="list-group-item list-group-item-action"
										>
											<h3 className="mb-1">{frivolity.name}</h3>
											<p className="mb-1">{frivolity.description}</p>
										</a>
									))}
								</div>
							</Fragment>
						))}
					</div>
				))}
			</div>
		</>
	);
};

export default Frivolities;
