import React from 'react';
import { Table, Button, Form, Input, FormInstance } from 'antd';
import { ColumnsType } from 'antd/es/table';
import styles from './styles.module.scss';

interface Admin {
	alias: string;
	isOwner: boolean;
	key: number;
}

interface AdminsProps {
	admins: Admin[];
	removeAdmin: (_key: number) => void;
	addAdmin: (_values: { alias: string }) => void;
	form: FormInstance;
}

const Admins: React.FC<AdminsProps> = ({ admins, removeAdmin, addAdmin, form }) => {
	const columns: ColumnsType<Admin> = [
		{
			title: 'Alias',
			dataIndex: 'alias',
			key: 'alias',
		},
		{
			title: 'Is Owner',
			dataIndex: 'isOwner',
			key: 'isOwner',
			render: (text) => (text ? 'Owner' : 'Admin'),
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<Button
					className={styles.admin__table_btn}
					type="primary"
					style={{ background: '#FF6767', opacity: record.isOwner ? 0.5 : 1 }}
					onClick={() => removeAdmin(record.key)}
					disabled={record.isOwner}
				>
					Delete
				</Button>
			),
		},
	];

	return (
		<div>
			<h2 className={styles.admin__subtitle}>Admins</h2>
			<div className={styles.admin__form}>
				<Form size="large" layout="inline" form={form} onFinish={addAdmin}>
					<Form.Item
						name="alias"
						rules={[{ required: true, message: 'Alias is required' }]}
					>
						<Input className={styles.admin__form_input} placeholder="Enter Alias" />
					</Form.Item>
					<Form.Item>
						<Button className={styles.admin__form_btn} type="primary" htmlType="submit">
							Add To Admins
						</Button>
					</Form.Item>
				</Form>
			</div>

			<Table
				className={styles.admin__table}
				dataSource={admins}
				columns={columns}
				pagination={false}
				bordered
				rowKey="key"
			/>
		</div>
	);
};

export default Admins;
