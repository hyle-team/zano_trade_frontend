import { Dispatch, SetStateAction } from 'react';

export type tabsType = {
	title: string;
	type: string;
	length?: number;
};

export interface TabsProps {
	value: tabsType;
	setValue: Dispatch<SetStateAction<tabsType>>;
	data: tabsType[];
}
