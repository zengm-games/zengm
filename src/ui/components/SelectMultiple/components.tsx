import { Children, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { components, type MenuListProps, type OptionProps } from "react-select";

const DefaultItemHeight = 33;

// https://www.botsplash.com/post/optimize-your-react-select-component-to-smoothly-render-10k-data
export const CustomOption = ({ children, ...props }: OptionProps) => {
	// eslint-disable-next-line no-unused-vars
	const { onMouseMove, onMouseOver, ...rest } = props.innerProps;
	const newProps = { ...props, innerProps: rest };
	return <components.Option {...newProps}>{children}</components.Option>;
};

export const CustomMenuList = ({ children, maxHeight }: MenuListProps) => {
	const childrenArray = Children.toArray(children);
	const wrapperHeight =
		maxHeight < childrenArray.length * DefaultItemHeight
			? maxHeight
			: childrenArray.length * DefaultItemHeight;

	const parentRef = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: childrenArray.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => DefaultItemHeight,

		// Ideally would use smooth scroll on keyboard navigation, and no smooth scroll on initial load, but seems it must just be set once
		enableSmoothScroll: false,
	});

	const currentIndexFocused = useMemo(
		() => childrenArray.findIndex((child: any) => child?.props?.isFocused),
		[childrenArray],
	);
	const firstOpen = useRef(true);
	useEffect(() => {
		let align;
		if (firstOpen.current) {
			// For initial render of list
			align = "start";
			firstOpen.current = false;
		} else {
			// For scrolling with keyboard
			align = "auto";
		}

		rowVirtualizer.scrollToIndex(currentIndexFocused, {
			align,
		});
	}, [rowVirtualizer, currentIndexFocused]);

	return (
		<>
			<div
				ref={parentRef}
				style={{
					height: `${wrapperHeight + 6}px`,
					overflow: "auto",
				}}
			>
				<div
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						width: "100%",
						position: "relative",
					}}
				>
					{rowVirtualizer.getVirtualItems().map(virtualItem => (
						<div
							key={virtualItem.key}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							{childrenArray[virtualItem.index]}
						</div>
					))}
				</div>
			</div>
		</>
	);
};
