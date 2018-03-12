module.exports = (sequelize, DataTypes) =>
{
	// define the 'Cache' table
	const Cache = sequelize.define('Cache',
	{
		// the actual NANP number
		id:
		{
			type: DataTypes.STRING(10),
			primaryKey: true,
			allowNull: false,
			validate:
			{
				// uses the same regex here as in the route validation
				// just in case we circumvent it somehow...
				// includes the opencnam test number for test purposes
				is: /^(5551234567|([2-9][0-8][0-9])([2-9][0-9]{2})([0-9]{4}))$/ig
			}
		},
		// this should be the JSON result from the CNAM provider
		result:
		{
			type: DataTypes.STRING(2048),
			allowNull: false
		}
	},
	{
		// this will add a 'createdAt' field to the table
		// and fill it when an item is created
		timestamps: true,
		// since it is a cache, I don't need the updatedAt
		updatedAt: false,
		// we could change this to true if we want to only
		// add a deletedAt field that gets filled insted of actually
		// deleting the row
		paranoid: false,
		// this table does not need to be pluralized
		freezeTableName: true
	});

	return Cache;
};
