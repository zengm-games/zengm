// These are defined here, rather than inline, so they have a stable identity and only run when the element is mounted, rather than on every render

export const focusOnMount = (element: HTMLElement | null) => {
	element?.focus();
};

export const selectOnMount = (element: HTMLInputElement | null) => {
	element?.select();
};
