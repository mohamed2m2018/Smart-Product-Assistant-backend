const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SearchHistory = sequelize.define('SearchHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 500] // Query length validation
      }
    },
    resultsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'results_count'
    },
    executionTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'execution_time_ms'
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    errorType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'error_type'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address'
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    sortBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'sort_by'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for anonymous users
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    }
  }, {
    tableName: 'search_history',
    timestamps: true,
    indexes: [
      {
        fields: ['query']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['success']
      },
      {
        fields: ['results_count']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  SearchHistory.associate = (models) => {
    // Associate with User
    SearchHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return SearchHistory;
}; 