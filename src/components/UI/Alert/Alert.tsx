import Popup from '@/components/UI/Popup/Popup';
import AlertProps from '@/interfaces/props/components/UI/Alert/AlertProps';
import { CheckIcon, CloseIcon } from '@/components/UI/Icons';
import { classes } from '@/utils/utils';
import { figtree } from '@/utils/font';
import Spinner from '@/components/UI/Spinner';
import styles from './Alert.module.scss';

function Alert(props: AlertProps) {
	const types = {
		success: {
			title: props.title || 'Success!',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={classes(styles.ui__alert__icon, styles.ui__alert__icon_success)}>
					<CheckIcon width={18} height={18} />
				</div>
			),
		},
		error: {
			title: props.title || 'Fail!',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={classes(styles.ui__alert__icon, styles.ui__alert__icon_error)}>
					<CloseIcon width={16} height={16} />
				</div>
			),
		},
		loading: {
			title: props.title || 'Loading...',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={classes(styles.ui__alert__icon, styles.ui__alert__icon_loading)}>
					<Spinner size="sm" />
				</div>
			),
		},
		custom: {
			title: props.title || '',
			subtitle: props.subtitle || '',
			icon: props.customIcon || null,
			content: props.customContent || null,
		},
		none: null,
	};

	const currentType = types[props.type || 'none'];

	if (!currentType) return null;

	const closeButton = props.close && (
		<button
			type="button"
			className={styles.ui__alert__close}
			onClick={props.close}
			aria-label="Close"
		>
			<CloseIcon width={14} height={14} />
		</button>
	);

	function PopupContent() {
		if (props.type === 'custom' && props.customContent) {
			return (
				<div className={classes(styles.ui__alert, figtree.variable)} role="status">
					{props.customContent}
					{closeButton}
				</div>
			);
		}

		if (currentType) {
			return (
				<div className={classes(styles.ui__alert, figtree.variable)} role="status">
					{currentType.icon}
					<div className={styles.ui__alert__data}>
						<h3>{currentType.title}</h3>
						{currentType.subtitle && <p>{currentType.subtitle}</p>}
						{props.type === 'custom' && props.children}
					</div>
					{closeButton}
				</div>
			);
		}

		return <></>;
	}

	return <Popup noPointer={true} Content={PopupContent} settings={{}} close={props.close} />;
}

export default Alert;
