import GuideRegistrator from '@/components/default/GuideRegistrator';
import GuideContent from '@/components/UI/GuideContent';
import { useMediaQuery } from '@/hook/useMediaQuery';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React from 'react';
import { Placement, Step } from 'react-joyride';

const DexGuide = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const isMobile = useMediaQuery(`(max-width: 620px)`);

	const getPlacement = (position: 'auto' | Placement | 'center' | undefined) => {
		if (isMobile) return 'auto';

		return position;
	};

	const changeTab = (name?: string) => {
		const params = new URLSearchParams(searchParams.toString());

		if (name) {
			params.set('tab', name);
		} else {
			params.delete('tab');
		}

		const qs = params.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname, undefined, {
			shallow: true,
			scroll: false,
		});
	};

	const steps: Step[] = [
		{
			target: '[data-tour="orders-pool"]',
			placement: getPlacement('right-start'),
			content: (
				<GuideContent text="This section displays the current buy and sell orders in the market. You can see the price, quantity, and total value, as well as the order book depth visualized with bars." />
			),
			disableBeacon: true,
		},
		{
			target: '[data-tour="input-panel"]',
			placement: getPlacement('left-start'),
			content: (
				<GuideContent text="Here you can place buy or sell orders. Set your price, choose the amount, and review the total cost before creating the order." />
			),
		},
		{
			target: '[data-tour="user-orders"]',
			placement: getPlacement('top-start'),
			content: (
				<GuideContent
					onEnter={() => changeTab()}
					text="This tab shows all of your active orders. You can track price, quantity, and cancel them anytime."
				/>
			),
		},
		{
			target: '[data-tour="user-orders"]',
			placement: getPlacement('top-start'),
			content: (
				<GuideContent
					onEnter={() => changeTab('matches')}
					text="Here you see orders that have been successfully matched and executed."
				/>
			),
		},
		{
			target: '[data-tour="user-orders"]',
			placement: getPlacement('top-start'),
			content: (
				<GuideContent
					onEnter={() => changeTab('requests')}
					text="This section lists your pending requests that are waiting for approval or fulfillment."
				/>
			),
		},
		{
			target: '[data-tour="user-orders"]',
			placement: getPlacement('top-start'),
			content: (
				<GuideContent
					onEnter={() => changeTab('offers')}
					text="In this tab you can find offers you’ve made to other traders that are not yet matched."
				/>
			),
		},
	];

	return (
		<>
			<GuideRegistrator name="dex-onboarding" steps={steps} />
		</>
	);
};

export default DexGuide;
