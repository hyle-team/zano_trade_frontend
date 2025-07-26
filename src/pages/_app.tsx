import '@/styles/globals.scss';
import '@/styles/themes/light.scss';
import Head from 'next/head';
import { StoreProvider } from '@/store/store-reducer';
import NextApp, { AppContext, AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import GetConfigRes, { GetConfigResData } from '@/interfaces/responses/config/GetConfigRes';
import inter from '@/utils/font';
import PageHandler from './PageHandler';
import NotificationPopups from './NotificationPopups';

function App(data: AppProps & { config?: GetConfigResData }) {
	const { Component, pageProps } = data;
	return (
		<>
			<style jsx global>
				{`
					* {
						font-family: ${inter.style.fontFamily};
					}
				`}
			</style>
			<Head>
				<title>Zano Trade</title>
				<meta name="description" content="Peer-to-Peer Trading App on Zano blockchain" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1  user-scalable=no"
				/>
				<link rel="icon" href="/favicon.ico" />

				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://trade.zano.org/" />
				<meta property="og:title" content="Zano Trade" />
				<meta
					property="og:description"
					content="Peer-to-Peer Trading App on Zano blockchain"
				/>
				<meta property="og:image" content="social-banner.png" />

				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:url" content="https://trade.zano.org/" />
				<meta property="twitter:title" content="Zano Trade" />
				<meta
					property="twitter:description"
					content="Peer-to-Peer Trading App on Zano blockchain"
				/>
				<meta property="twitter:image" content="social-banner.png" />
			</Head>
			<StoreProvider>
				<ThemeProvider themes={['dark', 'light']} defaultTheme="dark">
					<Component {...pageProps} />
					<PageHandler config={data.config as GetConfigResData} />
					<NotificationPopups />
				</ThemeProvider>
			</StoreProvider>
		</>
	);
}

App.getInitialProps = async (context: AppContext) => {
	try {
		const pageProps = await NextApp.getInitialProps(context);

		const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/config`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		if (!configRes.ok) {
			console.error(`Failed to fetch config: ${configRes.status}`);
			return pageProps;
		}

		const configData = (await configRes.json()) as GetConfigRes;

		return {
			...pageProps,
			config: configData.data,
		};
	} catch (error) {
		console.error('Unable to fetch config data:', error);

		return NextApp.getInitialProps(context);
	}
};

export default App;
