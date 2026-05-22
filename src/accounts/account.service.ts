import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import db from '../_helpers/db';
import { sendEmail } from '../_helpers/send-email';

const accountService = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    validateResetToken
};

export default accountService;

let fileConfig: any = {};
if (process.env.NODE_ENV !== 'production') {
    try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
            fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (err) {
        console.warn('Could not load config.json:', err);
    }
}

function getJwtSecret() {
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required in production');
    }
    const secret = process.env.JWT_SECRET || fileConfig.secret;
    if (!secret) throw new Error('JWT secret is missing');
    return secret;
}

async function authenticate({ email, password, ipAddress }: { email: string; password: string; ipAddress: string }) {
    const account = await db.Account.scope('withHash').findOne({ where: { email } });

    if (!account || !account.verified || !bcrypt.compareSync(password, account.passwordHash)) {
        throw new Error('Email or password is incorrect');
    }

    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    await refreshToken.save();

    return {
        id: account.id,
        title: account.title,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        created: account.createdAt,
        updated: account.updatedAt,
        verified: account.verified,
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }: { token: string; ipAddress: string }) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token }, include: ['Account'] });

    if (!refreshToken || !refreshToken.isActive) {
        throw new Error('Invalid token');
    }

    const account = refreshToken.Account;
    const newRefreshToken = generateRefreshToken(account, ipAddress);

    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;

    await refreshToken.save();
    await newRefreshToken.save();

    const jwtToken = generateJwtToken(account);

    return {
        account: account.toJSON(),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }: { token: string; ipAddress: string }) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });

    if (!refreshToken || !refreshToken.isActive) {
        throw new Error('Invalid token');
    }

    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params: any, origin: string) {
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw new Error('Email is already registered');
    }

    const account = new db.Account(params);
    const isFirstAccount = (await db.Account.count()) === 0;
    account.role = isFirstAccount ? 'Admin' : 'User';
    account.verificationToken = crypto.randomBytes(32).toString('hex');
    account.passwordHash = bcrypt.hashSync(params.password, 10);

    await account.save();

    const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
    const html = `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`;
    await sendEmail(account.email, 'Verify Email', html);
    console.log(`Verification email sent to ${account.email}`);
}

async function verifyEmail({ token }: { token: string }) {
    const account = await db.Account.findOne({ where: { verificationToken: token } });

    if (!account) {
        throw new Error('Verification failed');
    }

    account.verified = new Date();
    account.verificationToken = null;
    await account.save();
}

async function forgotPassword({ email }: { email: string }, origin: string) {
    const account = await db.Account.findOne({ where: { email } });

    if (!account) return;

    account.resetToken = crypto.randomBytes(32).toString('hex');
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();

    const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
    const html = `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`;
    await sendEmail(account.email, 'Reset Password', html);
    console.log(`Password reset email sent to ${account.email}`);
}

async function resetPassword({ token, password }: { token: string; password: string }) {
    const account = await db.Account.findOne({
        where: { resetToken: token, resetTokenExpires: { [Op.gt]: new Date() } }
    });

    if (!account) {
        throw new Error('Invalid token');
    }

    account.passwordHash = bcrypt.hashSync(password, 10);
    account.resetToken = null;
    account.resetTokenExpires = null;
    await account.save();
}

async function getAll() {
    return await db.Account.findAll();
}

async function getById(id: number) {
    const account = await db.Account.findByPk(id);
    if (!account) throw new Error('Account not found');
    return account;
}

async function create(params: any) {
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw new Error('Email is already registered');
    }

    const account = new db.Account(params);
    account.verified = new Date();
    account.passwordHash = bcrypt.hashSync(params.password, 10);

    await account.save();
    return account;
}

async function update(id: number, params: any) {
    const account = await getById(id);

    if (params.email && account.email !== params.email && await db.Account.findOne({ where: { email: params.email } })) {
        throw new Error('Email is already taken');
    }

    if (params.password) {
        params.passwordHash = bcrypt.hashSync(params.password, 10);
        delete params.password;
    }

    Object.assign(account, params);
    await account.save();
    return account;
}

async function _delete(id: number) {
    const account = await getById(id);
    await db.RefreshToken.destroy({ where: { accountId: id } });
    await account.destroy();
}

function generateJwtToken(account: any) {
    return jwt.sign({ sub: account.id, id: account.id }, getJwtSecret(), { expiresIn: '15m' });
}

function generateRefreshToken(account: any, ipAddress: string) {
    return new db.RefreshToken({
        accountId: account.id,
        token: crypto.randomBytes(40).toString('hex'),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

async function validateResetToken(token: string) {
    const account = await db.Account.findOne({
        where: { resetToken: token, resetTokenExpires: { [Op.gt]: new Date() } }
    });
    if (!account) throw new Error('Invalid token');
    return account;
}