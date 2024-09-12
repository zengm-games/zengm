import { memo } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container
import { AD_DIVS, AD_PROVIDER } from "../../common";

const Header = memo(() => {
	return (
		// banner-ad class is so ad blockers remove it cleanly. I'm so nice!
		AD_PROVIDER === "freestar" ? (
			<div className="mt-2">
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
			</div>
		) : (
			<div
				style={{
					// Same as mt-2, basically
					minHeight: 8,
				}}
			>
				<div
					className="banner-ad"
					id="raptive-placeholder-header-id"
					style={{
						display: "none",
						textAlign: "center",

						// 90px ad, 10px padding on each side from Raptive
						minHeight: 110,

						// https://stackoverflow.com/a/32349703/786644
						overflow: "hidden",
					}}
				/>
			</div>
		)
	);
});

export default Header;
