// pages/api/get-addresses.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		const upstreamResponse = await fetch('https://messenger.zano.org/api/get-addresses', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		const data = await upstreamResponse.json();
		return res.status(upstreamResponse.status).json(data);
	} catch (error) {
		console.error('❌ Proxy error:', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}
