import type { SocialEvent, SocialTeam } from "./types.ts";
import { VerifiedIcon } from "./Icons.tsx";

const styles = {
	article: {
		borderBottom: "1px solid #2f3336",
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
		backgroundColor: "#333",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: 14,
		fontWeight: 700,
		color: "#fff",
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
		color: "#e7e9ea",
	} as React.CSSProperties,
	teamAbbrev: {
		color: "#71767b",
		fontSize: 14,
	} as React.CSSProperties,
	dot: {
		color: "#71767b",
	} as React.CSSProperties,
	eventType: {
		color: "#71767b",
		fontSize: 13,
		textTransform: "capitalize" as const,
	} as React.CSSProperties,
	body: {
		marginTop: 6,
		fontSize: 15,
		lineHeight: 1.5,
		color: "#e7e9ea",
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
	if (!score) return { bg: "#1d1f23", color: "#71767b" };
	if (score >= 20) return { bg: "rgba(211, 84, 0, 0.15)", color: "#d35400" };
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

	// Find team color for avatar background
	let avatarBg = "#333";
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
				<div style={{ ...styles.avatar, backgroundColor: avatarBg }}>
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
