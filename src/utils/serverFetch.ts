import type { IncomingMessage } from 'http';
import { BFF_CLIENT_IP_SIG_HEADER, computeClientIpSignature } from '@/utils/ipSignature';

const { TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY } = process.env;

export interface ServerFetchOptions extends RequestInit {
	/**
	 * The `x-forwarded-for` chain of the incoming request handled by this BFF
	 * (Vercel server function). Read it from the `getServerSideProps` /
	 * `getInitialProps` request via `getForwardedFor(ctx.req)`.
	 */
	xForwardedFor?: string;
}

/**
 * Reads the `x-forwarded-for` header from an incoming SSR request as a string.
 */
export function getForwardedFor(req: IncomingMessage): string | undefined {
	const raw = req.headers['x-forwarded-for'];
	return Array.isArray(raw) ? raw.join(', ') : raw;
}

/**
 * `fetch` wrapper for server-side (SSR) calls to the backend that bypass the API
 * proxy middleware. It re-attaches the incoming `X-Forwarded-For` chain and signs
 * the client IP exactly like `apiProxy.middleware.ts` does for proxied requests.
 */
export async function serverFetch(
	url: string,
	{ xForwardedFor, ...options }: ServerFetchOptions = {},
): Promise<Response> {
	if (!xForwardedFor || TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY === undefined) {
		throw new Error('Missing x-forwarded-for header or TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY');
	}

	const outgoingHeaders = new Headers(options.headers);
	outgoingHeaders.set('X-Forwarded-For', xForwardedFor);

	const { pathname } = new URL(url);
	const method = options.method ?? 'GET';

	const signature = await computeClientIpSignature({
		xForwardedFor,
		method,
		pathname,
		secret: TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY,
	});
	outgoingHeaders.set(BFF_CLIENT_IP_SIG_HEADER, signature);

	return fetch(url, {
		...options,
		headers: outgoingHeaders,
		cache: 'no-store',
	});
}
