import { ReactNode, useState, useRef, useEffect } from 'react';
import styles from './IconDropdown.module.scss';

interface IconDropdownProps {
	children: ReactNode;
	items: {
		content: ReactNode;
		onClick?: () => void;
		disabled?: boolean;
	}[];
	position?: 'left' | 'right' | 'center';
	className?: string;
	dropdownClassName?: string;
}

export const IconDropdown = ({
	children,
	items,
	position = 'left',
	className = '',
	dropdownClassName = '',
}: IconDropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={dropdownRef} className={`${styles.container} ${className}`}>
			<div
				className={styles.trigger}
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
			>
				{children}
			</div>

			{isOpen && (
				<div className={`${styles.dropdown} ${styles[position]} ${dropdownClassName}`}>
					{items.map((item, index) => (
						<div
							key={index}
							className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}
							onClick={() => {
								if (!item.disabled) {
									item.onClick?.();
									setIsOpen(false);
								}
							}}
						>
							{item.content}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
