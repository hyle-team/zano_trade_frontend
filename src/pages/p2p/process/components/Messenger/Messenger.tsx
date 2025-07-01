import Image from 'next/image';
import { ReactComponent as DetailsIcon } from '@/assets/images/UI/walletsettings_icon.svg';
import { ReactComponent as PlusIcon } from '@/assets/images/UI/plus.svg';
import sendIcon from '@/assets/images/UI/send.svg';
import crossSmallIcon from '@/assets/images/UI/cross_icon_small.svg';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import ProfileWidget from '@/components/UI/ProfileWidget/ProfileWidget';
import { DragEvent, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { intToStrFixedLen } from '@/utils/utils';
import socket from '@/utils/socket';
import MessengerProps from '@/interfaces/props/pages/p2p/process/components/Messenger/MessengerProps';
import MessageProps from '@/interfaces/props/pages/p2p/process/components/Messenger/MessageProps';
import { getChatChunk } from '@/utils/methods';
import Preloader from '@/components/UI/Preloader/Preloader';
import styles from './Messenger.module.scss';

function Messenger(props: MessengerProps) {
	const { alias } = props;
	const { address } = props;

	const { isOwner } = props;

	const messages = props.value;
	const setMessages = props.setValue;

	const { scrollTrigger } = props;

	const { maxChunks } = props;

	const { finishState } = props;

	const messengerRef = useRef<HTMLDivElement>(null);

	const [uploadedImages, setUploadedImages] = useState<string[]>([]);
	const [messageLoading, setMessageLoading] = useState(false);
	const [msgInputState, setMsgInputState] = useState('');

	const [messengerHeight, setMessengerHeight] = useState(0);

	useEffect(() => {
		messengerRef.current?.scrollTo(0, messengerRef.current?.scrollHeight);
	}, [scrollTrigger]);

	useEffect(() => {
		const newHeight = messengerRef.current?.scrollHeight;

		if (messengerHeight !== 0 && newHeight && messengerHeight < newHeight) {
			messengerRef.current.scrollTop += newHeight - messengerHeight;
		}

		if (newHeight) {
			setMessengerHeight(newHeight);
		}
	}, [messages]);

	async function createMessage() {
		setMessageLoading(true);

		if (msgInputState && msgInputState.length <= 10000) {
			socket.emit('create-message', {
				token: sessionStorage.getItem('token'),
				chat_id: props.chatId,
				message: {
					text: msgInputState,
				},
			});
		}

		if (!!uploadedImages.length && uploadedImages.length <= 3) {
			for (const image of uploadedImages) {
				socket.emit('create-message', {
					token: sessionStorage.getItem('token'),
					chat_id: props.chatId,
					message: {
						type: 'img',
						url: image,
					},
				});
				await new Promise<void>((resolve) => {
					setTimeout(() => {
						resolve();
					}, 1000);
				});
			}
		}

		setMsgInputState('');
		setUploadedImages([]);

		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
		setMessageLoading(false);
	}

	function messengerOnDrop(e: DragEvent<HTMLDivElement>) {
		e.preventDefault();
	}

	async function loadPicture(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files?.length) return;

		const file = e.target.files[0];

		const fileType = file.type;

		const correctImg =
			fileType === 'image/png' || fileType === 'image/jpeg' || fileType === 'image/webp';

		if (!correctImg) return;

		function convertToBase64(file: File) {
			return new Promise<string>((resolve, reject) => {
				const fileReader = new FileReader();
				fileReader.readAsDataURL(file);

				fileReader.onload = () => {
					resolve(fileReader.result?.toString() || '');
				};

				fileReader.onerror = (err) => {
					reject(err);
				};
			});
		}

		const base64 = await convertToBase64(file);

		setUploadedImages([...uploadedImages, base64]);
	}

	function Message(props: MessageProps) {
		const { messageInfo } = props;

		const timestamp = `${intToStrFixedLen(new Date(parseInt(messageInfo.timestamp, 10)).getHours())}:${intToStrFixedLen(new Date(parseInt(messageInfo.timestamp)).getMinutes())}`;

		return (
			<div
				className={`${styles.message} ${
					props.isSender ? styles.message__outcoming : styles.message__incoming
				} ${props.success ? styles.message__success : ''} ${
					props.fail ? styles.message__fail : ''
				}`}
			>
				<div className={styles.message__block}>
					{messageInfo.type !== 'img' ? (
						<p>{messageInfo.text}</p>
					) : (
						<img width={50} height={50} src={messageInfo.url} alt="message"></img>
					)}
				</div>
				<p className={styles.message__timestamp}>{timestamp}</p>
			</div>
		);
	}

	const fileInputRef = useRef<HTMLInputElement>(null);

	const [chunkLoading, setChunkLoading] = useState(false);

	const [chunkNumber, setChunkNumber] = useState(1);

	async function messengerScroll() {
		const scroll = messengerRef.current?.scrollTop;
		if (!chunkLoading && chunkNumber < maxChunks && scroll && scroll < 10) {
			setChunkLoading(true);
			const result = await getChatChunk(props.chatId, chunkNumber + 1);
			if (!result.success) return;
			setMessages([
				...result.data
					.reverse()
					.filter((e) => !messages.find((message) => message.id === e.id)),
				...messages,
			]);
			setChunkLoading(false);
			setChunkNumber(chunkNumber + 1);
		}
	}

	return (
		<div className={styles.messenger} onDrop={messengerOnDrop}>
			<div className={styles.messenger__header}>
				<ProfileWidget offerData={{ alias, address }} />
				<Button className={styles.messenger__header__details}>
					<div>
						<DetailsIcon />
					</div>
				</Button>
			</div>

			<div
				ref={messengerRef}
				className={`${styles.messenger__content} custom-scroll`}
				onScroll={messengerScroll}
			>
				<div>
					{chunkLoading && (
						<div className={styles.messenger__chunk__loader}>
							<Preloader />
						</div>
					)}
					{messages.map((e) =>
						!e.system ? (
							<Message
								key={nanoid(16)}
								success={e.success}
								fail={e.fail}
								isSender={isOwner === e.fromOwner}
								messageInfo={e}
							/>
						) : (
							<div key={nanoid(16)} className={styles.messenger__finish}>
								<p>{e.text}</p>
							</div>
						),
					)}
				</div>
				{finishState && (
					<div className={styles.messenger__finish}>
						<p>The offer {finishState === 'confirmed' ? 'finished' : 'canceled'}</p>
					</div>
				)}
			</div>

			{!!uploadedImages.length && (
				<div className={styles.messenger__images}>
					{uploadedImages.map((e, i) => (
						<div key={nanoid(16)}>
							<Image width={50} height={50} src={e} alt="load"></Image>
							<div
								className={styles.messenger__images__delete}
								onClick={() =>
									setUploadedImages(
										uploadedImages.filter((elem, index) => i !== index),
									)
								}
							>
								<img src={crossSmallIcon} alt="delete"></img>
							</div>
						</div>
					))}
				</div>
			)}

			<div className={styles.messenger__panel + (messageLoading ? ' disabled' : '')}>
				<Input
					disabled={!!finishState}
					onKeyDown={(e) => e.keyCode === 13 && createMessage()}
					value={msgInputState}
					onInput={(e) => setMsgInputState(e.target.value)}
					bordered={true}
					placeholder="Message..."
					maxLength={10000}
				/>
				<Button
					disabled={!!finishState}
					className={styles.messenger__plus__btn}
					onClick={() => {
						if (uploadedImages.length < 3) fileInputRef.current?.click();
					}}
				>
					<PlusIcon className="stroked" />
				</Button>
				<input
					type="file"
					onChange={(e) => {
						if (uploadedImages.length < 3) loadPicture(e);
					}}
					style={{ display: 'none' }}
					ref={fileInputRef}
				/>
				<Button
					onClick={createMessage}
					className={styles.messenger__send__btn}
					disabled={!!finishState}
				>
					<img src={sendIcon} alt="send"></img>
				</Button>
			</div>
		</div>
	);
}

export default Messenger;
