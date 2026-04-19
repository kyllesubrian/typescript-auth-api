import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import config from '../../config.json';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import { sendEmail } from '../_helpers/send-email';

export const accountService = {
    getAll, getById, create, update, delete: _delete,
    register, verifyEmail, authenticate, refreshToken, revokeToken,
    forgotPassword, resetPassword
};

async function getAll() { return await db.Account.findAll(); }

async function getById(id: number) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    return account;
}

async function create(params: any) {
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw `Email "${params.email}" is already registered`;
    }
    const account = new db.Account(params);
    account.passwordHash = await bcrypt.hash(params.password, 10);
    await account.save();
}

async function update(id: number, params: any) {
    const account = await getById(id);
    if (params.email && params.email !== account.email) {
        if (await db.Account.findOne({ where: { email: params.email } })) {
            throw `Email "${params.email}" is already taken`;
        }
    }
    if (params.password) params.passwordHash = await bcrypt.hash(params.password, 10);
    Object.assign(account, params);
    await account.save();
}

async function _delete(id: number) {
    const account = await getById(id);
    await account.destroy();
}

async function register(params: any, ipAddress: string) {
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw `Email "${params.email}" is already registered`;
    }
    const account = new db.Account(params);
    account.passwordHash = await bcrypt.hash(params.password, 10);
    account.verificationToken = crypto.randomBytes(32).toString('hex');
    account.isVerified = false;
    const isFirstAccount = (await db.Account.count()) === 0;
    account.role = isFirstAccount ? Role.Admin : Role.User;
    await account.save();
    await sendVerificationEmail(account, params.origin);
}

async function verifyEmail({ token }: { token: string }) {
    const account = await db.Account.findOne({ where: { verificationToken: token } });
    if (!account) throw 'Verification failed';
    account.isVerified = true;
    account.verificationToken = null;
    await account.save();
}

async function authenticate({ email, password, ipAddress }: { email: string; password: string; ipAddress: string }) {
    const account = await db.Account.scope('withHash').findOne({ where: { email } });
    if (!account || !account.isVerified || !(await bcrypt.compare(password, account.passwordHash))) {
        throw 'Email or password is incorrect';
    }
    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);
    await refreshToken.save();
    return { account: { ...account.toJSON(), passwordHash: undefined }, jwtToken, refreshToken: refreshToken.token };
}

async function refreshToken({ token, ipAddress }: { token: string; ipAddress: string }) {
    const refreshToken = await getRefreshToken(token);
    const account = await refreshToken.getAccount();
    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();
    const jwtToken = generateJwtToken(account);
    return { account: { ...account.toJSON(), passwordHash: undefined }, jwtToken, refreshToken: newRefreshToken.token };
}

async function revokeToken({ token, ipAddress }: { token: string; ipAddress: string }) {
    if (!token) throw 'Token is required';
    
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken) throw 'Invalid token';
    
    if (refreshToken.revoked) throw 'Token already revoked';
    
    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
    
    return { message: 'Token revoked' };
}

async function forgotPassword({ email, origin }: { email: string; origin: string }) {
    const account = await db.Account.findOne({ where: { email } });
    if (!account) return;
    account.resetToken = crypto.randomBytes(32).toString('hex');
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();
    await sendPasswordResetEmail(account, origin);
}

async function resetPassword({ token, password }: { token: string; password: string }) {
    const account = await db.Account.findOne({
        where: { resetToken: token, resetTokenExpires: { [Op.gt]: new Date() } }
    });
    if (!account) throw 'Password reset failed';
    account.passwordHash = await bcrypt.hash(password, 10);
    account.resetToken = null;
    await account.save();
}

async function getRefreshToken(token: string) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

function generateJwtToken(account: any) {
    return jwt.sign({ id: account.id, role: account.role }, config.jwtSecret, { expiresIn: '15m' });
}

function generateRefreshToken(account: any, ipAddress: string) {
    return new db.RefreshToken({
        token: crypto.randomBytes(40).toString('hex'),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress,
        accountId: account.id
    });
}

async function sendVerificationEmail(account: any, origin: string) {
    const verifyUrl = `http://localhost:4000/account/verify-email?token=${account.verificationToken}`;
    const html = `<p>Please click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    await sendEmail(account.email, 'Verify Email', html);
}

async function sendPasswordResetEmail(account: any, origin: string) {
    const resetUrl = `http://localhost:4000/account/reset-password?token=${account.resetToken}`;
    const html = `<p>Please click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;
    await sendEmail(account.email, 'Reset Password', html);
}