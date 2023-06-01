import { memo } from "react";
import { GAME_NAME } from "../../common";

type Props = {
	gold?: boolean;
	inLeague?: boolean;
	updating: boolean;
};
const LogoAndText = memo(({ gold, inLeague, updating }: Props) => {
	return (
		<a
			className={
				inLeague
					? "navbar-brand text-body-secondary d-none d-md-inline ms-md-2 ms-lg-0"
					: "navbar-brand text-body-secondary"
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

			<span className={inLeague ? "d-none d-lg-inline" : undefined}>
				{GAME_NAME}
			</span>
		</a>
	);
});

export default LogoAndText;
