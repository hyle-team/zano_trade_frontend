import Popup from '@/components/UI/Popup/Popup';
import AlertProps from '@/interfaces/props/components/UI/Alert/AlertProps';
import { classes } from '@/utils/utils';
import { figtree } from '@/utils/font';
import LoadingIcon from '@/assets/images/UI/alert/loading.svg';
import SuccessIcon from '@/assets/images/UI/alert/success.svg';
import ErrorIcon from '@/assets/images/UI/alert/error.svg';
import CloseIcon from '@/assets/images/UI/alert/close.svg';
import styles from './Alert.module.scss';

function Alert(props: AlertProps) {
	const types = {
		success: {
			title: props.title || 'Success!',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={styles.ui__alert__icon}>
					<SuccessIcon />
				</div>
			),
		},
		error: {
			title: props.title || 'Fail!',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={styles.ui__alert__icon}>
					<ErrorIcon />
				</div>
			),
		},
		loading: {
			title: props.title || 'Loading...',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={classes(styles.ui__alert__icon, styles.ui__alert__loading)}>
					<LoadingIcon />
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

	function PopupContent() {
		if (props.type === 'custom' && props.customContent) {
			return (
				<div className={classes(styles.ui__alert, figtree.variable)} role="status">
					{props.customContent}
					{props.close && (
						<button
							type="button"
							className={styles.ui__alert__close}
							onClick={props.close}
							aria-label="Close"
						>
							<CloseIcon />
						</button>
					)}
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
					{props.close && (
						<button
							type="button"
							className={styles.ui__alert__close}
							onClick={props.close}
							aria-label="Close"
						>
							<CloseIcon />
						</button>
					)}
				</div>
			);
		}

		return <></>;
	}

	return <Popup noPointer={true} Content={PopupContent} settings={{}} close={props.close} />;
}

export default Alert;
