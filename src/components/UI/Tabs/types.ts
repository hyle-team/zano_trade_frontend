export type tabsType = {
	title: string;
	type: string;
	length?: number;
};

export interface TabsProps {
	value: tabsType;
	setValue: (_next: tabsType) => void;
	data: tabsType[];
}
