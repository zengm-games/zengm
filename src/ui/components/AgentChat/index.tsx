import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
	type UIMessage,
} from "ai";
import { useMemo, useRef } from "react";
import { isSport } from "../../../common/index.ts";
import {
	serializeAgentGameState,
	type AgentGameContext,
} from "../../util/agentGameState.ts";
import {
	runAgentGetAvailablePlayers,
	runAgentGetRoster,
	runAgentGetStandings,
} from "../../util/agentTools.ts";
import { useLocalPartial } from "../../util/index.ts";
import { useAgentChatUi } from "../../util/agentChatUi.ts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const renderMessageParts = (message: UIMessage) => {
	if (!message.parts || message.parts.length === 0) {
		return null;
	}

	const useMarkdown = message.role === "assistant";

	return message.parts.map((part, index) => {
		if (part.type === "text") {
			if (useMarkdown) {
				return (
					<div key={index} className="agent-chat-text agent-chat-md">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{part.text}
						</ReactMarkdown>
					</div>
				);
			}

			return (
				<div key={index} className="agent-chat-text">
					{part.text}
				</div>
			);
		}

		if (part.type.startsWith("tool-")) {
			const label = part.type.replace("tool-", "");
			return (
				<div key={index} className="text-muted small py-1">
					Tool: {label}
					{"state" in part ? ` (${String(part.state)})` : ""}
				</div>
			);
		}

		return null;
	});
};

const AgentChat = () => {
	const open = useAgentChatUi((s) => s.open);
	const setOpen = useAgentChatUi((s) => s.setOpen);
	const toggle = useAgentChatUi((s) => s.toggle);

	const local = useLocalPartial([
		"phase",
		"phaseText",
		"season",
		"lid",
		"userTid",
		"userTids",
		"spectator",
		"teamInfoCache",
		"statusText",
	]);

	const gameContextRef = useRef<AgentGameContext>(
		serializeAgentGameState(local),
	);
	gameContextRef.current = serializeAgentGameState(local);

	const transport = useMemo(
		() =>
			new DefaultChatTransport<UIMessage>({
				api: "/api/chat",
				body: () => {
					const gameContext = gameContextRef.current;
					console.log("[AgentChat] /api/chat request gameContext", gameContext);
					return { gameContext };
				},
			}),
		[],
	);

	const addToolOutputRef = useRef<
		| ((args: {
				tool: "getStandings" | "getRoster" | "getAvailablePlayers";
				toolCallId: string;
				output: unknown;
		  }) => void)
		| null
	>(null);

	const { messages, sendMessage, status, error, stop, addToolOutput } = useChat(
		{
			transport,
			sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
			async onToolCall({ toolCall }) {
				if (toolCall.dynamic) {
					return;
				}

				const addOut = addToolOutputRef.current;
				if (!addOut) {
					return;
				}

				const ctx = gameContextRef.current;

				if (toolCall.toolName === "getStandings") {
					const input = toolCall.input as { season?: number };
					const output = await runAgentGetStandings(ctx, input);
					void addOut({
						tool: "getStandings",
						toolCallId: toolCall.toolCallId,
						output,
					});
					return;
				}

				if (toolCall.toolName === "getRoster") {
					const output = await runAgentGetRoster(ctx);
					void addOut({
						tool: "getRoster",
						toolCallId: toolCall.toolCallId,
						output,
					});
					return;
				}

				if (toolCall.toolName === "getAvailablePlayers") {
					const output = await runAgentGetAvailablePlayers();
					void addOut({
						tool: "getAvailablePlayers",
						toolCallId: toolCall.toolCallId,
						output,
					});
				}
			},
		},
	);

	addToolOutputRef.current = addToolOutput;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const text = String(fd.get("message") ?? "").trim();
		if (!text) {
			return;
		}

		await sendMessage({ text });
		form.reset();
	};

	if (!isSport("basketball")) {
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
			{open ? (
				<div className="agent-chat-panel card shadow">
					<div className="card-header d-flex align-items-center py-2">
						<span className="fw-semibold">AI GM</span>
						<button
							type="button"
							className="btn-close ms-auto"
							aria-label="Close"
							onClick={() => setOpen(false)}
						/>
					</div>
					<div className="card-body overflow-auto agent-chat-messages">
						{error ? (
							<div className="alert alert-warning py-2 small" role="alert">
								{error.message}
							</div>
						) : null}
						{messages.map((m) => (
							<div key={m.id} className={`mb-2 agent-chat-msg role-${m.role}`}>
								<div className="small text-muted text-uppercase">{m.role}</div>
								{renderMessageParts(m)}
							</div>
						))}
					</div>
					<div className="card-footer py-2">
						<form onSubmit={handleSubmit} className="d-flex gap-2">
							<input
								type="text"
								name="message"
								className="form-control form-control-sm"
								placeholder="Ask about your team..."
								disabled={status !== "ready"}
								autoComplete="off"
							/>
							<button
								type="submit"
								className="btn btn-sm btn-primary"
								disabled={status !== "ready"}
							>
								Send
							</button>
							{status === "streaming" ? (
								<button
									type="button"
									className="btn btn-sm btn-outline-secondary"
									onClick={() => void stop()}
								>
									Stop
								</button>
							) : null}
						</form>
					</div>
				</div>
			) : null}
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
			`}</style>
		</>
	);
};

export default AgentChat;
