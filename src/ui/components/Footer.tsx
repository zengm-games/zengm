import React from "react";

const Footer = React.memo(() => {
	// banner-ad class is so ad blockers remove it cleanly. I'm so nice!
	return (
		<footer className="footer-wrapper mt-auto" id="main-footer">
			<p className="clearfix" />

			<div
				className="banner-ad"
				style={{
					position: "relative",
				}}
			>
				<div
					id={`${process.env.SPORT}-gm_mrec_btf_1`}
					style={{
						display: "none",
						textAlign: "center",
						height: "250px",
						position: "absolute",
						top: "5px",
						left: 0,
					}}
					data-refresh-time="-1"
				/>
				<div
					id="bbgm-ads-logo"
					style={{
						display: "none",
						height: "250px",
						margin: "5px 310px 0 310px",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<img
						alt=""
						src={`https://${process.env.SPORT}-gm.com/files/logo.png`}
						style={{
							maxHeight: "100%",
							maxWidth: "100%",
						}}
					/>
				</div>
				<div
					id={`${process.env.SPORT}-gm_mrec_btf_2`}
					style={{
						display: "none",
						textAlign: "center",
						height: "250px",
						position: "absolute",
						top: "5px",
						right: 0,
					}}
					data-refresh-time="-1"
				/>
			</div>

			<div className="clearfix" />
			<hr />

			<p className="float-sm-left">
				<a
					href={`https://${process.env.SPORT}-gm.com/about/`}
					rel="noopener noreferrer"
					target="_blank"
				>
					About
				</a>{" "}
				·{" "}
				<a
					href={`https://${process.env.SPORT}-gm.com/blog/`}
					rel="noopener noreferrer"
					target="_blank"
				>
					Blog
				</a>{" "}
				·{" "}
				<a
					href={`https://${process.env.SPORT}-gm.com/contact/`}
					rel="noopener noreferrer"
					target="_blank"
				>
					Contact
				</a>{" "}
				·{" "}
				<a
					href={`https://${process.env.SPORT}-gm.com/privacy-policy/`}
					rel="noopener noreferrer"
					target="_blank"
				>
					Privacy
				</a>{" "}
				·{" "}
				<a
					href={`https://www.reddit.com/r/${
						process.env.SPORT === "basketball" ? "BasketballGM" : "Football_GM"
					}/`}
					rel="noopener noreferrer"
					target="_blank"
				>
					Reddit
				</a>{" "}
				·{" "}
				<a
					href="https://discord.gg/caPFuM9"
					rel="noopener noreferrer"
					target="_blank"
				>
					Discord
				</a>
				<br />
			</p>
			<p className="float-sm-right text-muted">
				{process.env.SPORT.charAt(0).toUpperCase()}BGM v{window.bbgmVersion}
			</p>
		</footer>
	);
});

export default Footer;
