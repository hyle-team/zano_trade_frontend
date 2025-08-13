import MatrixAddress from '@/interfaces/common/MatrixAddress';
import { PageOrderData } from '@/interfaces/responses/orders/GetOrdersPageRes';
import { getMatrixAddresses } from '@/utils/methods';
import { useEffect, useState } from 'react';

const useMatrixAddresses = (ordersHistory: PageOrderData[]) => {
	const [matrixAddresses, setMatrixAddresses] = useState<MatrixAddress[]>([]);

	useEffect(() => {
		const fetchConnections = async () => {
			const filteredAddresses = ordersHistory?.map((e) => e?.user?.address);
			if (!filteredAddresses.length) return;

			const data = await getMatrixAddresses(filteredAddresses);

			setMatrixAddresses(data.addresses);
		};

		fetchConnections();
	}, [ordersHistory]);

	return matrixAddresses;
};

export default useMatrixAddresses;
