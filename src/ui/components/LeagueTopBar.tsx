import classNames from "classnames";
import { m, AnimatePresence } from "framer-motion";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useLocalShallow, safeLocalStorage } from "../util";
import ScoreBox from "./ScoreBox";

const Toggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => {
	return (
		<button
			className="btn btn-secondary p-0 league-top-bar-toggle"
			title={show ? "Hide scores" : "Show scores"}
			onClick={toggle}
		>
			<span
				className={classNames(
					"glyphicon",
					show ? "glyphicon-menu-right" : "glyphicon-menu-left",
				)}
			/>
		</button>
	);
};

const hiddenStyle = {
	marginBottom: -64,
};

const LeagueTopBar = memo(() => {
	const { games, lid, liveGameInProgress } = useLocalShallow(state => ({
		games: state.games,
		lid: state.lid,
		liveGameInProgress: state.liveGameInProgress,
	}));

	const [show, setShow] = useState(() => {
		const showTemp = safeLocalStorage.getItem("bbgmShowLeagueTopBar");
		if (showTemp === "true") {
			return true;
		}
		if (showTemp === "false") {
			return false;
		}
		return true;
	});

	const leagueTopBarRef = useRef(null);

	const [numberOfScoreBoxes, setNumberOfScoreBoxes] = useState(10);
	const prevGames = useRef<typeof games>([]);

	const updateNumberOfScoreBoxes = useCallback(() => {
		// Limit number of ScoreBoxes to render
		const documentElement = document.documentElement;
		if (documentElement) {
			const width = documentElement.clientWidth;
			setNumberOfScoreBoxes(Math.ceil(width / 115));
		}
	}, []);

	useEffect(() => {
		updateNumberOfScoreBoxes();
		window.addEventListener("optimizedResize", updateNumberOfScoreBoxes);
		return () => {
			window.removeEventListener("optimizedResize", updateNumberOfScoreBoxes);
		};
	}, [updateNumberOfScoreBoxes]);

	let games2: typeof games = [];

	const handleWheel = useCallback(e => {
		e.preventDefault();
		const leagueTopBarPosition = leagueTopBarRef.current.scrollLeft;

		leagueTopBarRef.current.scrollTo({
			top: 0,
			left: leagueTopBarPosition - e.deltaY + e.deltaX,
			behaviour: "smooth",
		});
	}, []);

	useEffect(() => {
		const leagueTopBar = leagueTopBarRef.current;
		if (
			!leagueTopBar ||
			!show ||
			leagueTopBar.scrollWidth <= leagueTopBar.clientWidth
		)
			return;

		console.log("added");
		leagueTopBar.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			console.log("removed");
			leagueTopBar.removeEventListener("wheel", handleWheel, {
				passive: false,
			});
		};
	}, [handleWheel, show, games2]);

	// If you take control of an expansion team after the season, the ASG is the only game, and it looks weird to show just it
	const onlyAllStarGame =
		games.length === 1 &&
		games[0].teams[0].tid === -1 &&
		games[0].teams[1].tid === -2;

	if (lid === undefined || games.length === 0 || onlyAllStarGame) {
		return null;
	}

	// Don't show any new games if liveGameInProgress
	if (!liveGameInProgress) {
		prevGames.current = games;
	}

	// let games2: typeof games = [];
	if (show) {
		// Show only the first upcoming game
		for (const game of prevGames.current) {
			games2.unshift(game);
			if (game.teams[0].pts === undefined) {
				break;
			}
		}
	}

	const transition = { duration: 0.2, type: "tween" };

	return (
		<div
			className="league-top-bar flex-shrink-0 d-flex overflow-auto flex-row-reverse pr-3 pl-1 pb-1 mt-2"
			style={show ? undefined : hiddenStyle}
			ref={leagueTopBarRef}
		>
			{show ? (
				// This makes it not animate the initial render
				<AnimatePresence initial={false}>
					{games2.map(game => (
						<m.div
							key={game.gid}
							layout
							initial={{ x: 105 }}
							animate={{ x: 0 }}
							// Need to specify exit, otherwise AnimatePresence makes divs stay around forever
							exit={{}}
							transition={transition}
						>
							<ScoreBox className="me-2" game={game} small />
						</m.div>
					))}
				</AnimatePresence>
			) : null}
			<Toggle
				show={show}
				toggle={() => {
					setShow(show2 => !show2);
					safeLocalStorage.setItem("bbgmShowLeagueTopBar", String(!show));
				}}
			/>
		</div>
	);
});

export default LeagueTopBar;
