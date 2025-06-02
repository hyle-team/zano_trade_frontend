import { FC } from 'react';
import { Switch as ANTDSwitch } from 'antd';

interface IProps {
	checked: boolean;
	onChange: (_checked: boolean) => void;
	disabled?: boolean;
}

export const Switch: FC<IProps> = ({ ...rest }) => <ANTDSwitch {...rest} />;