interface ApplyOrderData {
	id: string;
	connected_order_id: string;
	hex_raw_proposal: string;
	base_amount_in_atomics: string;
	quote_amount_in_atomics: string;
}

export default ApplyOrderData;
