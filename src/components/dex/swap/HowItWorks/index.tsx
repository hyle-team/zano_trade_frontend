import styles from './styles.module.scss';

const STEPS = [
	{
		title: 'Create an order',
		text: 'Pick an asset, enter the amount and keep the market price or set your own.',
	},
	{
		title: 'Get matched',
		text: 'We show you the best counter order. If there is none yet, wait or get notified.',
	},
	{
		title: 'Swap in your wallet',
		text: 'Apply the match and confirm the ionic swap in Zano Companion. No custody, no middleman.',
	},
];

const HowItWorks = () => (
	<section className={styles.how}>
		<h2 className={styles.how__title}>How it works</h2>
		<div className={styles.how__grid}>
			{STEPS.map((step, index) => (
				<div key={step.title} className={styles.how__item}>
					<span className={styles.how__index}>{index + 1}</span>
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</div>
			))}
		</div>
	</section>
);

export default HowItWorks;
