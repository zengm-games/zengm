import clsx from "clsx";
import type { CSSProperties } from "react";

export const ChampionshipBanner = ({
	className,
	hideRope,
	hideText,
	season,
	style,
	t,
}: {
	className?: string;
	hideRope?: boolean;
	hideText?: boolean;
	season: number;
	style?: CSSProperties;
	t: {
		colors: [string, string, string];
		imgURL?: string;
		imgURLSmall?: string;
	};
}) => {
	const viewBox = hideRope ? "0 15 182 232" : "0 0 182 247";

	return (
		<div
			className={clsx("d-flex justify-content-center", className)}
			style={style}
		>
			<svg
				fill="none"
				preserveAspectRatio="xMidYMid meet"
				viewBox={viewBox}
				xmlns="http://www.w3.org/2000/svg"
				style={{ maxWidth: 125 }}
			>
				{hideRope
					? null
					: [14, 165.5].map((x, i) => {
							return (
								<rect
									key={i}
									style={{ fill: "var(--bs-border-color)" }}
									height="16.3951"
									width="2.5"
									x={x}
								></rect>
							);
						})}
				<path
					d="M12 24.5C12 23.6716 12.6716 23 13.5 23H168.5C169.328 23 170 23.6716 170 24.5V222.874L91 247L12 222.874V24.5Z"
					fill={t.colors[0]}
				></path>
				<path
					d="M14 221.394V25H168V221.394L91 244.909L14 221.394Z"
					stroke={t.colors[2]}
					strokeWidth="4"
				></path>
				<rect
					fill={t.colors[0]}
					height="16"
					rx="6"
					stroke={t.colors[2]}
					strokeWidth="3"
					width="164"
					x="9"
					y="16"
				></rect>
				<foreignObject
					height="100%"
					width="100%"
					x="0"
					y="50"
					style={{ color: t.colors[1] }}
				>
					<div className="text-center" style={{ fontSize: 36, lineHeight: 1 }}>
						{season}
					</div>
					<div
						className="d-flex align-items-center justify-content-center my-3"
						style={{ height: hideText ? 114 : 74 }}
					>
						{t.imgURL || t.imgURLSmall ? (
							<img
								className="mh-100"
								src={t.imgURL ?? t.imgURLSmall}
								alt=""
								style={{ maxWidth: "75%" }}
							/>
						) : null}
					</div>
					{hideText ? null : (
						<div
							className="text-center"
							style={{ fontSize: 16, lineHeight: 1 }}
						>
							League Champions
						</div>
					)}
				</foreignObject>
			</svg>
		</div>
	);
};
