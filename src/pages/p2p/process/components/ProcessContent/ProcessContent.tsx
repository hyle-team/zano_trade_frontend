import depositSentIcon from '@/assets/images/UI/deposit_sent.svg?url';
import fundsConfirmedIcon from '@/assets/images/UI/funds_confirmed.svg?url';
import offerCanceledIcon from '@/assets/images/UI/offer_canceled.svg?url';
import Button from '@/components/UI/Button/Button';
import Messenger from '@/pages/p2p/process/components/Messenger/Messenger';
import PageTitle from '@/components/default/PageTitle/PageTitle';
import { nanoid } from 'nanoid';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getChat, getChatChunk } from '@/utils/methods';
import { intToStrFixedLen } from '@/utils/utils';
import { Store } from '@/store/store-reducer';
import socket from '@/utils/socket';
import DepositTitle from '@/components/UI/DepositTitle/DepositTitle';
import { ChatData, Message } from '@/interfaces/responses/chats/GetChatRes';
import DepositState from '@/interfaces/common/DepositState';
import styles from './ProcessContent.module.scss';

function ProcessContent() {
	const router = useRouter();

	const { state } = useContext(Store);

	const advices = [
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		'Vivamus suscipit, nisi vel consequat condimentum, diam est volutpat nisi, quis scelerisque dui odio non tellus. In sapien dolor, commodo et massa vel, placerat posuere enim.',
		'Donec et dapibus dolor. Ut vel ante aliquet, tempor lacus nec, varius neque. ',
		'Donec ac laoreet ligula, a aliquam lectus. Curabitur in gravida lacus. Vivamus porttitor nec velit vel vehicula. Aenean eget orci at urna efficitur semper. ',
		'Fusce scelerisque justo felis, laoreet laoreet magna egestas id. Pellentesque tempor tortor sit amet tortor pulvinar, vitae cursus arcu condimentum. ',
		'Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque imperdiet diam at metus imperdiet, ut lacinia magna commodo. Cras enim justo, vehicula sed tempus dictum, porttitor id nibh. ',
		'Nulla facilisi. Donec eleifend, tortor a aliquet lacinia, mauris odio viverra purus, vehicula suscipit diam odio at mauris...',
	];

	const [chatData, setChatData] = useState<ChatData | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);

	const isOwner =
		!!chatData &&
		!!state.user?.address &&
		chatData.creator_data?.address === state.user?.address;

	const isBuyer = !!chatData && isOwner === (chatData.type === 'sell');

	useEffect(() => {
		socket.emit('join', {
			token: sessionStorage.getItem('token') || null,
			chat_id: router.query.id,
		});
		console.log('Connected to socket');

		socket.on('check-connection', () => {
			socket.emit('submit-watched', {
				token: sessionStorage.getItem('token') || null,
				chat_id: router.query.id,
			});
		});

		return () => {
			console.log('Socket left');

			socket.off('check-connection');

			socket.emit('leave', {
				token: sessionStorage.getItem('token') || null,
				chat_id: router.query.id,
			});
		};
	}, []);

	const [sellerState, setSellerState] = useState<DepositState>(null); // default, deposit, confirmed, canceled
	const [buyerState, setBuyerState] = useState<DepositState>(null); // default, deposit, confirmed, canceled

	let finishState: 'confirmed' | 'canceled' | null = null;

	if (sellerState === 'confirmed' && buyerState === 'confirmed') {
		finishState = 'confirmed';
	} else if (
		(sellerState === 'canceled' && buyerState === 'canceled') ||
		(buyerState === 'canceled' && (sellerState === 'default' || sellerState === null)) ||
		(sellerState === 'canceled' && (buyerState === 'default' || buyerState === null))
	) {
		finishState = 'canceled';
	} else {
		finishState = null;
	}

	const myState = isBuyer ? buyerState : sellerState;

	const [scrollTrigger, setScrollTrigger] = useState(false);

	useEffect(() => {
		socket.on('new-message', (data) => {
			setMessages([...messages, data.message]);
			setScrollTrigger(!scrollTrigger);

			if (chatData && chatData.type && data.deposits_state) {
				if (data.deposits_state.fromOwner === (chatData.type === 'buy')) {
					setSellerState(data.deposits_state.state);
				} else {
					setBuyerState(data.deposits_state.state);
				}
			}
		});

		return () => {
			socket.off('new-message');
		};
	}, [messages]);

	useEffect(() => {
		async function getChatData() {
			if (!(typeof router.query.id === 'string')) return;
			const result = await getChat(router.query.id);

			console.log(result);

			if (!result || !result.success) {
				router.push('/');
			}

			const resultData = result.data as ChatData;

			setChatData(resultData);

			const chunkResult = await getChatChunk(router.query.id, 1);

			if (!chunkResult.success) router.push('/');

			setMessages(chunkResult.success ? chunkResult.data.reverse() : []);

			setScrollTrigger(!scrollTrigger);
		}

		getChatData();
	}, []);

	useEffect(() => {
		if (
			chatData &&
			chatData.owner_deposit !== undefined &&
			chatData.opponent_deposit !== undefined
		) {
			if (isOwner === isBuyer) {
				setBuyerState(chatData.owner_deposit || 'default');
				setSellerState(chatData.opponent_deposit || 'default');
			} else {
				setSellerState(chatData.owner_deposit || 'default');
				setBuyerState(chatData.opponent_deposit || 'default');
			}
		}
	}, [chatData]);

	function changeDepositState(depositState: DepositState) {
		socket.emit('change-deposit', {
			token: sessionStorage.getItem('token'),
			chat_id: router.query.id,
			deposit_state: depositState,
		});
	}

	const youPay = `${parseFloat((chatData?.pay || 0).toFixed(9)) || '...'} ${
		(chatData &&
			(chatData.type === 'sell'
				? chatData.input_currency?.name
				: chatData.target_currency?.name)) ||
		''
	}`;

	const youReceive = `${parseFloat((chatData?.receive || 0)?.toFixed(9)) || '...'} ${
		(chatData &&
			(chatData.type === 'sell'
				? chatData.target_currency?.name
				: chatData.input_currency?.name)) ||
		''
	}`;

	const chatType = chatData?.type === 'sell' ? 'Sell' : 'Buy';
	const secondChatType = chatData?.type === 'sell' ? 'Buy' : 'Sell';

	const chatTitle = `${isOwner ? secondChatType : chatType} ${chatData?.input_currency?.name || '...'}`;

	const alias = state.user?.address
		? (isOwner ? chatData.buyer_data?.alias : chatData?.creator_data?.alias) || ''
		: '';

	const address = state.user?.address
		? (isOwner ? chatData.buyer_data?.address : chatData?.creator_data?.address) || ''
		: '';

	return (
		<div className={styles.process__content}>
			<PageTitle>
				<h1>{chatData?.input_currency?.name ? chatTitle : '...'}</h1>
				<div className={styles.process__header__details}>
					<div>
						<p>Creation time</p>
						<p>
							{/* 2023-04-06 10:31:54 */}
							{(() => {
								if (!chatData?.timestamp) return;
								const date = new Date(parseInt(chatData.timestamp, 10));

								return `${intToStrFixedLen(date.getFullYear(), 4)}-${intToStrFixedLen(
									date.getMonth() + 1,
									2,
								)}-${intToStrFixedLen(date.getDate(), 2)} ${intToStrFixedLen(
									date.getHours(),
									2,
								)}:${intToStrFixedLen(date.getMinutes(), 2)}:${intToStrFixedLen(
									date.getSeconds(),
									2,
								)}`;
							})()}
						</p>
					</div>
					<div>
						<p>Order Number</p>
						<p>{chatData?.number || '...'}</p>
					</div>
					<div>
						<p>Status</p>
						<p>
							{(chatData &&
								(chatData.status === 'chatting' ? 'Chatting' : 'Finished')) ||
								'...'}
						</p>
					</div>
				</div>
			</PageTitle>

			<div className={styles.process__content__menu}>
				<div>
					<div className={styles.process__content__params}>
						<div>
							<p className={styles.content__params__title}>Price</p>
							<p
								className={`${styles.content__params__value} ${styles.content__params__amount}`}
							>
								{chatData?.price} {chatData?.target_currency?.name || '...'}
							</p>
						</div>
						<div>
							<p className={styles.content__params__title}>You pay</p>
							<p className={styles.content__params__value}>
								{!isOwner ? youPay : youReceive}
							</p>
						</div>
						<div>
							<p className={styles.content__params__title}>You receive</p>
							<p className={styles.content__params__value}>
								{!isOwner ? youReceive : youPay}
							</p>
						</div>
					</div>

					{chatData?.comment && (
						<div className={styles.process__content__comment}>
							<h6>Comment</h6>
							<p>{chatData.comment}</p>
						</div>
					)}

					<div className={styles.process__deposit__wrapper}>
						<div className={styles.process__content__deposit}>
							<div>
								<DepositTitle />
								{(() => {
									let elemsArr = [
										<div key={nanoid(16)}>
											<p>Seller{!isBuyer ? ' (You)' : ''}</p>
											<div>
												<p>
													{chatData?.deposit_seller || ''}{' '}
													{chatData?.deposit_currency?.name || '...'}
												</p>
												{sellerState && sellerState !== 'default' && (
													<img src={depositSentIcon} alt="sent" />
												)}
												{sellerState === 'confirmed' && (
													<img
														src={fundsConfirmedIcon}
														alt="confirmed"
													></img>
												)}
												{sellerState === 'canceled' && (
													<img
														src={offerCanceledIcon}
														alt="canceled"
													></img>
												)}
											</div>
										</div>,
										<div key={nanoid(16)}>
											<p>Buyer{isBuyer ? ' (You)' : ''}</p>
											<div>
												<p>
													{chatData?.deposit_buyer || ''}{' '}
													{chatData?.deposit_currency?.name || '...'}
												</p>
												{buyerState && buyerState !== 'default' && (
													<img src={depositSentIcon} alt="sent" />
												)}
												{buyerState === 'confirmed' && (
													<img
														src={fundsConfirmedIcon}
														alt="confirmed"
													></img>
												)}
												{buyerState === 'canceled' && (
													<img
														src={offerCanceledIcon}
														alt="canceled"
													></img>
												)}
											</div>
										</div>,
									];

									if (!isBuyer) {
										elemsArr = elemsArr.reverse();
									}

									return elemsArr;
								})()}

								{(myState === null || myState === 'default') && !finishState && (
									<Button onClick={() => changeDepositState('deposit')}>
										Make a Deposit (
										{isBuyer
											? chatData.deposit_buyer
											: chatData?.deposit_seller || ''}{' '}
										{chatData?.deposit_currency?.name || '...'})
									</Button>
								)}
								{!finishState &&
									(myState === 'deposit' || myState === 'canceled') && (
										<Button onClick={() => changeDepositState('confirmed')}>
											Confirm funds received
										</Button>
									)}
								{!finishState &&
									(myState === 'deposit' || myState === 'confirmed') && (
										<Button
											onClick={() => changeDepositState('canceled')}
											className={styles.deposit__cancel__btn}
										>
											Cancel funds and return deposit
										</Button>
									)}
								{finishState === 'confirmed' && (
									<p style={{ color: '#16D1D6' }}>
										The offer finished successfully.
										<br />
										The deposit returned.
									</p>
								)}

								{finishState === 'canceled' && (
									<p style={{ color: '#FF6767' }}>
										The offer was canceled.
										<br />
										The deposit returned.
									</p>
								)}
							</div>
						</div>
					</div>

					<div className={`${styles.process__content__advices} ${styles.window}`}>
						<h6>Advices</h6>
						<ol>
							{advices.map((e) => (
								<li key={nanoid(16)}>{e}</li>
							))}
						</ol>
					</div>
				</div>
				<Messenger
					chatId={typeof router.query.id === 'string' ? router.query.id : ''}
					isOwner={isOwner}
					value={messages}
					finishState={finishState}
					alias={alias}
					address={address}
					scrollTrigger={scrollTrigger}
					setValue={setMessages}
					maxChunks={chatData?.chunk_count || 0}
				/>
			</div>
		</div>
	);
}

export default ProcessContent;
