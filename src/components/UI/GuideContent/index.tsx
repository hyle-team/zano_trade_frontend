import { useEffect } from 'react';
import { GuideContentProps } from './types';

function GuideContent({ onEnter, text }: GuideContentProps) {
	useEffect(() => {
		if (onEnter) onEnter();
	}, [onEnter]);

	return <p>{text}</p>;
}

export default GuideContent;
