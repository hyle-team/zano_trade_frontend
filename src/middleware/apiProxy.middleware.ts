import { NextRequest, NextResponse } from 'next/server';
import { BFF_CLIENT_IP_SIG_HEADER, computeClientIpSignature } from '@/utils/ipSignature';

const { TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY } = process.env;

export async function handleApiProxy(request: NextRequest): Promise<NextResponse> {
	const xForwardedFor = request.headers.get('x-forwarded-for');

	if (!TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY || !xForwardedFor) {
		throw new Error('Missing x-forwarded-for header or TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY');
	}

	const ipSignature = await computeClientIpSignature({
		xForwardedFor,
		method: request.method,
		pathname: request.nextUrl.pathname,
		secret: TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY,
	});

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(BFF_CLIENT_IP_SIG_HEADER, ipSignature);

	return NextResponse.next({ request: { headers: requestHeaders } });
}
