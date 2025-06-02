import { ReactComponent as ArrowWhiteIcon } from '@/assets/images/UI/arrow_white.svg';
import Button from '@/components/UI/Button/Button';
import { useRouter } from 'next/router';
import styles from './BackButton.module.scss';

function BackButton() {
	const router = useRouter();

	return (
		<Button className={styles.back_btn} transparent={true} onClick={router.back}>
			{/* <img src={ArrowWhiteIcon} alt="arrow"/> */}
			<ArrowWhiteIcon />
			Back
		</Button>
	);
}

export default BackButton;
