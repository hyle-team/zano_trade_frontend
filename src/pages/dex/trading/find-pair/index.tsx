import { findPairID } from '@/utils/methods';
import { GetServerSideProps } from 'next';

const getServerSideProps: GetServerSideProps = async (context) => {
	const { first, second } = context.query;

	if (!first || !second) {
		return {
			notFound: true, // Show a 404 page if parameters are missing
		};
	}

	try {
		const idFound = await findPairID(
			first as string,
			second as string,
			context.req.headers.host as string,
		);

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

export default getServerSideProps;
