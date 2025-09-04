export type tabsType = {
	title: string;
	type: string;
	length?: number;
};

export interface TabsProps {
	type?: 'tab' | 'button';
	value: tabsType;
	setValue: (_next: tabsType) => void;
	data: tabsType[];
}
