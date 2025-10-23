import clsx from "clsx";
import { useEffect, type RefObject } from "react";

// This mess is needed rather than `position: sticky` because https://github.com/w3c/csswg-drafts/issues/8286
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

		// Create fixed-position clone
		const clone = document.createElement("table");
		clone.className = clsx(table.className, className);
		clone.style.position = "fixed";
		//clone.style.top = `${HEADER_HEIGHT}px`;
		clone.style.zIndex = "9999";
		//clone.style.pointerEvents = "none";
		//clone.style.background = "var(--white)";
		clone.style.visibility = "hidden";
		clone.style.borderCollapse = getComputedStyle(table).borderCollapse;
		document.body.appendChild(clone);

		const syncWidths = () => {
			const thead = table.querySelector("thead");
			if (!thead) {
				return;
			}
			const theadClone = thead.cloneNode(true) as HTMLTableSectionElement;
			console.log(thead, theadClone);

			clone.innerHTML = "";
			clone.appendChild(theadClone);

			// Match table width
			const rect = table.getBoundingClientRect();
			clone.style.width = rect.width + "px";

			// Match column widths
			const origThs = table.querySelectorAll("thead th");
			const cloneThs = clone.querySelectorAll("thead th");
			for (const [i, th] of Array.from(origThs).entries()) {
				const width = th.getBoundingClientRect().width;
				if (cloneThs[i]) {
					cloneThs[i].style.width = `${width}px`;
				}
			}

			syncPosition();

			clone.style.visibility = "visible";
		};

		const syncPosition = () => {
			const rect = container.getBoundingClientRect();
			const top = Math.max(NAVBAR_HEIGHT, rect.top);
			clone.style.left = `${rect.left}px`;
			clone.style.top = `${top}px`;
			clone.style.width = `${table.offsetWidth}px`;
		};

		const syncScroll = () => {
			clone.style.transform = `translateX(${-container.scrollLeft}px)`;
		};

		const updateVisibility = () => {
			const rect = container.getBoundingClientRect();
			const visible = rect.bottom > 0 && rect.top < window.innerHeight;
			clone.style.display = visible ? "" : "none";
		};

		const resizeObserver = new ResizeObserver(syncWidths);
		resizeObserver.observe(table);

		container.addEventListener("scroll", syncScroll);
		window.addEventListener("scroll", syncPosition);
		window.addEventListener("resize", syncWidths);

		syncWidths();
		syncScroll();
		updateVisibility();

		return () => {
			container.removeEventListener("scroll", syncScroll);
			window.removeEventListener("scroll", syncPosition);
			window.removeEventListener("resize", syncWidths);
			resizeObserver.disconnect();
			clone.remove();
		};
	}, [containerRef, tableRef]);
};
