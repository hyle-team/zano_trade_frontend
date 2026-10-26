import { classes } from '@/utils/utils';
import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export const SwapArrowsIcon = (props: IconProps) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M7 4v15m0 0-3.5-3.5M7 19l3.5-3.5M17 20V5m0 0-3.5 3.5M17 5l3.5 3.5"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const ChevronDownIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="m6 9 6 6 6-6"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M19 12H5m0 0 6-6m-6 6 6 6"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const ArrowRightIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M5 12h14m0 0-6-6m6 6-6 6"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const SearchIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
		<path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

export const CloseIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M6 6l12 12M18 6 6 18"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

export const ShieldIcon = (props: IconProps) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M12 3 5 5.8v5.4c0 4.3 2.9 8.2 7 9.8 4.1-1.6 7-5.5 7-9.8V5.8L12 3Z"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinejoin="round"
		/>
		<path
			d="m9 12 2 2 4-4"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const PlusIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
	</svg>
);

export const TrashIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const CheckIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="m5 12.5 4.5 4.5L19 7.5"
			stroke="currentColor"
			strokeWidth="2.4"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const BellIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Zm4 11a2.2 2.2 0 0 0 4 0"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const MailIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
		<path
			d="m4 7 8 6 8-6"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const ClockIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
		<path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
	</svg>
);

export const LightningIcon = (props: IconProps) => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" />
	</svg>
);

export const InfoIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
		<path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

export const ChartIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M4 19h16M7 15v-4m5 4V7m5 8v-6"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

export const ListIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

export const ThemeIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M8 3.28C8 2.17543 7.08497 1.25018 6.02885 1.57373C3.27934 2.41607 1.28 4.97455 1.28 8C1.28 11.0255 3.27934 13.5839 6.02885 14.4263C7.08497 14.7498 8 13.8246 8 12.72V3.28ZM8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16Z"
			fill="currentColor"
		/>
	</svg>
);

export const UserIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<circle cx="12" cy="8" r="4" fill="currentColor" />
		<path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7v1H4v-1Z" fill="currentColor" />
	</svg>
);

export const LogoutIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const EyeIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
			stroke="currentColor"
			strokeWidth="1.8"
		/>
		<circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
	</svg>
);

export const EyeOffIcon = (props: IconProps) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M3 3l18 18M10.6 5.6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.5 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.4-.6 4.7-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
		/>
	</svg>
);

export const SlidersIcon = (props: IconProps) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M4 8h9M17 8h3M4 16h3M11 16h9"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
		/>
		<circle cx="15" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.8" />
		<circle cx="9" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.8" />
	</svg>
);

export const LockIcon = (props: IconProps) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<rect
			x="5"
			y="10.5"
			width="14"
			height="9.5"
			rx="2.5"
			stroke="currentColor"
			strokeWidth="1.8"
		/>
		<path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" stroke="currentColor" strokeWidth="1.8" />
	</svg>
);

export const ReloadIcon = (props: IconProps) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M19 12a7 7 0 1 1-2.05-4.95M19 5v4h-4"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const MessageIcon = (props: IconProps) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17.5H5A1.5 1.5 0 0 1 3.5 16V7A1.5 1.5 0 0 1 5 5.5Z"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinejoin="round"
		/>
		<path
			d="M8 10.5h8M8 13.5h5"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
		/>
	</svg>
);
