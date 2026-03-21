import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
	type UIMessage,
} from "ai";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { AgentChatToolName } from "../../../common/agentChatTools.ts";
import type { GmChatToolName } from "../../../common/gmChatTools.ts";
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
import {
	runGmAcceptTrade,
	runGmEvaluateTrade,
	runGmGetMyRoster,
	runGmGetUserTeamRoster,
} from "../../util/gmAgentTools.ts";
import {
	useAgentChatUi,
	type Conversation,
} from "../../util/agentChatUi.ts";
import { useLocalPartial } from "../../util/index.ts";
import TeamLogoInline from "../TeamLogoInline.tsx";
import {
	hasVisibleParts,
	hasVisibleText,
	renderMessageParts,
} from "./renderMessages.tsx";

export default function ChatView({
	conversation,
	hideNav,
	variant = "bubble",
}: {
	conversation: Conversation;
	hideNav?: boolean;
	variant?: "bubble" | "assistant";
}) {
	const setOpen = useAgentChatUi((s) => s.setOpen);
	const openInbox = useAgentChatUi((s) => s.openInbox);
	const getMessages = useAgentChatUi((s) => s.getMessages);
	const setMessages = useAgentChatUi((s) => s.setMessages);
	const updateConversationPreview = useAgentChatUi(
		(s) => s.updateConversationPreview,
	);

	const messages = getMessages(conversation.id);

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

	const isGm = conversation.type === "gm";
	const entityContext = conversation.entityContext;

	const transport = useMemo(
		() =>
			new DefaultChatTransport<UIMessage>({
				api: "/api/chat",
				body: () => {
					const gameContext = gameContextRef.current;
					return isGm
						? { gameContext, entityContext }
						: { gameContext };
				},
			}),
		[isGm, entityContext],
	);

	const addToolOutputRef = useRef<
		| ((args: {
				tool: string;
				toolCallId: string;
				output: unknown;
		  }) => void)
		| null
	>(null);

	const {
		messages: chatMessages,
		sendMessage,
		status,
		error,
		stop,
		addToolOutput,
	} = useChat({
		id: conversation.id,
		transport,
		messages,
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

			const reply = async (output: unknown) => {
				void addOut({
					tool: toolCall.toolName,
					toolCallId: toolCall.toolCallId,
					output,
				});
			};

			if (isGm && entityContext) {
				const gmName = toolCall.toolName as GmChatToolName;
				switch (gmName) {
					case "getMyRoster":
						await reply(await runGmGetMyRoster(entityContext, ctx));
						return;
					case "getUserTeamRoster":
						await reply(await runGmGetUserTeamRoster(ctx));
						return;
					case "evaluateTrade": {
						const input = toolCall.input as {
							myPids?: number[];
							myDpids?: number[];
							userPids?: number[];
							userDpids?: number[];
						};
						await reply(
							await runGmEvaluateTrade(entityContext, ctx, input),
						);
						return;
					}
					case "acceptTrade": {
						const input = toolCall.input as {
							myPids?: number[];
							myDpids?: number[];
							userPids?: number[];
							userDpids?: number[];
						};
						await reply(
							await runGmAcceptTrade(entityContext, ctx, input),
						);
						return;
					}
					default:
						return;
				}
			}

			const name = toolCall.toolName as AgentChatToolName;
			switch (name) {
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
	});

	addToolOutputRef.current = addToolOutput;

	useEffect(() => {
		if (chatMessages.length > 0) {
			setMessages(conversation.id, chatMessages);
			const last = chatMessages.at(-1);
			if (last) {
				const textPart = last.parts?.find((p) => p.type === "text");
				const preview =
					textPart && "text" in textPart
						? textPart.text.slice(0, 60)
						: "";
				updateConversationPreview(conversation.id, preview);
			}
		}
	}, [chatMessages, setMessages, conversation.id, updateConversationPreview]);

	const [pendingSend, setPendingSend] = useState(false);

	useEffect(() => {
		if (status === "streaming" || status === "ready") {
			setPendingSend(false);
		}
	}, [status]);

	const isThinking = (() => {
		if (pendingSend || status === "submitted") return true;
		if (status !== "streaming") return false;
		const lastMsg = chatMessages.at(-1);
		if (!lastMsg || lastMsg.role !== "assistant") return true;
		return !lastMsg.parts?.some(
			(p) => p.type === "text" && "text" in p && p.text.length > 0,
		);
	})();


	const messagesEndRef = useRef<HTMLDivElement>(null);
	const lastAssistantRef = useRef<HTMLDivElement>(null);
	const lastUserRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const prevMessageCount = useRef(chatMessages.length);
	const prevStatus = useRef(status);

	useEffect(() => {
		if (variant === "assistant") {
			const newMessage = chatMessages.length > prevMessageCount.current;
			prevMessageCount.current = chatMessages.length;

			const container = scrollContainerRef.current;
			const target = lastUserRef.current;
			if ((newMessage || isThinking) && container && target) {
				const targetTop = target.offsetTop - container.offsetTop;
				container.scrollTo({ top: targetTop, behavior: "smooth" });
			} else if (prevStatus.current === "streaming" && status === "ready") {
				lastAssistantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		} else {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
		prevStatus.current = status;
	}, [chatMessages, isThinking, variant, status]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const text = String(fd.get("message") ?? "").trim();
		if (!text) {
			return;
		}

		setPendingSend(true);
		await sendMessage({ text });
		form.reset();
	};

	const headerName = isGm ? conversation.name : "My Staff";
	const placeholder = isGm
		? `Message ${conversation.name}...`
		: "Ask about your team...";

	const gmTeamInfo =
		isGm && entityContext
			? local.teamInfoCache[entityContext.tid]
			: undefined;

	return (
		<div className="d-flex flex-column h-100">
			{!hideNav && (
				<div className="d-flex align-items-center gap-2 border-bottom px-2 py-2">
					<button
						type="button"
						className="btn btn-sm btn-outline-secondary"
						onClick={() => openInbox()}
					>
						←
					</button>
					{gmTeamInfo ? (
						<TeamLogoInline
							imgURL={gmTeamInfo.imgURL}
							imgURLSmall={gmTeamInfo.imgURLSmall}
							size={20}
						/>
					) : null}
					<span className="fw-semibold">{headerName}</span>
					<button
						type="button"
						className="btn-close ms-auto"
						aria-label="Close"
						onClick={() => setOpen(false)}
					/>
				</div>
			)}
			{hideNav && (
				<div className="agent-chat-header d-flex align-items-center gap-2 border-bottom px-3">
					{gmTeamInfo ? (
						<TeamLogoInline
							imgURL={gmTeamInfo.imgURL}
							imgURLSmall={gmTeamInfo.imgURLSmall}
							size={20}
						/>
					) : null}
					<span className="fw-semibold">{headerName}</span>
				</div>
			)}
			{variant === "assistant" ? (
			<>
			<div ref={scrollContainerRef} className="overflow-auto agent-chat-messages flex-grow-1">
				<div className="agent-assistant-thread mx-auto px-3 py-3">
				{error ? (
					<div className="alert alert-warning py-2 small" role="alert">
						{error.message}
					</div>
				) : null}
				{chatMessages.map((m, i) => {
					const isUser = m.role === "user";
					const isLastUser = isUser && !chatMessages.slice(i + 1).some((mm) => mm.role === "user");
					const isLastAssistant = !isUser && !chatMessages.slice(i + 1).some((mm) => mm.role === "assistant");
					const isCurrentResponse = isLastAssistant && chatMessages.at(-1) === m;

					if (!isUser && !hasVisibleParts(m) && !isCurrentResponse) {
						return null;
					}

					if (isUser) {
						return (
							<div
								key={m.id}
								ref={isLastUser ? lastUserRef : undefined}
								className="agent-assistant-msg agent-assistant-msg-user"
							>
								<div className="agent-assistant-user-text">
									{renderMessageParts(m, status === "streaming")}
								</div>
							</div>
						);
					}

					return (
						<div
							key={m.id}
							ref={isLastAssistant ? lastAssistantRef : undefined}
							className="agent-assistant-msg agent-assistant-msg-ai"
						>
							<div className="agent-assistant-role fw-semibold small text-muted mb-1">My Staff</div>
							{isCurrentResponse && isThinking && (
								<div className="agent-chat-typing text-muted small fst-italic">
									Thinking…
								</div>
							)}
							{hasVisibleParts(m) && (
								<div>
									{renderMessageParts(m, status === "streaming")}
								</div>
							)}
						</div>
					);
				})}
				{isThinking && chatMessages.at(-1)?.role !== "assistant" ? (
					<div className="agent-assistant-msg agent-assistant-msg-ai">
						<div className="agent-assistant-role fw-semibold small text-muted mb-1">My Staff</div>
						<div className="agent-chat-typing text-muted small fst-italic">
							Thinking…
						</div>
					</div>
				) : null}
				<div ref={messagesEndRef} />
				</div>
			</div>
			<div className="agent-assistant-input-area border-top">
				<form onSubmit={handleSubmit} className="agent-assistant-input mx-auto d-flex align-items-center gap-2 px-3 py-3">
					<input
						type="text"
						name="message"
						className="form-control"
						placeholder={placeholder}
						disabled={status !== "ready"}
						autoComplete="off"
					/>
					{status === "streaming" ? (
						<button
							type="button"
							className="btn btn-outline-secondary flex-shrink-0"
							onClick={() => void stop()}
						>
							Stop
						</button>
					) : (
						<button
							type="submit"
							className="btn btn-primary flex-shrink-0"
							disabled={status !== "ready"}
						>
							Send
						</button>
					)}
				</form>
			</div>
			</>
		) : (
			<>
			<div className="overflow-auto agent-chat-messages flex-grow-1 p-2">
				{error ? (
					<div className="alert alert-warning py-2 small" role="alert">
						{error.message}
					</div>
				) : null}
		{chatMessages.map((m) => {
			if (m.role === "assistant" && !hasVisibleText(m)) {
				return null;
			}
			const isUser = m.role === "user";
			return (
				<div
					key={m.id}
					className={`mb-2 agent-chat-msg role-${m.role} d-flex ${isUser ? "justify-content-end" : "justify-content-start"}`}
				>
					{!isUser && gmTeamInfo ? (
						<div className="agent-chat-avatar me-1 flex-shrink-0">
							<TeamLogoInline
								imgURL={gmTeamInfo.imgURL}
								imgURLSmall={gmTeamInfo.imgURLSmall}
								size={24}
							/>
						</div>
					) : null}
					<div className={`agent-chat-bubble ${isUser ? "agent-chat-bubble-user" : "agent-chat-bubble-assistant"}`}>
						{renderMessageParts(m, status === "streaming", { hideToolParts: true })}
					</div>
				</div>
			);
		})}
		{isThinking ? (
			<div className="mb-2 agent-chat-msg role-assistant d-flex justify-content-start">
				{gmTeamInfo ? (
					<div className="agent-chat-avatar me-1 flex-shrink-0">
						<TeamLogoInline
							imgURL={gmTeamInfo.imgURL}
							imgURLSmall={gmTeamInfo.imgURLSmall}
							size={24}
						/>
					</div>
				) : null}
				<div className="agent-chat-bubble agent-chat-bubble-assistant">
					<div className="agent-chat-typing text-muted small fst-italic">
						Typing…
					</div>
				</div>
			</div>
		) : null}
				<div ref={messagesEndRef} />
			</div>
			<div className="border-top px-2 py-2">
				<form onSubmit={handleSubmit} className="d-flex gap-2">
					<input
						type="text"
						name="message"
						className="form-control form-control-sm"
						placeholder={placeholder}
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
			</>
		)}
		</div>
	);
}
