import PropTypes from "prop-types";
import { Modal } from "react-bootstrap";
import { GAME_NAME, WEBSITE_ROOT } from "../../common";
import { animation } from "../views/Settings/Injuries";
import GameLinks from "./GameLinks";

type Props = {
	close: () => void;
	show: boolean;
};

const NagModal = ({ close, show }: Props) => {
	const adBlock =
		!window.freestar.refreshAllSlots ||
		!window.googletag ||
		!window.googletag.pubads;
	return (
		<Modal show={show} onHide={close} animation={animation}>
			<Modal.Header closeButton>
				{adBlock
					? "Are you using an ad blocker?"
					: `Please support ${GAME_NAME}`}
			</Modal.Header>
			{adBlock ? (
				<Modal.Body>
					<p>
						Don't worry. I understand why people use ad blockers. You can close
						this window and keep playing.
					</p>
					<p>
						But please remember that {GAME_NAME} is a free game. It's made by
						one person (<a href={`https://${WEBSITE_ROOT}/about/`}>me</a>) in my
						spare time. The more money I make, the more time I can afford to
						spend improving the game.
					</p>
					<p>
						Also remember how corrupt and horrible most video game companies
						are. Imagine if {GAME_NAME} was owned by EA or 2k. For example, I
						could make a lot more money if I let you pay to "hire trainers" to
						improve player development.
					</p>
					<p>
						But I refuse to do that. If you want to encourage me, please support{" "}
						{GAME_NAME}. There are a few ways you can do it:
					</p>
					<ol>
						<li>
							<b>Tell your friends about {GAME_NAME}.</b> The more users I have,
							the better.
						</li>
						<li>
							<b>
								<a href="/account" onClick={close}>
									Subscribe to GM Gold.
								</a>
							</b>{" "}
							For $5/month, you can play <GameLinks /> without any ads.
						</li>
						<li>
							<b>Disable your ad blocker for {GAME_NAME}.</b> To do this, click
							the icon for your ad blocker (such as uBlock Origin or Adblock
							Plus) in your browser toolbar and there will be some button to
							allow you to disable it for only this site.
						</li>
					</ol>
					<p className="mb-0">
						None of that is mandatory. Like I said at the top, you can close
						this and keep playing!
					</p>
				</Modal.Body>
			) : (
				<Modal.Body>
					<p>
						{GAME_NAME} is completely free. There will never be any{" "}
						<a
							href="http://en.wikipedia.org/wiki/Freemium"
							rel="noopener noreferrer"
							target="_blank"
						>
							"freemium"
						</a>{" "}
						or{" "}
						<a
							href="http://en.wikipedia.org/wiki/Free-to-play"
							rel="noopener noreferrer"
							target="_blank"
						>
							"pay-to-win"
						</a>{" "}
						bullshit here. Why? Because if a game charges you money for
						power-ups, the developer makes more money if they make their game
						frustratingly annoying to play without power-ups. Because of this,{" "}
						<b>freemium games always suck</b>.
					</p>
					<p>
						If you want to support {GAME_NAME} continuing to be a non-sucky
						game, sign up for GM Gold! It's only <b>$5/month</b>. What do you
						get? More like, what don't you get? You get no new features, no new
						improvements, no new anything. Just <b>no more ads</b> on{" "}
						<GameLinks thisGameText="this game" />. That's it. Why? For
						basically the same reason I won't make {GAME_NAME} freemium. I don't
						want the free version to become a crippled advertisement for the pay
						version. If you agree that the world is a better place when anyone
						anywhere can play <GameLinks noLinks />, sign up for GM Gold today!
					</p>
					<div className="text-center">
						<a href="/account" className="btn btn-primary" onClick={close}>
							Sign up for GM Gold from your account page
						</a>
					</div>
				</Modal.Body>
			)}
		</Modal>
	);
};

NagModal.propTypes = {
	close: PropTypes.func.isRequired,
	show: PropTypes.bool.isRequired,
};

export default NagModal;
