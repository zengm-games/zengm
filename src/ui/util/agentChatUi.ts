import type { UIMessage } from "ai";
import { create } from "zustand";

type AgentChatUiState = {
	open: boolean;
	setOpen: (open: boolean) => void;
	toggle: () => void;
	messages: UIMessage[];
	setMessages: (messages: UIMessage[]) => void;
};

export const useAgentChatUi = create<AgentChatUiState>((set) => ({
	open: false,
	setOpen: (open) => set({ open }),
	toggle: () => set((s) => ({ open: !s.open })),
	messages: [],
	setMessages: (messages) => set({ messages }),
}));
