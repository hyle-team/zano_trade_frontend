import { useRouter } from 'next/router';

function DefaultPage() {
	const router = useRouter();
	router.push('/p2p');

	return <></>;
}

export default DefaultPage;
