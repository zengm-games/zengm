import { useState } from "react";
import { bySport } from "../../../common/sportFunctions.ts";
import { helpers } from "../../util/helpers.ts";

export const Documentation = () => {
	const [show, setShow] = useState(false);

	return (
		<>
			<button
				className="btn btn-secondary mb-3"
				onClick={() => {
					setShow((show) => !show);
				}}
			>
				{show ? "Hide" : "Show"} documentation
			</button>
			{show ? (
				<>
					<p>
						I'm sorry custom awards are so complicated, but they need to be to
						support all the features I wanted!
					</p>
					<h2>Formulas</h2>
					<p>
						The main idea is that you write some formula based on stats and that
						is used to rank players. The formula can be really simple, like if
						you write{" "}
						<code>
							{bySport({
								baseball: "war",
								basketball: "ws",
								football: "av",
								hockey: "ps",
							})}
						</code>{" "}
						then the award winner will simply be who has the most{" "}
						{bySport({
							baseball: "WAR",
							basketball: "WS",
							football: "AV",
							hockey: "PS",
						})}
						. Or it can be really complicated, like the default DPOY formula in
						Football GM is{" "}
						<code>
							4*defSk + 0.4*defTckLoss + 0.2*defTckAst + 0.4*defTckSolo +
							3*defFmbFrc + 3*defFmbRec + 6*defInt + 2*defPssDef
						</code>
						.
					</p>
					<p>
						You can do all the normal arithmetic operations (+ - * /) and you
						can even use exponents (^) if you want.
					</p>
					<p>
						In addition there are <code>min</code> and <code>max</code>{" "}
						functions you can use to compare two numbers, like{" "}
						<code>max(hr,sb)</code> is the largest of the player's HR and SB
						stats.
					</p>
					<p>
						In BBGM, most stats are per-game stats (like <code>pts</code> means
						"points per game") because those are most commonly used. For the
						same reason, they are totals in the other games (like{" "}
						<code>pssTD</code> is the total number of passing TDs this season).
						But you can convert back and forth by either multiplying or dividing
						by <code>gp</code>.
					</p>
					<h2>Available stats</h2>
					<p>teamGp: number;</p>
					<p>winp: number;</p>
					<p>
						<code>seasonFraction</code>: From 0 to 1, the fraction of the
						season's games that the player's team has completed so far. This
						really only matters for the Award Races page, since it's always 1 at
						the end of the season. But during the season you might use this to
						make the Award Races look better. For instance in BBGM, the MVP
						formula is something like <code>ewa + seasonFraction * winp</code>.
						EWA is a cumulative stat that will continue increasing throughout
						the season. But <code>winp</code> is the team's winning percentage,
						which generally stays about the same throughout the year. Okay, I
						mean it goes up and down, but it doesn't continually increase over
						82 games like a cumulative stat. So to combine those two numbers,
						you want <code>winp</code> to gradually become more important as the
						season progresses.
					</p>
					<h2>Achievements</h2>
					<p>
						You can edit award settings outside of God Mode because they don't
						make the game any easier or harder. However, there are some{" "}
						<a href={helpers.leagueUrl(["achievements"])}>achievements</a> based
						on awards. Those are affected by your award settings.
					</p>
					<p>
						All of the award-based achievements mention specific awards (MVP,
						ROY, etc.) in their descriptions. If you do not edit any of the
						awards used by an achievement, then you can still get that
						achievement even if you edit other awards. You can also edit
						superficial parts of the award, like the name. But once you start
						editing things that change the results of the award (such as the
						formula) then that award will no longer be used by achievements.
					</p>
					<p>
						The one exception is if you edit the "group" of the award to make it
						more difficult to win. Currently this is only possible in ZenGM
						Baseball, which has conference-based awards by default. So for
						instance, if you switch the MVP from conference to leaguewide, that
						actually makes MVP harder to win. So that will still count towards
						ZenGM Baseball achievements.
					</p>
					<p>
						I mentioned above that you can change superficial parts of the award
						like the name and still be eligible for achievements. This is true
						even for the abbrev, like if you edit the MVP award so the abbrev is
						now "ABC" or whatever, that will still count as an MVP award for
						achievements as long as all the meaningful parts of the award are
						unedited.
					</p>
					<h2>Anything else?</h2>
					<p>
						Everything else is hopefully either self-explanatory or explained in
						the ? icons by some form fields. If not,{" "}
						<a href="https://zengm.com/contact/">please let me know</a>!
					</p>
				</>
			) : null}
		</>
	);
};
