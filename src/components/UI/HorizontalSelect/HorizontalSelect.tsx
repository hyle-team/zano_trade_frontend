import Link from 'next/link';
import { nanoid } from 'nanoid';
import HorizontalSelectProps from '@/interfaces/props/components/UI/HorizontalSelect/HorizontalSelectProps';
import HorizontalSelectValue from '@/interfaces/common/HorizontalSelectValue';
import NotificationIndicator from '../NotificationIndicator/NotificationIndicator';
import styles from './HorizontalSelect.module.scss';

function HorizontalSelect<T extends HorizontalSelectValue>(props: HorizontalSelectProps<T>) {
	const { value } = props;
	const { setValue } = props;
	const { className } = props;

	return (
		<div
			style={props.withNotifications ? { paddingTop: '20px' } : {}}
			className={`${styles.horizontal_select} ${className || ''} ${props.isTab ? styles.tab : ''}`}
		>
			{props.body.map((e) => (
				<div key={nanoid(16)}>
					<Link
						href="/"
						onClick={(event) => {
							event.preventDefault();
							setValue(e);
						}}
						className={value?.code === e?.code ? styles.selected : ''}
					>
						{e?.name || ''}
					</Link>

					{props.withNotifications && (
						<div className={styles.profile__filters__notification}>
							<NotificationIndicator count={e.notifications} />
						</div>
					)}
				</div>
			))}
		</div>
	);
}

export default HorizontalSelect;
