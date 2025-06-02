import * as ReactDOM from 'react-dom';
import { useEffect, useState } from 'react';
import PopupProps from '@/interfaces/props/components/UI/Popup/PopupProps';
import styles from './Popup.module.scss';

export default function Popup<ContentProps extends object>(props: PopupProps<ContentProps>) {
	const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);

	function getPopupElement() {
		const PopupContent = props.Content;
		return <PopupContent {...props.settings} close={props.close} />;
	}

	useEffect(() => {
		if (!props.scroll) return;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'auto';
		};
	});

	useEffect(() => {
		if (!props.blur) return;

		function handleClick(e: MouseEvent) {
			if (e.target === popupContainer) props.close();
		}
		window.addEventListener('mousedown', handleClick);
		return () => window.removeEventListener('mousedown', handleClick);
	});

	useEffect(() => {
		const container = document.createElement('div');
		container.setAttribute('id', `popup${document.querySelectorAll('body > div').length}`);
		container.classList.add(styles.popup_background);
		if (props.blur) container.classList.add(styles.popup_blur);
		if (props.scroll) container.classList.add(styles.popup_scroll);
		if (props.noPointer) container.classList.add(styles.popup_no_pointer);
		if (props.classList) {
			for (const className of props.classList) {
				container.classList.add(className);
			}
		}
		setPopupContainer(container);
		document.body.appendChild(container);
		return () => {
			document.body.removeChild(container);
		};
	}, []);

	return popupContainer ? ReactDOM.createPortal(getPopupElement(), popupContainer) : <div></div>;
}
