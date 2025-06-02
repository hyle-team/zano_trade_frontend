'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		queryInterface.addColumn('Users', 'exchange_notifications_amount', {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0,
		});
	},

	async down(queryInterface) {
		queryInterface.removeColumn('Users', 'exchange_notifications_amount');
	},
};
