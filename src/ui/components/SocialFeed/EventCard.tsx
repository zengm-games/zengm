import type { SocialEvent, SocialTeam } from "./types.ts";
import { VerifiedIcon } from "./Icons.tsx";

const styles = {
	article: {
		borderBottom: "1px solid var(--bs-border-color)",
		padding: "12px 16px",
		transition: "background-color 0.15s",
	} as React.CSSProperties,
	row: {
		display: "flex",
		gap: 12,
	} as React.CSSProperties,
	avatar: {
		width: 40,
		height: 40,
		borderRadius: "50%",
		flexShrink: 0,
		backgroundColor: "var(--bs-secondary-bg)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: 14,
		fontWeight: 700,
		color: "var(--bs-body-color)",
		overflow: "hidden",
	} as React.CSSProperties,
	avatarImg: {
		width: "100%",
		height: "100%",
		objectFit: "cover" as const,
	} as React.CSSProperties,
	content: {
		flex: 1,
		minWidth: 0,
	} as React.CSSProperties,
	header: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		flexWrap: "wrap" as const,
	} as React.CSSProperties,
	authorName: {
		fontWeight: 700,
		color: "var(--bs-body-color)",
	} as React.CSSProperties,
	teamAbbrev: {
		color: "var(--bs-secondary-color)",
		fontSize: 14,
	} as React.CSSProperties,
	dot: {
		color: "var(--bs-secondary-color)",
	} as React.CSSProperties,
	eventType: {
		color: "var(--bs-secondary-color)",
		fontSize: 13,
		textTransform: "capitalize" as const,
	} as React.CSSProperties,
	body: {
		marginTop: 6,
		fontSize: 15,
		lineHeight: 1.5,
		color: "var(--bs-body-color)",
	} as React.CSSProperties,
	scoreBadge: {
		display: "inline-block",
		marginTop: 8,
		padding: "2px 8px",
		borderRadius: 12,
		fontSize: 12,
		fontWeight: 600,
	} as React.CSSProperties,
};

const getScoreColor = (score?: number) => {
	if (!score) {
		return { bg: "var(--bs-tertiary-bg)", color: "var(--bs-secondary-color)" };
	}
	if (score >= 20) {
		return { bg: "rgba(211, 84, 0, 0.15)", color: "var(--bs-primary)" };
	}
	return { bg: "rgba(41, 128, 185, 0.15)", color: "#3498db" };
};

const getEventLabel = (type: string) => {
	const labels: Record<string, string> = {
		trade: "Trade",
		freeAgent: "Free Agency",
		draft: "Draft",
		injury: "Injury",
		reSigned: "Re-signed",
		release: "Released",
		playoffs: "Playoffs",
		madePlayoffs: "Playoffs",
		wonTitle: "Championship",
		playerFeat: "Player Feat",
		hallOfFame: "Hall of Fame",
		retired: "Retired",
		award: "Award",
		ageFraud: "News",
		tragedy: "News",
	};
	return labels[type] ?? type;
};

interface EventCardProps {
	event: SocialEvent;
	teams: SocialTeam[];
}

const EventCard = ({ event, teams }: EventCardProps) => {
	const scoreColor = getScoreColor(event.score);

	// Find team color for avatar background; fall back to theme-aware secondary bg
	let avatarBg: string | undefined;
	if (event.tids && event.tids.length > 0 && event.tids[0]! >= 0) {
		const team = teams[event.tids[0]!];
		if (team && team.colors && team.colors[0]) {
			avatarBg = team.colors[0];
		}
	}

	const initials = event.authorName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<article style={styles.article}>
			<div style={styles.row}>
				<div
					style={{
						...styles.avatar,
						...(avatarBg ? { backgroundColor: avatarBg, color: "#fff" } : {}),
					}}
				>
					{event.authorImgURL ? (
						<img
							src={event.authorImgURL}
							alt={event.authorName}
							style={styles.avatarImg}
						/>
					) : (
						initials
					)}
				</div>
				<div style={styles.content}>
					<div style={styles.header}>
						<span style={styles.authorName}>{event.authorName}</span>
						{event.authorTeamAbbrev !== "GGM" && <VerifiedIcon />}
						<span style={styles.teamAbbrev}>@{event.authorTeamAbbrev}</span>
						<span style={styles.dot}>&middot;</span>
						<span style={styles.eventType}>{getEventLabel(event.type)}</span>
					</div>
					<div
						style={styles.body}
						dangerouslySetInnerHTML={{ __html: event.text }}
					/>
					{event.score !== undefined && event.score > 0 && (
						<span
							style={{
								...styles.scoreBadge,
								backgroundColor: scoreColor.bg,
								color: scoreColor.color,
							}}
						>
							{event.score >= 20 ? "Major" : "Notable"}
						</span>
					)}
				</div>
			</div>
		</article>
	);
};

export default EventCard;
