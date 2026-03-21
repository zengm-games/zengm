import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
	type UIMessage,
} from "ai";
import { useMemo, useRef, type FormEvent } from "react";
import type { AgentChatToolName } from "../../../common/agentChatTools.ts";
import { isSport } from "../../../common/index.ts";
import {
	serializeAgentGameState,
	type AgentGameContext,
} from "../../util/agentGameState.ts";
import {
	runAgentDraftPick,
	runAgentGetAvailablePlayers,
	runAgentGetPlayer,
	runAgentGetRoster,
	runAgentGetStandings,
	runAgentProposeTrade,
	runAgentReleasePlayer,
	runAgentSortRoster,
	runAgentUpdatePlayingTime,
} from "../../util/agentTools.ts";
import { useAgentChatUi } from "../../util/agentChatUi.ts";
import { useLocalPartial } from "../../util/index.ts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TOOL_LABELS: Record<AgentChatToolName, string> = {
	getStandings: "League standings",
	getRoster: "Roster",
	getAvailablePlayers: "Free agents",
	getPlayer: "Player profile",
	sortRoster: "Sort roster",
	updatePlayingTime: "Playing time",
	releasePlayer: "Release player",
	draftPick: "Draft pick",
	proposeTrade: "Propose trade",
};

const toolPartLabel = (partType: string) => {
	if (!partType.startsWith("tool-")) {
		return partType;
	}
	const name = partType.slice("tool-".length) as AgentChatToolName;
	return TOOL_LABELS[name] ?? name;
};

const toolStateMessage = (state: unknown) => {
	if (state === "input-streaming" || state === "input-available") {
		return "Preparing…";
	}
	if (state === "output-available") {
		return "Done";
	}
	if (state === "output-error") {
		return "Error";
	}
	return String(state);
};

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
			const label = toolPartLabel(part.type);
			const state = "state" in part ? toolStateMessage(part.state) : undefined;
			return (
				<div key={index} className="text-muted small py-1">
					{state && state !== "Done" ? (
						<span className="me-1" aria-hidden>
							…
						</span>
					) : null}
					{label}
					{state ? ` — ${state}` : ""}
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
				tool: AgentChatToolName;
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
				const name = toolCall.toolName as AgentChatToolName;

				const reply = async (output: unknown) => {
					void addOut({
						tool: name,
						toolCallId: toolCall.toolCallId,
						output,
					});
				};

				switch (toolCall.toolName) {
					case "getStandings": {
						const input = toolCall.input as { season?: number };
						await reply(await runAgentGetStandings(ctx, input));
						return;
					}
					case "getRoster": {
						const input = toolCall.input as { teamAbbrev?: string };
						await reply(await runAgentGetRoster(ctx, input));
						return;
					}
					case "getAvailablePlayers": {
						await reply(await runAgentGetAvailablePlayers());
						return;
					}
					case "getPlayer": {
						const input = toolCall.input as { pid: number };
						await reply(await runAgentGetPlayer(input));
						return;
					}
					case "sortRoster": {
						const input = toolCall.input as { pos?: string };
						await reply(await runAgentSortRoster(input));
						return;
					}
					case "updatePlayingTime": {
						const input = toolCall.input as {
							pid: number;
							ptModifier: "0" | "0.75" | "1" | "1.25" | "1.5";
						};
						await reply(await runAgentUpdatePlayingTime(input));
						return;
					}
					case "releasePlayer": {
						const input = toolCall.input as { pid: number };
						await reply(await runAgentReleasePlayer(ctx, input));
						return;
					}
					case "draftPick": {
						const input = toolCall.input as { pid: number };
						await reply(await runAgentDraftPick(ctx, input));
						return;
					}
					case "proposeTrade": {
						const input = toolCall.input as {
							otherTeamAbbrev: string;
							userPids?: number[];
							userDpids?: number[];
							otherPids?: number[];
							otherDpids?: number[];
						};
						await reply(await runAgentProposeTrade(ctx, input));
						return;
					}
					default:
						return;
				}
			},
		},
	);

	addToolOutputRef.current = addToolOutput;

	const handleSubmit = async (e: FormEvent) => {
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
