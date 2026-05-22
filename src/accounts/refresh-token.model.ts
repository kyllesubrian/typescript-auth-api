import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import Account from './account.model';

export interface RefreshTokenAttributes {
    id: number;
    token: string;
    expires: Date;
    createdByIp: string;
    revoked: Date | null;
    revokedByIp: string | null;
    replacedByToken: string | null;
    accountId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
    public id!: number;
    public token!: string;
    public expires!: Date;
    public createdByIp!: string;
    public revoked!: Date | null;
    public revokedByIp!: string | null;
    public replacedByToken!: string | null;
    public accountId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    get isExpired(): boolean {
        return Date.now() >= this.expires.getTime();
    }

    get isActive(): boolean {
        return !this.revoked && !this.isExpired;
    }
}

export function initRefreshToken(sequelize: Sequelize): typeof RefreshToken {
    RefreshToken.init(
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            token: { type: DataTypes.STRING, allowNull: false },
            expires: { type: DataTypes.DATE, allowNull: false },
            createdByIp: { type: DataTypes.STRING, allowNull: false },
            revoked: { type: DataTypes.DATE, allowNull: true },
            revokedByIp: { type: DataTypes.STRING, allowNull: true },
            replacedByToken: { type: DataTypes.STRING, allowNull: true },
            accountId: { type: DataTypes.INTEGER, allowNull: false },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            tableName: 'refreshTokens'
        }
    );
    
    // Define relationship
    Account.hasMany(RefreshToken, { as: 'RefreshTokens', foreignKey: 'accountId' });
    RefreshToken.belongsTo(Account, { foreignKey: 'accountId' });
    
    return RefreshToken;
}

export default RefreshToken;