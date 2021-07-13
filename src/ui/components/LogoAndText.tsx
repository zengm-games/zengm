import PropTypes from "prop-types";
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
			<span className="d-none d-lg-inline">{GAME_NAME}</span>
			{!inLeague ? <span className="d-lg-none">{GAME_NAME}</span> : null}
		</a>
	);
});

// @ts-ignore
LogoAndText.propTypes = {
	gold: PropTypes.bool,
	inLeague: PropTypes.bool,
	updating: PropTypes.bool.isRequired,
};

export default LogoAndText;
