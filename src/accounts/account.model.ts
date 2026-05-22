import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface AccountAttributes {
    id: number;
    email: string;
    passwordHash: string;
    title: string;
    firstName: string;
    lastName: string;
    role: string;
    verificationToken: string | null;
    verified: Date | null;
    resetToken: string | null;
    resetTokenExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
    public id!: number;
    public email!: string;
    public passwordHash!: string;
    public title!: string;
    public firstName!: string;
    public lastName!: string;
    public role!: string;
    public verificationToken!: string | null;
    public verified!: Date | null;
    public resetToken!: string | null;
    public resetTokenExpires!: Date | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initAccount(sequelize: Sequelize): typeof Account {
    Account.init(
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            email: { type: DataTypes.STRING, allowNull: false, unique: true },
            passwordHash: { type: DataTypes.STRING, allowNull: false },
            title: { type: DataTypes.STRING, allowNull: false },
            firstName: { type: DataTypes.STRING, allowNull: false },
            lastName: { type: DataTypes.STRING, allowNull: false },
            role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'User' },
            verificationToken: { type: DataTypes.STRING, allowNull: true },
            verified: { type: DataTypes.DATE, allowNull: true },
            resetToken: { type: DataTypes.STRING, allowNull: true },
            resetTokenExpires: { type: DataTypes.DATE, allowNull: true },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            tableName: 'accounts',
            defaultScope: { attributes: { exclude: ['passwordHash'] } },
            scopes: { withHash: { attributes: undefined } }
        }
    );
    return Account;
}

export default Account;