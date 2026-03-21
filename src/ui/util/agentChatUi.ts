import type { UIMessage } from "ai";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EntityContext = {
	tid: number;
	abbrev: string;
	region: string;
	name: string;
	strategy: "contending" | "rebuilding";
	won: number;
	lost: number;
};

export type Conversation = {
	id: string;
	type: "general" | "gm";
	name: string;
	lastMessage: string;
	updatedAt: number;
	entityContext?: EntityContext;
};

export type DmView = "inbox" | "chat" | "newDm";

const defaultGeneral: Conversation = {
	id: "general",
	type: "general",
	name: "My Staff",
	lastMessage: "",
	updatedAt: 0,
};

type AgentChatUiState = {
	open: boolean;
	setOpen: (open: boolean) => void;
	toggle: () => void;
	view: DmView;
	lid: number | undefined;
	syncLid: (currentLid: number | undefined) => void;
	conversations: Conversation[];
	activeConversationId: string | null;
	activeStaffChatId: string | null;
	messagesByConversation: Record<string, UIMessage[]>;
	openInbox: () => void;
	openConversation: (id: string) => void;
	openNewDm: () => void;
	openStaffChat: (id: string) => void;
	newStaffChat: () => void;
	upsertConversation: (conv: Conversation) => void;
	updateConversationPreview: (id: string, lastMessage: string) => void;
	getMessages: (id: string) => UIMessage[];
	setMessages: (id: string, messages: UIMessage[]) => void;
};

export const useAgentChatUi = create<AgentChatUiState>()(
	persist(
		(set, get) => ({
	open: false,
	setOpen: (open) => set({ open }),
	toggle: () =>
		set((s) => {
			const nextOpen = !s.open;
			return {
				open: nextOpen,
				...(nextOpen ? { view: "inbox" as const } : {}),
			};
		}),
	view: "inbox",
	lid: undefined,
	syncLid: (currentLid) =>
		set((s) => {
			if (currentLid === undefined || currentLid === s.lid) {
				return {};
			}
			return {
				lid: currentLid,
				conversations: [defaultGeneral],
				messagesByConversation: { general: [] },
				activeConversationId: null,
				activeStaffChatId: "general",
				view: "inbox" as const,
			};
		}),
	conversations: [defaultGeneral],
	activeConversationId: null,
	activeStaffChatId: "general",
	messagesByConversation: { general: [] },
	openInbox: () => set({ view: "inbox", activeConversationId: null }),
	openConversation: (id) => set({ view: "chat", activeConversationId: id }),
	openNewDm: () => set({ view: "newDm" }),
	openStaffChat: (id) => set({ activeStaffChatId: id }),
	newStaffChat: () => {
		const id = `staff-${Date.now()}`;
		const conv: Conversation = {
			id,
			type: "general",
			name: "New Chat",
			lastMessage: "",
			updatedAt: Date.now(),
		};
		set((s) => ({
			conversations: [...s.conversations, conv],
			messagesByConversation: { ...s.messagesByConversation, [id]: [] },
			activeStaffChatId: id,
		}));
	},
	upsertConversation: (conv) =>
		set((s) => {
			const idx = s.conversations.findIndex((c) => c.id === conv.id);
			let next: Conversation[];
			if (idx >= 0) {
				next = [...s.conversations];
				next[idx] = conv;
				return { conversations: next };
			}
			next = [...s.conversations, conv];
			if (next.length <= 4) {
				return { conversations: next };
			}
			const nonGeneral = next.filter((c) => c.id !== "general");
			const oldest = nonGeneral.reduce((a, b) =>
				a.updatedAt <= b.updatedAt ? a : b,
			);
			next = next.filter((c) => c.id !== oldest.id);
			return { conversations: next };
		}),
	updateConversationPreview: (id, lastMessage) =>
		set((s) => ({
			conversations: s.conversations.map((c) =>
				c.id === id
					? { ...c, lastMessage, updatedAt: Date.now() }
					: c,
			),
		})),
	getMessages: (id) => get().messagesByConversation[id] ?? [],
	setMessages: (id, messages) =>
		set((s) => ({
			messagesByConversation: {
				...s.messagesByConversation,
				[id]: messages,
			},
		})),
		}),
		{
			name: "agent-chat-history",
			partialize: (state) => ({
				lid: state.lid,
				conversations: state.conversations,
				activeStaffChatId: state.activeStaffChatId,
				messagesByConversation: state.messagesByConversation,
			}),
		},
	),
);
