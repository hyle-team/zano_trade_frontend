import { NextRequest, NextResponse } from 'next/server';

const backendURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const backendWSURL = backendURL.replace(/^http/, 'ws');
const isDev = process.env.NODE_ENV === 'development';

// Allow next-themes inline initialization script
const NEXT_THEMES_HASH = "'sha256-Kk3IGXdFX+72JM6rbRJ6+DoTOy47CdFNCnQpb2EUODg='";

export async function handlePagesProxy(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
	const cspHeader = `
    default-src 'self';
    script-src 'self'
	'nonce-${nonce}'
	${NEXT_THEMES_HASH}
	'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: ${backendURL};
    media-src 'self' blob: ${backendURL};
    connect-src 'self' ${backendURL} ${backendWSURL} https://explorer.zano.org;
    worker-src 'self' blob:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
	const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim();

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-nonce', nonce);
	requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});

	response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

	return response;
}
