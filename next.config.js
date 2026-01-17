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
