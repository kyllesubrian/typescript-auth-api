"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    const attributes = {
        token: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        expires: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        createdByIp: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        revoked: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        revokedByIp: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        replacedByToken: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        accountId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    };
    const options = {
        sequelize,
        modelName: 'RefreshToken',
        tableName: 'refreshTokens',
        timestamps: true,
    };
    class RefreshToken extends sequelize_1.Model {
        get isExpired() {
            return Date.now() >= this.expires.getTime();
        }
        get isActive() {
            return !this.revoked && !this.isExpired;
        }
    }
    RefreshToken.init(attributes, options);
    return RefreshToken;
}
