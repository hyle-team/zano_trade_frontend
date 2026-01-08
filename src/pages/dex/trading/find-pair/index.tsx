import { GetServerSideProps } from 'next';

import { findPairID } from '@/utils/methods';
import styles from '@/styles/404.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getServerSideProps: GetServerSideProps = async (context) => {
	const { first, second } = context.query;

	if (!first || !second) {
		return {
			notFound: true, // Show a 404 page if parameters are missing
		};
	}

	try {
		const idFound = await findPairID(first as string, second as string, API_URL);

		console.log('ID found:', idFound);

		if (typeof idFound === 'number') {
			return {
				redirect: {
					destination: `/dex/trading/${idFound}`,
					permanent: false,
				},
			};
		}

		return {
			notFound: true,
		};
	} catch (error) {
		console.error('Error fetching pair ID:', error);
		return {
			props: {
				error: 'Failed to resolve the pair.',
			},
		};
	}
};

const Page = ({ error }: { error?: string }) => {
	return (
		<div>
			<h1 className={styles.title}>Error: {error}</h1>
		</div>
	);
};
export default Page;
