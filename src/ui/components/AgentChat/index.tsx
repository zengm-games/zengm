import { isSport } from "../../../common/index.ts";
import { useAgentChatUi } from "../../util/agentChatUi.ts";
import { useViewData } from "../../util/viewManager.tsx";
import ChatView from "./ChatView.tsx";
import InboxView from "./InboxView.tsx";
import NewDmView from "./NewDmView.tsx";

const EmptyState = () => {
	const openNewDm = useAgentChatUi((s) => s.openNewDm);
	return (
		<div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
			<div className="mb-3" style={{ fontSize: "3rem", opacity: 0.3 }}>
				💬
			</div>
			<h5 className="fw-semibold mb-1">Your messages</h5>
			<p className="text-muted small mb-3">
				Send a message to start a chat.
			</p>
			<button
				type="button"
				className="btn btn-primary"
				onClick={() => openNewDm()}
			>
				Send message
			</button>
		</div>
	);
};

export const AgentChatCore = ({ mode }: { mode: "panel" | "fullPage" }) => {
	const view = useAgentChatUi((s) => s.view);
	const activeConversationId = useAgentChatUi(
		(s) => s.activeConversationId,
	);
	const conversations = useAgentChatUi((s) => s.conversations);

	const activeConversation =
		conversations.find((c) => c.id === activeConversationId) ?? null;

	if (mode === "fullPage") {
		let mainContent: React.ReactNode;
		if (view === "chat" && activeConversation) {
			mainContent = (
				<ChatView conversation={activeConversation} hideNav />
			);
		} else if (view === "newDm") {
			mainContent = <NewDmView />;
		} else {
			mainContent = <EmptyState />;
		}

		return (
			<div className="agent-chat-full d-flex border rounded" style={{ height: "calc(100vh - 200px)" }}>
				<div className="agent-chat-sidebar border-end d-flex flex-column">
					<InboxView
						activeId={activeConversationId}
						showHeader
					/>
				</div>
				<div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, overflow: "hidden" }}>
					{mainContent}
				</div>
				<style>{agentChatStyles}</style>
			</div>
		);
	}

	let content: React.ReactNode;
	if (view === "chat" && activeConversation) {
		content = <ChatView conversation={activeConversation} />;
	} else if (view === "newDm") {
		content = <NewDmView />;
	} else {
		content = <InboxView />;
	}

	return (
		<div className="agent-chat-panel card shadow">
			{content}
			<style>{agentChatStyles}</style>
		</div>
	);
};

const agentChatStyles = `
	.agent-chat-sidebar {
		width: 320px;
		min-width: 320px;
		max-width: 320px;
	}
	.agent-chat-panel {
		position: fixed;
		right: 16px;
		bottom: 72px;
		width: min(420px, calc(100vw - 32px));
		height: min(520px, calc(100vh - 120px));
		z-index: 1040;
		display: flex;
		flex-direction: column;
	}
	.agent-chat-full {
		min-height: 60vh;
	}
	.agent-chat-messages {
		flex: 1;
		min-height: 0;
		max-height: 100%;
	}
	.agent-chat-msg.role-user .agent-chat-text {
		white-space: pre-wrap;
	}
	.agent-chat-md {
		font-size: 0.9375rem;
		line-height: 1.45;
	}
	.agent-chat-md :first-child {
		margin-top: 0;
	}
	.agent-chat-md :last-child {
		margin-bottom: 0;
	}
	.agent-chat-md p {
		margin: 0.35em 0;
	}
	.agent-chat-md h1,
	.agent-chat-md h2,
	.agent-chat-md h3,
	.agent-chat-md h4 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0.65em 0 0.35em;
	}
	.agent-chat-md ul,
	.agent-chat-md ol {
		margin: 0.35em 0;
		padding-left: 1.25rem;
	}
	.agent-chat-md li {
		margin: 0.15em 0;
	}
	.agent-chat-md strong {
		font-weight: 600;
	}
	.agent-chat-md a {
		word-break: break-word;
	}
	.agent-chat-md pre,
	.agent-chat-md code {
		font-size: 0.8125rem;
	}
	.agent-chat-md pre {
		margin: 0.5em 0;
		padding: 0.5rem;
		overflow-x: auto;
		border-radius: 0.25rem;
		background: var(--bs-secondary-bg, rgba(0, 0, 0, 0.05));
	}
`;

const AgentChat = () => {
	const open = useAgentChatUi((s) => s.open);
	const toggle = useAgentChatUi((s) => s.toggle);
	const pageID = useViewData((s) => s.idLoading ?? s.idLoaded);

	if (!isSport("basketball")) {
		return null;
	}

	if (pageID === "agentChat") {
		return null;
	}

	return (
		<>
			<button
				type="button"
				className="btn btn-primary shadow agent-chat-fab"
				onClick={() => toggle()}
				title="AI GM chat"
				aria-expanded={open}
			>
				AI
			</button>
			{open ? <AgentChatCore mode="panel" /> : null}
			<style>{`
				.agent-chat-fab {
					position: fixed;
					right: 16px;
					bottom: 16px;
					z-index: 1040;
					border-radius: 50%;
					width: 48px;
					height: 48px;
					padding: 0;
					line-height: 48px;
				}
			`}</style>
		</>
	);
};

export default AgentChat;
