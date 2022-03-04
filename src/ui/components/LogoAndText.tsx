import { memo } from "react";
import { GAME_NAME, isSport } from "../../common";

type Props = {
	gold?: boolean;
	inLeague?: boolean;
	updating: boolean;
};
const LogoAndText = memo(({ gold, inLeague, updating }: Props) => {
	// "ZenGM Baseball" is too long to fit when the league menu is shown
	const gameName = isSport("baseball") ? "ZGM Baseball" : GAME_NAME;

	return (
		<a
			className={
				inLeague
					? "navbar-brand text-muted d-none d-md-inline"
					: "navbar-brand text-muted"
			}
			href="/"
		>
			<img
				alt=""
				className="spin"
				width="18"
				height="18"
				src={gold ? "/ico/logo-gold.png" : "/ico/logo.png"}
				style={{
					animationPlayState: updating ? "running" : "paused",
				}}
			/>

			{!inLeague ? (
				<span>{GAME_NAME}</span>
			) : (
				<>
					<span className="d-none d-lg-inline">{gameName}</span>
					<span className="d-lg-none">{gameName}</span>
				</>
			)}
		</a>
	);
});

export default LogoAndText;
