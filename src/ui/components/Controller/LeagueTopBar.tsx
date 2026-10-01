import clsx from "clsx";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocal, localActions } from "../../util/local.ts";
import { ScoreBox } from "../ScoreBox/index.tsx";

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

export const LeagueTopBar = memo(() => {
	const { games, lid, liveGameInProgress, showLeagueTopBar } = useLocal([
		"games",
		"lid",
		"liveGameInProgress",
		"showLeagueTopBar",
	]);

	const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(
		null,
	);

	const prevGames = useRef<typeof games>([]);

	const games2: typeof games = [];

	const contentRef = useRef<HTMLDivElement>(null);
	const prevContentWidth = useRef(0);

	// The wrapper is flex-row-reverse, so scrollLeft is 0 when scrolled all the way to the right and negative when scrolled to the left. That means the browser keeps it scrolled to the right automatically when games are added or the wrapper is resized. But if the user has scrolled to the left, we need to adjust for new games, otherwise the visible games would shift to the left.
	useLayoutEffect(() => {
		const contentWidth = contentRef.current?.offsetWidth ?? 0;
		const diff = contentWidth - prevContentWidth.current;
		prevContentWidth.current = contentWidth;

		if (!wrapperElement || diff === 0) {
			return;
		}

		const FUDGE_FACTOR = 50; // Off by a few pixels? That's fine!
		wrapperElement.scrollTo({
			left:
				wrapperElement.scrollLeft >= -FUDGE_FACTOR
					? 0
					: wrapperElement.scrollLeft - diff,
		});
	});

	useEffect(() => {
		if (!wrapperElement || !showLeagueTopBar) {
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

		wrapperElement.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			wrapperElement.removeEventListener("wheel", handleWheel);
		};
	}, [showLeagueTopBar, wrapperElement]);

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

	if (showLeagueTopBar) {
		// Show only the first upcoming game
		for (const game of prevGames.current) {
			games2.push(game);
			if (game.teams[0].pts === undefined) {
				break;
			}
		}
	}

	return (
		<div
			className="league-top-bar flex-shrink-0 d-flex overflow-auto small-scrollbar flex-row-reverse mt-2"
			style={showLeagueTopBar ? undefined : hiddenStyle}
			ref={setWrapperElement}
		>
			<Toggle
				show={showLeagueTopBar}
				toggle={() => {
					localActions.setShowLeagueTopBar(!showLeagueTopBar);
				}}
			/>
			<div className="d-flex flex-shrink-0 ps-1" ref={contentRef}>
				{showLeagueTopBar
					? games2.map((game) => (
							<ScoreBox key={game.gid} className="me-2" game={game} small />
						))
					: null}
			</div>
		</div>
	);
});
