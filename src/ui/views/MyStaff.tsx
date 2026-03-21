import { agentChatStyles } from "../components/AgentChat/index.tsx";
import ChatView from "../components/AgentChat/ChatView.tsx";
import { useAgentChatUi } from "../util/agentChatUi.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";

function preview(text: string, max = 40): string {
	if (text.length <= max) {
		return text;
	}
	return `${text.slice(0, max)}…`;
}

const assistantStyles = `
	.agent-assistant-thread {
		max-width: 720px;
		padding-bottom: 60vh;
	}
	.agent-assistant-msg {
		margin-bottom: 1.5rem;
	}
	.agent-assistant-msg-user {
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		background: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.04));
		max-width: 85%;
		width: fit-content;
		margin-left: auto;
	}
	.agent-assistant-msg-ai {
		padding: 0;
	}
	.agent-assistant-msg-ai .agent-chat-md {
		font-size: 0.9375rem;
		line-height: 1.55;
	}
	.agent-assistant-msg-ai .agent-chat-md h1,
	.agent-assistant-msg-ai .agent-chat-md h2 {
		font-size: 1.05rem;
		margin: 1em 0 0.4em;
	}
	.agent-assistant-msg-ai .agent-chat-md h3,
	.agent-assistant-msg-ai .agent-chat-md h4 {
		font-size: 0.95rem;
		margin: 0.85em 0 0.3em;
	}
	.agent-assistant-msg-ai .agent-chat-md p {
		margin: 0.45em 0;
	}
	.agent-assistant-msg-ai .agent-chat-md ul,
	.agent-assistant-msg-ai .agent-chat-md ol {
		margin: 0.4em 0;
		padding-left: 1.4rem;
	}
	.agent-assistant-msg-ai .agent-chat-md li + li {
		margin-top: 0.2em;
	}
	.agent-assistant-msg-ai .agent-chat-md table {
		font-size: 0.8375rem;
	}
	.agent-assistant-user-text {
		white-space: pre-wrap;
		font-size: 0.9375rem;
		line-height: 1.45;
	}
	.agent-assistant-role {
		font-size: 0.75rem;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}
	.agent-assistant-input-area {
		background: var(--bs-body-bg, #fff);
	}
	.agent-assistant-input {
		max-width: 720px;
	}
	.agent-staff-sidebar {
		width: 260px;
		min-width: 260px;
		max-width: 260px;
	}
	.agent-staff-chat-item {
		cursor: pointer;
		border: none;
		border-bottom: 1px solid var(--bs-border-color, #dee2e6);
		border-radius: 0;
		background: transparent;
		text-align: start;
		width: 100%;
		padding: 0.6rem 0.75rem;
	}
	.agent-staff-chat-item:hover {
		background: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.03));
	}
	.agent-staff-chat-item.active {
		background: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.04));
	}
`;

const MyStaff = () => {
	useTitleBar({ title: "My Staff" });

	const conversations = useAgentChatUi((s) => s.conversations);
	const activeStaffChatId = useAgentChatUi((s) => s.activeStaffChatId);
	const openStaffChat = useAgentChatUi((s) => s.openStaffChat);
	const newStaffChat = useAgentChatUi((s) => s.newStaffChat);

	const staffChats = conversations
		.filter((c) => c.type === "general")
		.sort((a, b) => b.updatedAt - a.updatedAt);

	const activeConversation =
		staffChats.find((c) => c.id === activeStaffChatId) ?? staffChats[0] ?? null;

	return (
		<div
			className="agent-chat-full d-flex border rounded"
			style={{ height: "calc(100vh - 200px)" }}
		>
			<div className="agent-staff-sidebar border-end d-flex flex-column">
				<div className="agent-chat-header px-3 border-bottom d-flex align-items-center justify-content-between">
					<span className="fw-bold fs-5">My Staff</span>
					<button
						type="button"
						className="btn btn-sm btn-outline-primary"
						onClick={() => newStaffChat()}
					>
						+ New
					</button>
				</div>
				<div className="flex-grow-1 overflow-auto">
					{staffChats.map((conv) => (
						<button
							key={conv.id}
							type="button"
							className={`agent-staff-chat-item${activeConversation?.id === conv.id ? " active" : ""}`}
							onClick={() => openStaffChat(conv.id)}
						>
							<div className="fw-semibold text-truncate small">
								{conv.lastMessage ? preview(conv.lastMessage, 30) : conv.name}
							</div>
						</button>
					))}
				</div>
			</div>
			<div
				className="flex-grow-1 d-flex flex-column"
				style={{ minWidth: 0, overflow: "hidden" }}
			>
				{activeConversation ? (
					<ChatView
						conversation={activeConversation}
						hideNav
						variant="assistant"
					/>
				) : (
					<div className="d-flex align-items-center justify-content-center h-100 text-muted">
						Start a new chat
					</div>
				)}
			</div>
			<style>{agentChatStyles}</style>
			<style>{assistantStyles}</style>
		</div>
	);
};

export default MyStaff;
