import { useMemo } from "react";
import { useAgentChatUi } from "../../util/agentChatUi.ts";

function preview(text: string, max = 40): string {
	if (text.length <= max) {
		return text;
	}
	return `${text.slice(0, max)}…`;
}

export default function InboxView({
	activeId,
	showHeader,
}: {
	activeId?: string | null;
	showHeader?: boolean;
} = {}) {
	const conversations = useAgentChatUi((s) => s.conversations);
	const openConversation = useAgentChatUi((s) => s.openConversation);
	const openNewDm = useAgentChatUi((s) => s.openNewDm);

	const sorted = useMemo(() => {
		const general = conversations.filter((c) => c.type === "general");
		const rest = conversations
			.filter((c) => c.type !== "general")
			.sort((a, b) => b.updatedAt - a.updatedAt);
		return [...general, ...rest];
	}, [conversations]);

	return (
		<div className="d-flex flex-column h-100">
			{showHeader && (
				<div className="px-3 py-2 border-bottom">
					<span className="fw-bold fs-5">Messages</span>
				</div>
			)}
			<div className="list-group list-group-flush flex-grow-1 overflow-auto">
				{sorted.map((conv) => (
					<button
						key={conv.id}
						type="button"
						className={`list-group-item list-group-item-action text-start border-0 border-bottom rounded-0${activeId === conv.id ? " active" : ""}`}
						onClick={() => openConversation(conv.id)}
					>
						<div className="fw-bold">{conv.name}</div>
						<div className="small text-muted">{preview(conv.lastMessage)}</div>
					</button>
				))}
			</div>
			<div className="border-top p-2 mt-auto">
				<button
					type="button"
					className="btn btn-primary w-100"
					onClick={() => openNewDm()}
				>
					New Message
				</button>
			</div>
		</div>
	);
}
