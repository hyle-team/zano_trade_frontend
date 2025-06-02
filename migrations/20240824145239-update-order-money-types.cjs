'use strict';

async function updateColumnType(queryInterface, table, column, type, transaction) {
	await queryInterface.changeColumn(
		table,
		column,
		{
			type: `${type} USING CAST("${column}" as ${type})`,
		},
		{ transaction },
	);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await updateColumnType(queryInterface, 'Orders', 'price', 'VARCHAR', transaction);
			await updateColumnType(queryInterface, 'Orders', 'amount', 'VARCHAR', transaction);
			await updateColumnType(queryInterface, 'Orders', 'total', 'VARCHAR', transaction);
			await updateColumnType(queryInterface, 'Orders', 'left', 'VARCHAR', transaction);

			await updateColumnType(
				queryInterface,
				'Transactions',
				'amount',
				'VARCHAR',
				transaction,
			);
		});
	},

	async down(queryInterface, Sequelize) {
		queryInterface.sequelize.transaction(async (transaction) => {
			await updateColumnType(
				queryInterface,
				'Orders',
				'price',
				'DOUBLE PRECISION',
				transaction,
			);
			await updateColumnType(
				queryInterface,
				'Orders',
				'amount',
				'DOUBLE PRECISION',
				transaction,
			);
			await updateColumnType(
				queryInterface,
				'Orders',
				'total',
				'DOUBLE PRECISION',
				transaction,
			);
			await updateColumnType(
				queryInterface,
				'Orders',
				'left',
				'DOUBLE PRECISION',
				transaction,
			);

			await updateColumnType(
				queryInterface,
				'Transactions',
				'amount',
				'DOUBLE PRECISION',
				transaction,
			);
		});
	},
};
