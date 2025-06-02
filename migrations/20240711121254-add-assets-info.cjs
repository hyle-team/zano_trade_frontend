'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		queryInterface.addColumn('Currencies', 'asset_info', {
			type: Sequelize.JSONB,
			allowNull: true,
		});
	},

	async down(queryInterface, Sequelize) {
		queryInterface.removeColumn('Currencies', 'asset_info');
	},
};
