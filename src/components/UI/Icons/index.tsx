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

export const SunIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
		<path
			d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
		/>
	</svg>
);

export const MoonIcon = (props: IconProps) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		{...props}
		className={classes('ui-icon', props.className)}
	>
		<path
			d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinejoin="round"
		/>
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
