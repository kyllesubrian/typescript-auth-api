import { DataTypes, Model, Sequelize } from 'sequelize';

export default function (sequelize: Sequelize) {
    const attributes = {
        token: { type: DataTypes.STRING, allowNull: false },
        expires: { type: DataTypes.DATE, allowNull: false },
        createdByIp: { type: DataTypes.STRING, allowNull: false },
        revoked: { type: DataTypes.DATE, allowNull: true },
        revokedByIp: { type: DataTypes.STRING, allowNull: true },
        replacedByToken: { type: DataTypes.STRING, allowNull: true },
        accountId: { type: DataTypes.INTEGER, allowNull: false },
    };

    const options = {
        sequelize,
        modelName: 'RefreshToken',
        tableName: 'refreshTokens',
        timestamps: true,
    };

    class RefreshToken extends Model {
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

        public get isExpired(): boolean {
            return Date.now() >= this.expires.getTime();
        }

        public get isActive(): boolean {
            return !this.revoked && !this.isExpired;
        }
    }

    RefreshToken.init(attributes, options);
    return RefreshToken;
}