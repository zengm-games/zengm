import { GAME_NAME } from "../../common/constants.ts";
import { GameLinks } from "./GameLinks.tsx";

export const GoldPitchText = () => {
	return (
		<>
			<p>
				{GAME_NAME} is completely free. There will never be any{" "}
				<a href="http://en.wikipedia.org/wiki/Freemium" target="_blank">
					"freemium"
				</a>{" "}
				or{" "}
				<a href="http://en.wikipedia.org/wiki/Free-to-play" target="_blank">
					"pay-to-win"
				</a>{" "}
				bullshit here. Why? Because if a game charges you money for power-ups,
				the developer makes more money if they make their game frustratingly
				annoying to play without power-ups. Because of this,{" "}
				<b>freemium games always suck</b>.
			</p>
			<p>
				If you want to support {GAME_NAME} continuing to be a non-sucky game,
				sign up for ZenGM Gold! It's only <b>$5/month</b>. What do you get? More
				like, what don't you get? You get no new features, no new improvements,
				no new anything. Just <b>no more ads</b> on{" "}
				<GameLinks thisGameText="this game" />. That's it. Why? For basically
				the same reason I won't make {GAME_NAME} freemium. I don't want the free
				version to become a crippled advertisement for the pay version. If you
				agree that the world is a better place when anyone anywhere can play{" "}
				<GameLinks noLinks />, sign up for ZenGM Gold today!
			</p>
		</>
	);
};
