import React from 'react';
import { Table, Button, Input, Form, FormInstance } from 'antd';
import { ColumnsType } from 'antd/es/table';
import styles from './styles.module.scss';

interface FeaturedPair {
	name: string;
	key: number;
}

interface FeaturedPairsProps {
	featuredPairs: FeaturedPair[];
	form: FormInstance;
	addFeaturedPair: (_values: { asset_id: string }) => void;
	removeFeaturedPair: (_key: number) => void;
}

const FeaturedPairs: React.FC<FeaturedPairsProps> = ({
	featuredPairs,
	form,
	addFeaturedPair,
	removeFeaturedPair,
}) => {
	const columns: ColumnsType<FeaturedPair> = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<Button
					className={styles.admin__table_btn}
					type="primary"
					style={{ background: '#FF6767' }}
					onClick={() => removeFeaturedPair(record.key)}
				>
					Delete
				</Button>
			),
		},
	];

	return (
		<div>
			<h2 className={styles.admin__subtitle}>Featured pairs</h2>
			<div className={styles.admin__form}>
				<Form size="large" layout="inline" form={form} onFinish={addFeaturedPair}>
					<Form.Item
						name="asset_id"
						rules={[{ required: true, message: 'Asset ID is required' }]}
					>
						<Input className={styles.admin__form_input} placeholder="Enter Asset ID" />
					</Form.Item>
					<Form.Item>
						<Button className={styles.admin__form_btn} type="primary" htmlType="submit">
							Add To Featured
						</Button>
					</Form.Item>
				</Form>
			</div>

			<Table
				className={styles.admin__table}
				dataSource={featuredPairs}
				columns={columns}
				pagination={false}
				bordered
				rowKey="key"
			/>
		</div>
	);
};

export default FeaturedPairs;
