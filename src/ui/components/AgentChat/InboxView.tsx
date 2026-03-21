import { useMemo, useRef } from "react";
import type { Conversation } from "../../util/agentChatUi.ts";
import { useAgentChatUi } from "../../util/agentChatUi.ts";
import { useLocalPartial } from "../../util/index.ts";
import TeamLogoInline from "../TeamLogoInline.tsx";

function preview(text: string, max = 40): string {
	if (text.length <= max) {
		return text;
	}
	return `${text.slice(0, max)}…`;
}

function initialSort(conversations: Conversation[]): string[] {
	return [...conversations]
		.sort((a, b) => b.updatedAt - a.updatedAt)
		.map((c) => c.id);
}

export default function InboxView({
	activeId,
	showHeader,
}: {
	activeId?: string | null;
	showHeader?: boolean;
} = {}) {
	const allConversations = useAgentChatUi((s) => s.conversations);
	const openConversation = useAgentChatUi((s) => s.openConversation);
	const openNewDm = useAgentChatUi((s) => s.openNewDm);

	const { teamInfoCache } = useLocalPartial([
		"teamInfoCache",
	]);

	const orderRef = useRef<string[] | null>(null);

	const sorted = useMemo(() => {
		const conversations = allConversations.filter((c) => c.type !== "general");
		const convMap = new Map(conversations.map((c) => [c.id, c]));

		if (orderRef.current === null) {
			orderRef.current = initialSort(conversations);
			return orderRef.current.map((id) => convMap.get(id)!);
		}

		const existingIds = new Set(orderRef.current);
		const newIds = conversations
			.filter((c) => !existingIds.has(c.id))
			.map((c) => c.id);

		if (newIds.length > 0) {
			orderRef.current.unshift(...newIds);
		}

		const currentIds = new Set(conversations.map((c) => c.id));
		orderRef.current = orderRef.current.filter((id) => currentIds.has(id));

		return orderRef.current.map((id) => convMap.get(id)!);
	}, [allConversations]);

	return (
		<div className="d-flex flex-column h-100">
			{showHeader && (
				<div className="agent-chat-header px-3 border-bottom d-flex align-items-center">
					<span className="fw-bold fs-5">Messages</span>
				</div>
			)}
			<div className="list-group list-group-flush flex-grow-1 overflow-auto">
				{sorted.map((conv) => {
					const gmTeamInfo =
						conv.entityContext
							? teamInfoCache[conv.entityContext.tid]
							: undefined;

					return (
						<button
							key={conv.id}
							type="button"
							className={`list-group-item list-group-item-action text-start border-0 border-bottom rounded-0${activeId === conv.id ? " agent-chat-inbox-active" : ""}`}
							onClick={() => openConversation(conv.id)}
						>
							<div className="d-flex align-items-center gap-2">
								{gmTeamInfo ? (
									<TeamLogoInline
										imgURL={gmTeamInfo.imgURL}
										imgURLSmall={gmTeamInfo.imgURLSmall}
										size={24}
									/>
								) : null}
								<div className="min-width-0 overflow-hidden">
									<div className="fw-bold text-truncate">{conv.name}</div>
									<div className="small text-muted text-truncate">
										{preview(conv.lastMessage)}
									</div>
								</div>
							</div>
						</button>
					);
				})}
			</div>
			<div className="border-top px-2 py-2 mt-auto">
				<button
					type="button"
					className="btn btn-sm btn-primary w-100"
					onClick={() => openNewDm()}
				>
					New Message
				</button>
			</div>
		</div>
	);
}
