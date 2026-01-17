import clsx from "clsx";
import { useEffect, type RefObject } from "react";

// This mess is needed rather than `position: sticky` because https://github.com/w3c/csswg-drafts/issues/8286
// See useManualSticky for a simpler version of this
export const useStickyTableHeader = ({
	className,
	containerRef,
	stickyHeader,
	tableRef,
}: {
	className: string | undefined;
	containerRef: RefObject<HTMLElement | null>;
	stickyHeader?: boolean;
	tableRef: RefObject<HTMLTableElement | null>;
}) => {
	useEffect(() => {
		if (!stickyHeader) {
			return;
		}

		const container = containerRef.current;
		const table = tableRef.current;
		if (!container || !table) {
			return;
		}

		// 52px minus 1
		const NAVBAR_HEIGHT = 51;

		// Create fixed-position clone. In theory we could do without cloning and just move the actual header like in useManualSticky, but it was actually easier to get this working.
		const clone = document.createElement("table");
		clone.className = clsx(table.className, className);
		clone.style.position = "fixed";
		clone.style.zIndex = "1020";
		clone.style.display = "none";
		document.body.append(clone);

		let headerCloned = false;

		const syncWidths = () => {
			const origThs = table.querySelectorAll<HTMLTableCellElement>("thead th");
			let cloneThs = headerCloned
				? clone.querySelectorAll<HTMLTableCellElement>("thead th")
				: undefined;
			if (!headerCloned || origThs.length !== cloneThs?.length) {
				const thead = table.querySelector("thead");
				if (!thead) {
					return;
				}

				clone.innerHTML = "";
				clone.append(thead.cloneNode(true));
				headerCloned = true;

				cloneThs = clone.querySelectorAll<HTMLTableCellElement>("thead th");
			}

			// Match table width
			const rect = table.getBoundingClientRect();
			clone.style.width = rect.width + "px";

			// Match column widths
			for (const [i, th] of Array.from(origThs).entries()) {
				const width = th.getBoundingClientRect().width;
				if (cloneThs[i]) {
					cloneThs[i].style.width = `${width}px`;
				}
			}

			syncPosition();
		};

		const syncPosition = () => {
			const rect = container.getBoundingClientRect();
			const top = Math.max(NAVBAR_HEIGHT, rect.top);
			clone.style.left = `${rect.left}px`;
			clone.style.top = `${top}px`;
			clone.style.width = `${table.offsetWidth}px`;

			// "bottom > NAVBAR_HEIGHT" means "we haven't scrolled past the table yet", and "top <= NAVBAR_HEIGHT" means "header needs to be sticky now, because we have scrolled it under the navbar". These are the situations where we actually want to show the cloned sticky header.
			const visible = rect.bottom > NAVBAR_HEIGHT && rect.top <= NAVBAR_HEIGHT;
			clone.style.display = visible ? "" : "none";
		};

		const syncScroll = () => {
			clone.style.transform = `translateX(${-container.scrollLeft}px)`;
		};

		const resizeObserver = new ResizeObserver(syncWidths);
		resizeObserver.observe(table);

		container.addEventListener("scroll", syncScroll);
		window.addEventListener("scroll", syncPosition);
		window.addEventListener("optimizedResize", syncWidths);

		syncWidths(); // Also calls syncPosition
		syncScroll();

		return () => {
			container.removeEventListener("scroll", syncScroll);
			window.removeEventListener("scroll", syncPosition);
			window.removeEventListener("optimizedResize", syncWidths);
			resizeObserver.disconnect();
			clone.remove();
		};
	}, [className, containerRef, stickyHeader, tableRef]);
};
