'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

type ImgWithFallbackProps = ImageProps & {
	fallbackSrc?: string;
	alt: string;
};

const ImgWithFallback = ({
	src,
	alt,
	fallbackSrc = '/tokens/token.png',
	...rest
}: ImgWithFallbackProps) => {
	const [imgSrc, setImgSrc] = useState(src);

	useEffect(() => {
		setImgSrc(src);
	}, [src]);

	return <Image {...rest} alt={alt} src={imgSrc} onError={() => setImgSrc(fallbackSrc)} />;
};

export default ImgWithFallback;
