import type { SocialMessage } from "./types.ts";

const styles = {
	item: {
		display: "flex",
		gap: 12,
		padding: 16,
		borderBottom: "1px solid #2f3336",
		transition: "background-color 0.15s",
	} as React.CSSProperties,
	unread: {
		backgroundColor: "rgba(211, 84, 0, 0.05)",
	} as React.CSSProperties,
	dot: {
		width: 8,
		height: 8,
		borderRadius: "50%",
		backgroundColor: "#d35400",
		flexShrink: 0,
		marginTop: 6,
	} as React.CSSProperties,
	readDot: {
		width: 8,
		height: 8,
		borderRadius: "50%",
		backgroundColor: "transparent",
		flexShrink: 0,
		marginTop: 6,
	} as React.CSSProperties,
	content: {
		flex: 1,
		minWidth: 0,
	} as React.CSSProperties,
	from: {
		fontWeight: 700,
		color: "#e7e9ea",
		fontSize: 15,
	} as React.CSSProperties,
	year: {
		color: "#71767b",
		fontSize: 13,
		marginLeft: 8,
	} as React.CSSProperties,
	subject: {
		color: "#d35400",
		fontSize: 14,
		marginTop: 2,
	} as React.CSSProperties,
	text: {
		color: "#71767b",
		fontSize: 14,
		marginTop: 4,
		overflow: "hidden",
		textOverflow: "ellipsis",
		display: "-webkit-box",
		WebkitLineClamp: 2,
		WebkitBoxOrient: "vertical" as const,
		lineHeight: 1.4,
	} as React.CSSProperties,
	empty: {
		padding: 48,
		textAlign: "center" as const,
		color: "#71767b",
		fontSize: 15,
	} as React.CSSProperties,
};

interface MessagesPanelProps {
	messages: SocialMessage[];
}

const MessagesPanel = ({ messages }: MessagesPanelProps) => {
	if (messages.length === 0) {
		return <div style={styles.empty}>No messages yet</div>;
	}

	return (
		<div>
			{messages.map((msg) => (
				<div
					key={msg.mid}
					style={{
						...styles.item,
						...(!msg.read ? styles.unread : {}),
					}}
				>
					<div style={msg.read ? styles.readDot : styles.dot} />
					<div style={styles.content}>
						<div>
							<span style={styles.from}>{msg.from}</span>
							<span style={styles.year}>Year {msg.year}</span>
						</div>
						{msg.subject && <div style={styles.subject}>{msg.subject}</div>}
						<div
							style={styles.text}
							dangerouslySetInnerHTML={{ __html: msg.text }}
						/>
					</div>
				</div>
			))}
		</div>
	);
};

export default MessagesPanel;
