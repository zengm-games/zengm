import clsx from "clsx";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useLocalPartial, safeLocalStorage } from "../util/index.ts";
import ScoreBox from "./ScoreBox/index.tsx";
import { emitter } from "./Modal.tsx";

const Toggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => {
	// container-fluid is needed to make this account for scrollbar width when modal is open
	return (
		<button
			className="btn btn-secondary p-0 league-top-bar-toggle"
			title={show ? "Hide scores" : "Show scores"}
			onClick={toggle}
		>
			<span
				className={clsx(
					"glyphicon",
					show ? "glyphicon-menu-right" : "glyphicon-menu-left",
				)}
			/>
		</button>
	);
};

const hiddenStyle = {
	height: 0,
};

const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const LeagueTopBar = memo(() => {
	const { games, lid, liveGameInProgress } = useLocalPartial([
		"games",
		"lid",
		"liveGameInProgress",
	]);

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

	const keepScrolledToRightIfNecessary = useCallback(() => {
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
	}, [wrapperElement]);

	useEffect(() => {
		return emitter.on("keepScrollToRight", keepScrolledToRightIfNecessary);
	}, [keepScrolledToRightIfNecessary]);

	useEffect(() => {
		if (!wrapperElement || !show) {
			return;
		}

		const handleWheel = (event: WheelEvent) => {
			if (
				!wrapperElement ||
				wrapperElement.scrollWidth <= wrapperElement.clientWidth ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey
			) {
				return;
			}

			// We're scrolling within the bar, not within the whole page
			event.preventDefault();

			const leagueTopBarPosition = wrapperElement.scrollLeft;

			wrapperElement.scrollTo({
				// Normal mouse wheels are just deltaY, but trackpads (such as on Mac) can include both, and I think there's no way to tell if this event came from a device supporting two dimensional scrolling or not.
				left: leagueTopBarPosition + 2 * (event.deltaX + event.deltaY),
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
			const FUDGE_FACTOR = 50; // Off by a few pixels? That's fine!
			keepScrollToRightRef.current =
				wrapperElement.scrollLeft + wrapperElement.offsetWidth >=
				wrapperElement.scrollWidth - FUDGE_FACTOR;
		};

		wrapperElement.addEventListener("wheel", handleWheel, { passive: false });
		wrapperElement.addEventListener("scroll", handleScroll, { passive: false });

		// This works better than the global "resize" event because it also handles when the div size changes due to other reasons, like the window's scrollbar appearing or disappearing
		const resizeObserver = new ResizeObserver(keepScrolledToRightIfNecessary);
		resizeObserver.observe(wrapperElement);

		return () => {
			wrapperElement.removeEventListener("wheel", handleWheel);
			wrapperElement.removeEventListener("scroll", handleScroll);
			resizeObserver.disconnect();
		};
	}, [keepScrolledToRightIfNecessary, show, wrapperElement]);

	// If you take control of an expansion team after the season, the ASG is the only game, and it looks weird to show just it
	const onlyAllStarGame =
		games.length === 1 &&
		games[0]!.teams[0].tid === -1 &&
		games[0]!.teams[1].tid === -2;

	if (lid === undefined || games.length === 0 || onlyAllStarGame) {
		return <div className="mt-2" />;
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

	// In a new season, start scrolled to right
	if (games2.length <= 1) {
		keepScrollToRightRef.current = true;
	}

	// Keep scrolled to the right, if something besides a scroll event has moved us away (i.e. a game was simmed and added to the list)
	keepScrolledToRightIfNecessary();

	return (
		<div
			className={`league-top-bar${
				IS_SAFARI ? " league-top-bar-safari" : ""
			} flex-shrink-0 d-flex overflow-auto small-scrollbar flex-row ps-1 mt-2`}
			style={show ? undefined : hiddenStyle}
			ref={(element) => {
				setWrapperElement(element);
			}}
		>
			<Toggle
				show={show}
				toggle={() => {
					if (show === false) {
						// When showing, always scroll to right
						keepScrollToRightRef.current = true;
					}
					setShow(!show);
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
