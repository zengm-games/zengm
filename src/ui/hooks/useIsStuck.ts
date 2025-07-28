import { useEffect, useState } from "react";

export function useIsStuck(element: HTMLElement | null): boolean {
	const [isStuck, setIsStuck] = useState(false);

	useEffect(() => {
		if (!element) {
			return;
		}

		// This reads the "top" property from the element to see what cutoff to use for when sticky applies. Currently this assumes it's sticking relative to the window, might need more work for other situations.
		const topString = window.getComputedStyle(element).getPropertyValue("top");
		const top = topString.endsWith("px") ? Number.parseFloat(topString) : 0;

		const observer = new IntersectionObserver(
			([entry]) => {
				setIsStuck(entry!.boundingClientRect.top < entry!.rootBounds!.top);
			},
			{
				threshold: [1],
				rootMargin: `-${top + 1}px 0px 0px 0px`,
			},
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [element]);

	return isStuck;
}
