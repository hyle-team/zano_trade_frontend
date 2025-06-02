import { ElementType } from 'react';

interface NavItemProps {
	title: string;
	routeKeyphrase: string;
	href: string;
	Img: ElementType;
	disabled?: boolean;
	notifications?: number;
}

export default NavItemProps;
