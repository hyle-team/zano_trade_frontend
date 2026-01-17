import Popup from '@/components/UI/Popup/Popup';
import successIcon from '@/assets/images/UI/success.svg?url';
import smallCrossIcon from '@/assets/images/UI/cross_icon_small.svg?url';
import errorIcon from '@/assets/images/UI/error.svg?url';
import AlertProps from '@/interfaces/props/components/UI/Alert/AlertProps';
import Preloader from '../Preloader/Preloader';
import styles from './Alert.module.scss';

function Alert(props: AlertProps) {
	const types = {
		success: {
			title: props.title || 'Success!',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={styles.ui__alert__success}>
					<img src={successIcon} alt="success"></img>
				</div>
			),
		},
		error: {
			title: props.title || 'Fail!',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={styles.ui__alert__error}>
					<img src={errorIcon} alt="error"></img>
				</div>
			),
		},
		loading: {
			title: props.title || 'Loading...',
			subtitle: props.subtitle || 'Lorem ipsum dolor sit amet',
			icon: (
				<div className={styles.ui__alert__loader}>
					<Preloader />
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
				<div className={styles.ui__alert}>
					{props.close && (
						<div className={styles.ui__alert__close} onClick={props.close}>
							<img src={smallCrossIcon} alt="close" />
						</div>
					)}
					{props.customContent}
				</div>
			);
		}

		if (currentType) {
			return (
				<div className={styles.ui__alert}>
					{props.close && (
						<div className={styles.ui__alert__close} onClick={props.close}>
							<img src={smallCrossIcon} alt="close" />
						</div>
					)}
					{currentType.icon}
					<div className={styles.ui__alert__data}>
						<h3>{currentType.title}</h3>
						{currentType.subtitle && <p>{currentType.subtitle}</p>}
						{props.type === 'custom' && props.children}
					</div>
				</div>
			);
		}

		return <></>;
	}

	return <Popup noPointer={true} Content={PopupContent} settings={{}} close={props.close} />;
}

export default Alert;
