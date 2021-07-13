import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import { timeBetweenGames } from "../../../common";
import playThroughInjuriesFactor from "../../../common/playThroughInjuriesFactor";
import { HelpPopover } from "../../components";
import { toWorker } from "../../util";

const Slider = ({
	className,
	initialValue,
	playoffs,
	tid,
}: {
	className?: string;
	initialValue: number;
	playoffs?: boolean;
	tid: number;
}) => {
	const [value, setValue] = useState(initialValue);

	const id = `play-through-injury-${playoffs ? "playoffs" : "regular-season"}`;

	const percent = 100 * playThroughInjuriesFactor(value);

	const rounded = Number.isInteger(percent)
		? String(percent)
		: percent.toFixed(1);

	return (
		<div className={className}>
			<label className="mb-1" htmlFor={id}>
				{playoffs ? "Playoffs" : "Regular Season"}
			</label>
			<input
				type="range"
				className="form-control-range"
				id={id}
				value={value}
				min="0"
				max="10"
				step="1"
				onChange={async event => {
					const parsed = parseInt(event.target.value, 10);
					if (!Number.isNaN(parsed)) {
						setValue(parsed);
						await toWorker(
							"main",
							"updatePlayThroughInjuries",
							tid,
							parsed,
							playoffs,
						);
					}
				}}
			/>
			<div className="mt-1">
				{value === 0 ? (
					"Only play fully healthy players"
				) : (
					<>
						{value} {timeBetweenGames(value)} ({rounded}% performance)
					</>
				)}
			</div>
		</div>
	);
};

const titleText = "Play Through Injuries";

const PlayThroughInjuriesSliders = ({
	t,
}: {
	t: {
		tid: number;
		playThroughInjuries: [number, number];
	};
}) => {
	const [expanded, setExpanded] = useState(!window.mobile);

	return (
		<div className="play-through-injuries">
			<div className="d-flex align-items-center">
				{window.mobile ? (
					<button
						className="btn btn-link p-0 font-weight-bold"
						type="button"
						onClick={() => setExpanded(prev => !prev)}
					>
						<AnimatePresence initial={false}>
							<m.span
								animate={expanded ? "open" : "collapsed"}
								variants={{
									open: { rotate: 90 },
									collapsed: { rotate: 0 },
								}}
								transition={{
									duration: 0.3,
									type: "tween",
								}}
								className="glyphicon glyphicon-triangle-right"
							/>
						</AnimatePresence>{" "}
						{titleText}
					</button>
				) : (
					<b>{titleText}</b>
				)}
				{expanded ? (
					<HelpPopover className="ml-1" title="Play Through Injuries">
						<p>
							This allows you to determine when players should play through
							minor injuries. You can set the cutoff separately for the regular
							season and playoffs.
						</p>
						<p>
							The more games remaining on a player's injury, the worse he will
							play. So if a player comes back at 90% performance and plays every
							day until he's healthy, he will gradually improve each game until
							he reaches 100%.
						</p>
						<p>
							Additionally, the injury rate is 50% higher when playing through
							an injury, which includes the possibility of a player either
							reaggravating his current injury or getting a new injury.
						</p>
					</HelpPopover>
				) : null}
			</div>
			<AnimatePresence initial={false}>
				{expanded ? (
					<m.form
						className="mt-2"
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={{
							open: { opacity: 1, height: "auto" },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{
							duration: 0.3,
							type: "tween",
						}}
					>
						<Slider
							className="mb-3"
							initialValue={t.playThroughInjuries[0]}
							tid={t.tid}
						/>
						<Slider
							playoffs
							initialValue={t.playThroughInjuries[1]}
							tid={t.tid}
						/>
					</m.form>
				) : null}
			</AnimatePresence>
		</div>
	);
};

export default PlayThroughInjuriesSliders;
