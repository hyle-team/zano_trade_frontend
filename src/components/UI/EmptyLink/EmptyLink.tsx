import EmptyLinkProps from '@/interfaces/props/components/UI/EmptyLink/EmptyLinkProps';
import Link from 'next/link';
import styles from './EmptyLink.module.scss';

function EmptyLink(props: EmptyLinkProps) {
	return (
		<Link
			href="/"
			onClick={(e) => e.preventDefault()}
			className={`${styles.empty_link} ${props.className}`}
		>
			{props.children}
		</Link>
	);
}

export default EmptyLink;
