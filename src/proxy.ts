import { NextRequest, NextResponse } from 'next/server';
import { handleApiProxy } from '@/middleware/apiProxy.middleware';
import { handlePagesProxy } from '@/middleware/pagesProxy.middleware';

export function proxy(request: NextRequest): Promise<NextResponse> {
	if (request.nextUrl.pathname.startsWith('/api')) {
		return handleApiProxy(request);
	}

	return handlePagesProxy(request);
}

export const config = {
	matcher: [
		{
			source: '/((?!_next/static|_next/image|favicon.ico).*)',
			missing: [
				{ type: 'header', key: 'next-router-prefetch' },
				{ type: 'header', key: 'purpose', value: 'prefetch' },
			],
		},
	],
};
