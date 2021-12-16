import classNames from "classnames";
import { memo, useEffect, useRef, useState } from "react";
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
	marginBottom: -12,
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

	const keepScrollToRightRef = useRef(true);

	const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(
		null,
	);

	const prevGames = useRef<typeof games>([]);

	const games2: typeof games = [];

	useEffect(() => {
		if (!wrapperElement || !show) {
			return;
		}

		const handleWheel = (event: WheelEvent) => {
			if (
				!wrapperElement ||
				wrapperElement.scrollWidth <= wrapperElement.clientWidth
			) {
				return;
			}

			// We're scrolling within the bar, not within the whole page
			event.preventDefault();

			const leagueTopBarPosition = wrapperElement.scrollLeft;

			wrapperElement.scrollTo({
				left: leagueTopBarPosition + 2 * event.deltaY,
			});
		};

		// This triggers for wheel scrolling and click scrolling
		const handleScroll = () => {
			if (
				!wrapperElement ||
				wrapperElement.scrollWidth <= wrapperElement.clientWidth
			) {
				return;
			}

			// Keep track of if we're scrolled to the right or not
			keepScrollToRightRef.current =
				wrapperElement.scrollLeft + wrapperElement.offsetWidth >=
				wrapperElement.scrollWidth;
			console.log("handleScroll", keepScrollToRightRef.current);
		};

		wrapperElement.addEventListener("wheel", handleWheel, { passive: false });
		wrapperElement.addEventListener("scroll", handleScroll, { passive: false });

		return () => {
			wrapperElement.removeEventListener("wheel", handleWheel);
			wrapperElement.removeEventListener("scroll", handleScroll);
		};
	}, [show, wrapperElement]);

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

	if (show) {
		// Show only the first upcoming game
		for (const game of prevGames.current) {
			games2.push(game);
			if (game.teams[0].pts === undefined) {
				break;
			}
		}
	}

	// Keep scrolled to the right, if something besides a scroll event has moved us away (i.e. a game was simmed and added to the list)
	if (
		keepScrollToRightRef.current &&
		wrapperElement &&
		wrapperElement.scrollLeft + wrapperElement.offsetWidth <
			wrapperElement.scrollWidth
	) {
		wrapperElement.scrollTo({
			left: wrapperElement.scrollWidth,
		});
	}

	return (
		<div
			className="league-top-bar flex-shrink-0 d-flex overflow-auto flex-row ps-1 pb-1 mt-2"
			style={show ? undefined : hiddenStyle}
			ref={element => {
				setWrapperElement(element);
			}}
		>
			<Toggle
				show={show}
				toggle={() => {
					setShow(show2 => !show2);
					safeLocalStorage.setItem("bbgmShowLeagueTopBar", String(!show));
				}}
			/>
			{show
				? games2.map((game, i) => (
						<ScoreBox
							key={game.gid}
							className={`me-2${i === 0 ? " ms-auto" : ""}`}
							game={game}
							small
						/>
				  ))
				: null}
		</div>
	);
});

export default LeagueTopBar;
