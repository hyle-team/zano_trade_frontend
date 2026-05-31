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
					{
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
							"style-src 'self' 'unsafe-inline'",
							"img-src 'self' data: blob:",
							"font-src 'self'",
							"connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
							"media-src 'self'",
							"object-src 'none'",
							"frame-ancestors 'none'",
							"base-uri 'self'",
							"form-action 'self'",
							'upgrade-insecure-requests',
						].join('; '),
					},
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=63072000; includeSubDomains; preload',
					},
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'X-XSS-Protection', value: '1; mode=block' },
					{ key: 'Referrer-Policy', value: 'same-origin' },
					{
						key: 'Permissions-Policy',
						value: [
							'camera=()',
							'microphone=()',
							'display-capture=()',
							'fullscreen=()',
							'picture-in-picture=()',
							'speaker-selection=()',
							'geolocation=()',
							'payment=()',
							'usb=()',
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
