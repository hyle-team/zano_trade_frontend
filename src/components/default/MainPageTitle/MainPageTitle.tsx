import ArrowRight from '@/assets/images/UI/arrow_blue_right.svg';
import { Store } from '@/store/store-reducer';
import { useContext } from 'react';
import MainPageTitleProps from '@/interfaces/props/components/default/MainPageTitle/MainPageTitleProps';
import styles from './MainPageTitle.module.scss';

function MainPageTitle(props: MainPageTitleProps) {
	const { state } = useContext(Store);

	return (
		<div className={styles.title__wrapper}>
			<div>
				<h1>
					<span className="blue-text">{props.blue}</span>
					{props.white}
				</h1>
				{props.description && (
					<p className={styles.desktop__description}>{props.description}</p>
				)}

				<p className={styles.mobile__description}>
					{props.mobileDescription ?? props.description}
				</p>
			</div>

			{state.wallet?.connected && !!state.wallet?.address ? (
				props.children
			) : (
				<div className={styles.learn_more__button}>
					<p>Learn more</p>
					<ArrowRight />
				</div>
			)}
		</div>
	);
}

export default MainPageTitle;
