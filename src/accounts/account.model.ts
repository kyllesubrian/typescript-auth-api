import { DataTypes, Model, Sequelize } from 'sequelize';

export default function (sequelize: Sequelize) {
    const attributes = {
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'User' },
        isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        verificationToken: { type: DataTypes.STRING, allowNull: true },
        resetToken: { type: DataTypes.STRING, allowNull: true },
        resetTokenExpires: { type: DataTypes.DATE, allowNull: true },
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

    class Account extends Model {
        public id!: number;
        public email!: string;
        public passwordHash!: string;
        public title!: string;
        public firstName!: string;
        public lastName!: string;
        public role!: string;
        public isVerified!: boolean;
        public verificationToken!: string | null;
        public resetToken!: string | null;
        public resetTokenExpires!: Date | null;
        public readonly createdAt!: Date;
        public readonly updatedAt!: Date;
    }

    Account.init(attributes, options);
    return Account;
}