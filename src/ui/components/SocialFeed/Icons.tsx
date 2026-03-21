const svgProps = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 18,
	height: 18,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
};

export const HeartIcon = ({ filled }: { filled?: boolean }) => (
	<svg {...svgProps} fill={filled ? "currentColor" : "none"}>
		<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
	</svg>
);

export const MessageIcon = () => (
	<svg {...svgProps}>
		<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
	</svg>
);

export const RepeatIcon = () => (
	<svg {...svgProps}>
		<path d="m17 2 4 4-4 4" />
		<path d="M3 11v-1a4 4 0 0 1 4-4h14" />
		<path d="m7 22-4-4 4-4" />
		<path d="M21 13v1a4 4 0 0 1-4 4H3" />
	</svg>
);

export const ShareIcon = () => (
	<svg {...svgProps}>
		<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
		<polyline points="16 6 12 2 8 6" />
		<line x1="12" x2="12" y1="2" y2="15" />
	</svg>
);

export const MoreIcon = () => (
	<svg {...svgProps}>
		<circle cx="12" cy="12" r="1" />
		<circle cx="19" cy="12" r="1" />
		<circle cx="5" cy="12" r="1" />
	</svg>
);

export const VerifiedIcon = () => (
	<svg {...svgProps} width={16} height={16} fill="#d35400" stroke="#d35400">
		<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
		<path d="m9 12 2 2 4-4" stroke="#fff" fill="none" />
	</svg>
);

export const HomeIcon = ({ size = 24 }: { size?: number }) => (
	<svg {...svgProps} width={size} height={size}>
		<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);

export const SearchIcon = ({ size = 24 }: { size?: number }) => (
	<svg {...svgProps} width={size} height={size}>
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	</svg>
);

export const BellIcon = ({ size = 24 }: { size?: number }) => (
	<svg {...svgProps} width={size} height={size}>
		<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
		<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
	</svg>
);

export const UserIcon = ({ size = 24 }: { size?: number }) => (
	<svg {...svgProps} width={size} height={size}>
		<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
		<circle cx="12" cy="7" r="4" />
	</svg>
);

export const UserPlusIcon = () => (
	<svg {...svgProps}>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<line x1="19" x2="19" y1="8" y2="14" />
		<line x1="22" x2="16" y1="11" y2="11" />
	</svg>
);

export const AtSignIcon = () => (
	<svg {...svgProps}>
		<circle cx="12" cy="12" r="4" />
		<path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
	</svg>
);

export const MapPinIcon = () => (
	<svg {...svgProps} width={16} height={16}>
		<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
		<circle cx="12" cy="10" r="3" />
	</svg>
);

export const LinkIcon = () => (
	<svg {...svgProps} width={16} height={16}>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	</svg>
);

export const CalendarIcon = () => (
	<svg {...svgProps} width={16} height={16}>
		<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
		<line x1="16" x2="16" y1="2" y2="6" />
		<line x1="8" x2="8" y1="2" y2="6" />
		<line x1="3" x2="21" y1="10" y2="10" />
	</svg>
);
