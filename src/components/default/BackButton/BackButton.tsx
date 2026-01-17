import ArrowWhiteIcon from '@/assets/images/UI/arrow_white.svg';
import Button from '@/components/UI/Button/Button';
import { useRouter } from 'next/router';
import { classes } from '@/utils/utils';
import styles from './BackButton.module.scss';
import { BackButtonProps } from './types';

function BackButton({ className, isSm }: BackButtonProps) {
	const router = useRouter();

	return (
		<Button
			className={classes(styles.back_btn, className, isSm && styles.sm)}
			transparent={true}
			onClick={router.back}
		>
			<ArrowWhiteIcon />
			<span>Back</span>
		</Button>
	);
}

export default BackButton;
