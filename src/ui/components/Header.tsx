import { memo } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container
import { AD_DIVS } from "../../common";

const Header = memo(() => {
	return (
		// banner-ad class is so ad blockers remove it cleanly. I'm so nice!
		<>
			<div
				className="banner-ad"
				id={`${AD_DIVS.leaderboard}_disabled`}
				style={{
					display: "none",
					textAlign: "center",
					minHeight: 90,
					marginBottom: 5,
				}}
			/>
			<div
				className="banner-ad"
				id={`${AD_DIVS.mobile}_disabled`}
				style={{
					display: "none",
					textAlign: "center",
					minHeight: 50,
					marginBottom: 5,
				}}
			/>
		</>
	);
});

export default Header;
