import styles from '@/styles/Policy.module.scss';
import Header from '@/components/default/Header/Header';
import Footer from '@/components/default/Footer/Footer';
import Link from 'next/link';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import { nanoid } from 'nanoid';

function Policy() {
	const contentList: string[] = Array(5).fill('Donec tellus felis, egestas ac tortor in;');

	return (
		<>
			<Header />
			<main className={`${styles.main} with-separators`}>
				{/* <div className={styles.policy__header}>
                    <div>
                        <h1>Privacy Policy</h1>
                        <p>Last updated: 29 January 2023</p>
                    </div>
                    <BackButton/>
                </div> */}

				<PageTitle>
					<h1>Privacy Policy</h1>
					<p className={styles.policy__title__description}>
						Last updated: 29 January 2023
					</p>
				</PageTitle>

				<div className={styles.policy__content}>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit.{' '}
						<Link href="/">In rutrum egestas arcu</Link>, et vehicula risus sagittis
						facilisis. Nulla cursus nec dolor vitae finibus. Proin id tellus id nisl
						interdum dignissim varius vitae turpis. Aliquam erat volutpat. Morbi ut
						massa luctus ligula auctor maximus. Phasellus non eleifend eros, at
						tristique nibh. Donec tellus felis, egestas ac tortor in, venenatis bibendum
						mauris. Morbi aliquam tortor sed neque dignissim cursus. Morbi vel vehicula
						risus, fermentum imperdiet est.{' '}
						<span className="bold">Praesent id egestas massa.</span> Maecenas lacinia
						vulputate nibh nec lacinia. Ut accumsan lacinia posuere. Suspendisse
						potenti. Sed gravida iaculis velit, id posuere augue pellentesque a.{' '}
						<span className="italics underline">Quisque id suscipit enim.</span> Ut
						varius elit lacus, sit amet ullamcorper odio egestas vitae.
						<br />
						<br />
						Vestibulum tellus odio, condimentum mattis enim eget, gravida tincidunt dui.
						In tempor pulvinar lacus sodales mollis. Cras at magna in nisi ullamcorper
						tincidunt. Nulla erat risus, efficitur ac bibendum eget, condimentum non
						leo. Suspendisse tellus erat, accumsan vitae enim eget, facilisis pharetra
						purus. Proin nec nulla purus. Fusce volutpat vitae nisl sed pretium. Nunc
						volutpat tincidunt lobortis. Nunc nec porttitor ipsum, quis euismod libero.
						Etiam vitae euismod sem. Curabitur sem turpis, iaculis suscipit accumsan
						quis, consectetur ac tellus. Donec tincidunt porta bibendum. Duis a auctor
						neque. Fusce ultrices faucibus egestas. Donec fringilla consectetur augue at
						tempus. <br />
						<br />
						Nunc sed sagittis ante. Nunc iaculis ligula at metus semper, in imperdiet
						sem pretium. Phasellus iaculis elit id ullamcorper accumsan. Ut tempor
						gravida augue vitae blandit. Nam ullamcorper luctus sodales. Duis vestibulum
						commodo tincidunt. Integer id sagittis velit, et tempor mi.
					</p>
					<h2>Header 2</h2>
					<h3>Header 3</h3>
					<h4>Header 4</h4>
					<h5>Header 5</h5>
					<h6>Header 6</h6>
					<p>
						Donec tellus felis, egestas ac tortor in, venenatis bibendum mauris. Morbi
						aliquam tortor sed neque dignissim cursus. Morbi vel vehicula risus,
						fermentum imperdiet est. Praesent id egestas massa. Maecenas lacinia
						vulputate nibh nec lacinia.
					</p>
					<ul>
						{contentList.map((e) => (
							<li key={nanoid(16)}>{e}</li>
						))}
					</ul>
				</div>
			</main>
			<Footer />
		</>
	);
}

export default Policy;
