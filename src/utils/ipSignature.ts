import { SignJWT } from 'jose';

export const BFF_CLIENT_IP_SIG_HEADER = 'X-BFF-Client-IP-Sig';

export async function computeClientIpSignature({
	xForwardedFor,
	method,
	pathname,
	secret,
}: {
	xForwardedFor: string;
	method: string;
	pathname: string;
	secret: string;
}): Promise<string> {
	const ips = xForwardedFor.split(',').map((ip) => ip.trim());
	const ipIndex = ips.length - 1;
	const clientIp = ips[ipIndex];

	const secretKey = new TextEncoder().encode(secret);

	return new SignJWT({
		ip: clientIp,
		index: ipIndex,
		method: method.toUpperCase(),
		path: pathname,
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.sign(secretKey);
}
