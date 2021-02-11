import { Fragment, memo } from "react";
import { GAME_ACRONYM, SUBREDDIT_NAME } from "../../common";

const footerLinks = [
	{
		url: `https://${process.env.SPORT}-gm.com/about/`,
		title: "About",
	},
	{
		url: `https://${process.env.SPORT}-gm.com/blog/`,
		title: "Blog",
	},
	{
		url: `https://${process.env.SPORT}-gm.com/contact/`,
		title: "Contact",
	},
	{
		url: "https://github.com/dumbmatter/gm-games",
		title: "GitHub",
	},
	{
		url: `https://${process.env.SPORT}-gm.com/privacy-policy/`,
		title: "Privacy",
	},
	{
		url: `https://www.reddit.com/r/${SUBREDDIT_NAME}/`,
		title: "Reddit",
	},
	{
		url: "https://discord.gg/caPFuM9",
		title: "Discord",
	},
];

const Footer = memo(() => {
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
				{footerLinks.map(({ url, title }, i) => {
					return (
						<Fragment key={url}>
							{i > 0 ? " · " : null}
							<a href={url} rel="noopener noreferrer" target="_blank">
								{title}
							</a>
						</Fragment>
					);
				})}
				<br />
			</p>
			<p className="float-sm-right text-muted">
				{GAME_ACRONYM} v{window.bbgmVersion}
			</p>
		</footer>
	);
});

export default Footer;
