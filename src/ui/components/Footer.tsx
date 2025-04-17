import { memo } from "react";
import {
	AD_DIVS,
	GAME_ACRONYM,
	SUBREDDIT_NAME,
	VIDEO_ADS,
	VIDEO_AD_PADDING,
} from "../../common/index.ts";
import { useLocalPartial } from "../util/index.ts";

const footerLinks = [
	{
		url: "https://zengm.com/about/",
		title: "About",
	},
	{
		url: "https://zengm.com/blog/",
		title: "Blog",
	},
	{
		url: "https://zengm.com/contact/",
		title: "Contact",
	},
	{
		url: "https://zengm.com/privacy/",
		title: "Privacy",
	},
	{
		url: "https://github.com/zengm-games/zengm",
		title: "GitHub",
	},
	{
		url: `https://www.reddit.com/r/${SUBREDDIT_NAME}/`,
		title: "Reddit",
	},
	{
		url: "https://zengm.com/discord/",
		title: "Discord",
	},
];

const Footer = memo(() => {
	const { gold } = useLocalPartial(["gold"]);

	const video_ad_padding = VIDEO_ADS && !gold;

	// banner-ad class is so ad blockers remove it cleanly. I'm so nice!
	return (
		<footer
			className={`footer-wrapper mt-auto${video_ad_padding ? "" : " mb-3"}`}
			id="main-footer"
			style={
				video_ad_padding
					? {
							paddingBottom: VIDEO_AD_PADDING,
						}
					: undefined
			}
		>
			<p className="clearfix" />

			<div
				className="banner-ad"
				style={{
					position: "relative",
				}}
			>
				<div
					id={`${AD_DIVS.rectangle1}_disabled`}
					style={{
						display: "none",
						textAlign: "center",
						height: "250px",
						position: "absolute",
						top: "5px",
						left: 0,
					}}
				/>
				<div
					id="bbgm-ads-logo"
					style={{
						display: "none",
						height: "250px",
						margin: "5px 320px 0 320px",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<img
						alt=""
						src={`https://zengm.com/files/logo-${process.env.SPORT}.svg`}
						style={{
							maxHeight: "100%",
							maxWidth: "100%",
						}}
					/>
				</div>
				<div
					id={`${AD_DIVS.rectangle2}_disabled`}
					style={{
						display: "none",
						textAlign: "center",
						height: "250px",
						position: "absolute",
						top: "5px",
						right: 0,
					}}
				/>
			</div>

			<div className="clearfix" />
			<hr />

			<div
				className="d-flex flex-wrap justify-content-between text-body-secondary"
				style={{
					columnGap: "1rem",
				}}
			>
				<div>
					{footerLinks.map(({ url, title }, i) => {
						return (
							<span key={url}>
								{i > 0 ? " · " : null}
								<a href={url} className="link-secondary" target="_blank">
									{title}
								</a>
							</span>
						);
					})}
				</div>
				<div>
					{GAME_ACRONYM}{" "}
					<a
						href="https://zengm.com/changelog/"
						className="link-secondary"
						target="_blank"
					>
						v{window.bbgmVersion}
					</a>
				</div>
			</div>
		</footer>
	);
});

export default Footer;
