import { GAME_NAME } from "../../../common/constants.ts";
import { ads } from "../../util/ads.ts";
import { GameLinks } from "../GameLinks.tsx";
import { GoldPitchText } from "../GoldPitchText.tsx";
import { Modal } from "../Modal.tsx";

type Props = {
	close: () => void;
	show: boolean;
};

export const NagModal = ({ close, show }: Props) => {
	const adBlock = ads.adBlock();
	return (
		<Modal show={show} onHide={close}>
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
						But please remember that {GAME_NAME} is a free game made by one
						person (<a href="https://zengm.com/about/">me</a>). This is my full
						time job, and I do need to make some money to pay the bills!
					</p>
					<p>
						Also remember how corrupt and horrible most video game companies
						are. Imagine if {GAME_NAME} was owned by EA or 2k. I could probably
						make a lot more money if I let you pay to "hire trainers" to improve
						player development, and gave you bad progs if you didn't pay.
					</p>
					<p>
						I refuse to do stuff like that. If you want to encourage me, please
						support {GAME_NAME}. There are a few ways you can do it:
					</p>
					<ol>
						<li>
							<b>Tell your friends about {GAME_NAME}.</b> The more users I have,
							the better.
						</li>
						<li>
							<b>
								<a href="/account" onClick={close}>
									Subscribe to ZenGM Gold.
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
					<GoldPitchText />
					<div className="text-center">
						<a href="/account" className="btn btn-primary" onClick={close}>
							Sign up for ZenGM Gold from your account page
						</a>
					</div>
				</Modal.Body>
			)}
		</Modal>
	);
};
