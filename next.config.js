import { createSecureHeaders } from 'next-secure-headers';

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	async redirects() {
		return [
			{
				source: '/',
				destination: '/dex',
				permanent: false,
			},
			// {
			//   source: '/((?!maintenance).*)', // Match everything except "/maintenance"
			//   destination: '/maintenance',
			//   permanent: false,
			// },
		];
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					// Content-Security-Policy is set per-request in src/middleware.ts
					// (requires a dynamic nonce for script-src).
					...createSecureHeaders({
						forceHTTPSRedirect: false, // HSTS is set in nginx
						referrerPolicy: 'same-origin',
					}),
					{
						key: 'Permissions-Policy',
						value: [
							'camera=(self)', // video calls
							'microphone=(self)', // audio calls
							'display-capture=(self)', // screen sharing
							'fullscreen=(self)', // MediaPlayer and SlideViewer
							'picture-in-picture=(self)', // VideoPlayer PiP mode
							'speaker-selection=(self)', // call audio output device (setSinkId)
						].join(', '),
					},
				],
			},
		];
	},
	webpack: (config) => {
		config.module.rules.push({
			test: /\.svg$/i,
			resourceQuery: /url/, // *.svg?url
			type: 'asset/resource',
		});

		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			resourceQuery: { not: [/url/] },
			use: ['@svgr/webpack'],
		});

		return config;
	},
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
			},
		];
	},
};

export default nextConfig;
