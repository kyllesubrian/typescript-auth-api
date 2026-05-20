"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const sequelize_1 = require("sequelize");
const config_json_1 = __importDefault(require("../../config.json"));
const db_1 = require("../_helpers/db");
const role_1 = require("../_helpers/role");
const send_email_1 = require("../_helpers/send-email");
exports.accountService = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    register,
    verifyEmail,
    authenticate,
    refreshToken,
    revokeToken,
    forgotPassword,
    resetPassword,
    validateResetToken
};
async function getAll() {
    return await db_1.db.Account.findAll();
}
async function getById(id) {
    const account = await db_1.db.Account.findByPk(id);
    if (!account)
        throw 'Account not found';
    return account;
}
async function create(params) {
    if (await db_1.db.Account.findOne({ where: { email: params.email } })) {
        throw `Email "${params.email}" is already registered`;
    }
    const account = new db_1.db.Account(params);
    account.passwordHash = await bcryptjs_1.default.hash(params.password, 10);
    await account.save();
}
async function update(id, params) {
    const account = await getById(id);
    if (params.email && params.email !== account.email) {
        if (await db_1.db.Account.findOne({ where: { email: params.email } })) {
            throw `Email "${params.email}" is already taken`;
        }
    }
    if (params.password) {
        params.passwordHash = await bcryptjs_1.default.hash(params.password, 10);
    }
    Object.assign(account, params);
    await account.save();
}
async function _delete(id) {
    const account = await getById(id);
    await account.destroy();
}
async function register(params, ipAddress) {
    if (await db_1.db.Account.findOne({ where: { email: params.email } })) {
        throw `Email "${params.email}" is already registered`;
    }
    const account = new db_1.db.Account(params);
    account.passwordHash = await bcryptjs_1.default.hash(params.password, 10);
    account.verificationToken = crypto_1.default.randomBytes(32).toString('hex');
    account.isVerified = false;
    const isFirstAccount = (await db_1.db.Account.count()) === 0;
    account.role = isFirstAccount ? role_1.Role.Admin : role_1.Role.User;
    await account.save();
    await sendVerificationEmail(account, params.origin);
}
async function verifyEmail({ token }) {
    const account = await db_1.db.Account.findOne({ where: { verificationToken: token } });
    if (!account)
        throw 'Verification failed';
    account.isVerified = true;
    account.verificationToken = null;
    await account.save();
}
async function authenticate({ email, password, ipAddress }) {
    const account = await db_1.db.Account.scope('withHash').findOne({ where: { email } });
    if (!account || !account.isVerified || !(await bcryptjs_1.default.compare(password, account.passwordHash))) {
        throw 'Email or password is incorrect';
    }
    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);
    await refreshToken.save();
    return { account: { ...account.toJSON(), passwordHash: undefined }, jwtToken, refreshToken: refreshToken.token };
}
async function refreshToken({ token, ipAddress }) {
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
async function revokeToken({ token, ipAddress }) {
    if (!token)
        throw 'Token is required';
    const refreshToken = await db_1.db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken)
        throw 'Invalid token';
    if (refreshToken.revoked)
        throw 'Token already revoked';
    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
    return { message: 'Token revoked' };
}
async function forgotPassword({ email, origin }) {
    const account = await db_1.db.Account.findOne({ where: { email } });
    if (!account)
        return;
    account.resetToken = crypto_1.default.randomBytes(32).toString('hex');
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();
    await sendPasswordResetEmail(account, origin);
}
async function resetPassword({ token, password }) {
    const account = await db_1.db.Account.findOne({
        where: { resetToken: token, resetTokenExpires: { [sequelize_1.Op.gt]: new Date() } }
    });
    if (!account)
        throw 'Password reset failed';
    account.passwordHash = await bcryptjs_1.default.hash(password, 10);
    account.resetToken = null;
    await account.save();
}
async function validateResetToken({ token }) {
    const account = await db_1.db.Account.findOne({
        where: { resetToken: token, resetTokenExpires: { [sequelize_1.Op.gt]: new Date() } }
    });
    if (!account)
        throw 'Invalid or expired token';
    return account;
}
async function getRefreshToken(token) {
    const refreshToken = await db_1.db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive)
        throw 'Invalid token';
    return refreshToken;
}
function generateJwtToken(account) {
    return jsonwebtoken_1.default.sign({ id: account.id, role: account.role }, config_json_1.default.jwtSecret, { expiresIn: '15m' });
}
function generateRefreshToken(account, ipAddress) {
    return new db_1.db.RefreshToken({
        token: crypto_1.default.randomBytes(40).toString('hex'),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress,
        accountId: account.id
    });
}
async function sendVerificationEmail(account, origin) {
    const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
    const html = `<p>Please click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    await (0, send_email_1.sendEmail)(account.email, 'Verify Email', html);
}
async function sendPasswordResetEmail(account, origin) {
    const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
    const html = `<p>Please click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;
    await (0, send_email_1.sendEmail)(account.email, 'Reset Password', html);
}
