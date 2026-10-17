import { Figtree, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const figtree = Figtree({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
	variable: '--font-figtree',
});

export default inter;
