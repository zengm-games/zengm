import PropTypes from "prop-types";
import { memo } from "react";
import { GAME_NAME } from "../../common";

type Props = {
	gold?: boolean;
	lid?: number;
	updating: boolean;
};
const LogoAndText = memo(({ gold, lid, updating }: Props) => {
	return (
		<a
			className={
				lid !== undefined
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
			{lid === undefined ? (
				<span className="d-lg-none">{GAME_NAME}</span>
			) : null}
		</a>
	);
});

// @ts-ignore
LogoAndText.propTypes = {
	gold: PropTypes.bool,
	lid: PropTypes.number,
	updating: PropTypes.bool.isRequired,
};

export default LogoAndText;
