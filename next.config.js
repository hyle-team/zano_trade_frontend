/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
	reactStrictMode: true,
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
							"style-src 'self' 'unsafe-inline'",
							"img-src 'self' data:",
							"font-src 'self' data:",
							"connect-src 'self' https://trade.zano.org ws: wss:",
						].join('; '),
					},
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=31536000; includeSubDomains',
					},
				],
			},
		];
	},
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
	webpack: (config) => {
		config.module.rules.push({
			test: /\.svg$/,
			use: ['@svgr/webpack', 'url-loader'],
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
