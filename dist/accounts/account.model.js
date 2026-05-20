"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    const attributes = {
        email: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
        passwordHash: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        firstName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        lastName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        role: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'User' },
        isVerified: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        verificationToken: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        resetToken: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        resetTokenExpires: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    };
    const options = {
        sequelize,
        modelName: 'Account',
        tableName: 'accounts',
        timestamps: true,
        defaultScope: {
            attributes: { exclude: ['passwordHash'] }
        },
        scopes: {
            withHash: {
                attributes: { include: ['passwordHash'] }
            }
        }
    };
    class Account extends sequelize_1.Model {
    }
    Account.init(attributes, options);
    return Account;
}
