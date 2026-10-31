import { useState } from "react";
import { bySport } from "../../../common/sportFunctions.ts";
import { helpers } from "../../util/helpers.ts";
import { toWorker } from "../../util/toWorker.ts";
import type { getVariables } from "../../../worker/api/awardSettings.ts";
import { getCol } from "../../../common/getCol.ts";

const myGetCol = (stat: string) => {
	if (stat === "seasonFraction") {
		return "Fraction of team's season completed";
	}
	if (stat === "teamGp") {
		return "Team games played";
	}
	if (stat === "winp") {
		return "Team winning percentage";
	}
	if (stat === "teamWs") {
		return "Team total WS";
	}
	if (stat === "won") {
		return "1 for winning team, 0 for losing team";
	}
	if (stat === "numWon") {
		return (
			<>
				Number of past seasons player won a type of award, like{" "}
				<code className="text-black">numWon.MVP</code>
			</>
		);
	}
	if (stat === "numWonConsecutive") {
		return (
			<>
				Number of consecutive past seasons player won a type of award, like{" "}
				<code className="text-black">numWonConsecutive.MVP</code>
			</>
		);
	}

	try {
		if (stat.endsWith("Max")) {
			return `${getCol(`stat:${stat.replace("Max", "")}`)?.title ?? "???"} game high`;
		}

		const col = getCol(`stat:${stat}`);
		return `${col.title}${col.desc !== undefined ? `, ${col.desc}` : ""}`;
	} catch {
		return "???";
	}
};

export const FunctionDocs = () => {
	return (
		<>
			<p>
				There are <code>min</code> and <code>max</code> functions you can use to
				compare two numbers, like <code>max(hr,sb)</code> is the largest of the
				player's HR and SB stats. And there is an absolute value function, like{" "}
				<code>abs(-4)</code> evaluates to <code>4</code>.
			</p>
			<p>
				These functions can be used to do some clever things. Like{" "}
				<code>-abs(per-15)</code> gives the players whose PER is closest to 15,
				which is like a ranking of the most average players. You can use{" "}
				<code>min</code> to implement a gradual games played cutoff, like{" "}
				<code>per * min(1, gp / 60)</code> equals PER for someone who played 60+
				games, and gradually decreases below that. If you want the cutoff to be
				shaper, add an exponent! <code>per * min(1, gp / 60)^1000</code> will be
				basically 0 for anyone under 60 games played.
			</p>
		</>
	);
};

export const TEXT_MAX_WIDTH = { maxWidth: 648 };

export const Documentation = () => {
	const [state, setState] = useState<
		| {
				show: false;
				variables?: ReturnType<typeof getVariables>;
		  }
		| {
				show: true;
				variables: ReturnType<typeof getVariables>;
		  }
	>({
		show: false,
	});

	const ulStyle = {
		columnWidth: 350,
	};

	return (
		<>
			<button
				className="btn btn-secondary mb-3"
				onClick={async () => {
					if (state.show) {
						setState({
							show: false,
							variables: state.variables,
						});
					} else if (state.variables) {
						setState({
							show: true,
							variables: state.variables,
						});
					} else {
						const variables = await toWorker(
							"awardSettings",
							"getVariables",
							undefined,
						);
						setState({
							show: true,
							variables,
						});
					}
				}}
			>
				{state.show ? "Hide" : "Show"} documentation
			</button>
			{state.show ? (
				<>
					<div style={TEXT_MAX_WIDTH}>
						<p>
							I'm sorry custom awards are so complicated, but they need to be to
							support all these features!
						</p>
						<h2>Formulas</h2>
						<p>
							The main idea is that you write some formula based on stats and
							that is used to rank players. The formula can be really simple,
							like if you write{" "}
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
								basketball: "win shares",
								football: "AV",
								hockey: "point shares",
							})}
							. Or it can be really complicated, like the default DPOY formula
							in Football GM is{" "}
							<code>
								4*defSk + 0.4*defTckLoss + 0.2*defTckAst + 0.4*defTckSolo +
								3*defFmbFrc + 3*defFmbRec + 6*defInt + 2*defPssDef
							</code>{" "}
							and that's not even the biggest one!
						</p>
						<p>
							You can do all the normal arithmetic operations{" "}
							<code>+ - * /</code> and you can even use exponents <code>^</code>{" "}
							if you want.
						</p>
						<FunctionDocs />
						<p>
							In BBGM, most stats are per-game stats (like <code>pts</code>{" "}
							means "points per game") because those are most commonly used. For
							the same reason, they are totals in the other games (like{" "}
							<code>pssTD</code> is the total number of passing TDs this
							season). But you can convert back and forth by either multiplying
							or dividing by <code>gp</code>.
						</p>
						<p>
							Awards can be for the entire regular season, the entire playoffs,
							the regular season and playoffs combined, or a specific playoff
							series (like Finals MVP or Semifinals MVP). Due to some internal
							details of how these stats are stored, there are some stats which
							are only available for playoff series awards and other stats which
							are only available for other awards. And of course many available
							in both. The next section lists them all.
						</p>
					</div>
					<h2>Available stat variables</h2>
					<h3>All awards</h3>
					<ul className="list-unstyled" style={ulStyle}>
						{state.variables.common.map((stat) => (
							<li key={stat}>
								<code>{stat}</code>: {myGetCol(stat)}
							</li>
						))}
					</ul>
					<h3>Only in regular season, playoffs, or combined awards</h3>
					<ul className="list-unstyled" style={ulStyle}>
						{state.variables.normalOnly.map((stat) => (
							<li key={stat}>
								<code>{stat}</code>: {myGetCol(stat)}
							</li>
						))}
					</ul>
					<div style={TEXT_MAX_WIDTH}>
						<p>
							<code>seasonFraction</code> deserves a little explanation. It's a
							value between 0 to 1 representing the fraction of the season's
							games that the player's team has completed so far. This really
							only matters for the Award Races page, since it's always 1 at the
							end of the season. But during the season you might use this to
							make the Award Races look better. For instance in BBGM, the MVP
							formula is something like <code>ewa + seasonFraction * winp</code>
							. EWA is a cumulative stat that will continue increasing
							throughout the season. But <code>winp</code> is the team's winning
							percentage, which generally stays about the same throughout the
							year. Okay, I mean it goes up and down, but it doesn't continually
							increase over 82 games like a cumulative stat. So to combine those
							two numbers, you want <code>winp</code> to gradually become more
							important as the season progresses.
						</p>
						<p>
							<code>numWon</code> and <code>numWonConsecutive</code> can be used
							to implement voter fatigue. Like if you write{" "}
							<code>ws * 1/(numWon.MVP+1)</code> - <code>numWon.MVP</code> is
							the number of prior MVPs this player won. So if that value is 0,
							the result is just ws. But if it's 1, then it's 50% of WS. If 2,
							then 33% of WS, etc. If that sounds too extreme, you can use an
							exponent to make the dropoff slower, like{" "}
							<code>ws * (1/(numWon.MVP+1))^(1/4)</code>.{" "}
							<a
								href="https://www.wolframalpha.com/input?i=%281%2F%281%2Bx%29%29%5E%281%2F4%29+from+0+to+10"
								target="_blank"
							>
								Wolfram Alpha
							</a>{" "}
							is an easy tool to evaluate what these kinds of functions look
							like, if you want to try to find the best exponent.
						</p>
					</div>
					<div style={TEXT_MAX_WIDTH}>
						<h3>Only in playoff series awards</h3>
						<ul className="list-unstyled" style={ulStyle}>
							{state.variables.playoffSeriesOnly.map((stat) => (
								<li key={stat}>
									<code>{stat}</code>: {myGetCol(stat)}
								</li>
							))}
						</ul>
						<h2>Achievements</h2>
						<p>
							You can edit award settings outside of God Mode because they don't
							make the game any easier or harder. However, there are some{" "}
							<a href={helpers.leagueUrl(["achievements"])}>achievements</a>{" "}
							based on awards. Those are affected by your award settings.
						</p>
						<p>
							All of the award-based achievements mention specific awards (MVP,
							ROY, etc.) in their descriptions. If you don't edit any of the
							awards used by an achievement, then you can still get that
							achievement even if you edit other awards. You can also edit
							superficial parts of the award, like the name. But once you start
							editing things that change the results of the award (such as the
							formula) then that award will no longer be used by achievements.
						</p>
						<p>
							The one exception is if you edit the "group" of the award to make
							it more difficult to win. Currently this is only possible in ZenGM
							Baseball, which has conference-based awards by default. So for
							instance, if you switch the MVP from conference to leaguewide,
							that actually makes MVP harder to win. So that will still count
							towards ZenGM Baseball achievements.
						</p>
						<p>
							I mentioned above that you can change superficial parts of the
							award like the name and still be eligible for achievements. This
							is true even for the abbrev, like if you edit the MVP award so the
							abbrev is now "ABC" or whatever, that will still count as an MVP
							award for achievements as long as all the meaningful parts of the
							award are unedited. It works by scanning all the details of the
							award setting, not by matching the name/abbrev.
						</p>
						<h2>Anything else?</h2>
						<p>
							Everything else is hopefully either self-explanatory or explained
							in the ? icons by some form fields. If not,{" "}
							<a href="https://zengm.com/contact/">please let me know</a>!
						</p>
					</div>
				</>
			) : null}
		</>
	);
};
