"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const validate_request_1 = require("../_middleware/validate-request");
const authorize_1 = require("../_middleware/authorize");
const role_1 = require("../_helpers/role");
const account_service_1 = require("./account.service");
const router = (0, express_1.Router)();
// Routes
router.post('/register', registerSchema, register);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', revokeTokenSchema, revokeToken);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);
router.get('/', (0, authorize_1.authorize)([role_1.Role.Admin]), getAll);
router.get('/:id', (0, authorize_1.authorize)(), getById);
router.post('/', (0, authorize_1.authorize)([role_1.Role.Admin]), createSchema, create);
router.put('/:id', (0, authorize_1.authorize)(), updateSchema, update);
router.delete('/:id', (0, authorize_1.authorize)(), _delete);
exports.default = router;
function register(req, res, next) {
    account_service_1.accountService.register(req.body, req.ip)
        .then(() => res.json({ message: 'Registration successful, please check your email for verification instructions' }))
        .catch(next);
}
function verifyEmail(req, res, next) {
    account_service_1.accountService.verifyEmail(req.body)
        .then(() => res.json({ message: 'Verification successful, you can now login' }))
        .catch(next);
}
function authenticate(req, res, next) {
    account_service_1.accountService.authenticate({ ...req.body, ipAddress: req.ip })
        .then(({ account, jwtToken, refreshToken }) => {
        setTokenCookie(res, refreshToken);
        res.json({ account, jwtToken });
    })
        .catch(next);
}
function refreshToken(req, res, next) {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    account_service_1.accountService.refreshToken({ token, ipAddress: req.ip })
        .then(({ account, jwtToken, refreshToken }) => {
        setTokenCookie(res, refreshToken);
        res.json({ account, jwtToken });
    })
        .catch(next);
}
function revokeToken(req, res, next) {
    const token = req.body.token || req.cookies?.refreshToken;
    account_service_1.accountService.revokeToken({ token, ipAddress: req.ip })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch(next);
}
function forgotPassword(req, res, next) {
    account_service_1.accountService.forgotPassword({ ...req.body, origin: req.headers.origin })
        .then(() => res.json({ message: 'Please check your email for password reset instructions' }))
        .catch(next);
}
function resetPassword(req, res, next) {
    account_service_1.accountService.resetPassword(req.body)
        .then(() => res.json({ message: 'Password reset successful, you can now login' }))
        .catch(next);
}
function validateResetToken(req, res, next) {
    account_service_1.accountService.validateResetToken(req.body)
        .then(() => res.json({ message: 'Token is valid' }))
        .catch(next);
}
function getAll(req, res, next) {
    account_service_1.accountService.getAll()
        .then(accounts => res.json(accounts))
        .catch(next);
}
function getById(req, res, next) {
    account_service_1.accountService.getById(parseInt(req.params.id))
        .then(account => res.json(account))
        .catch(next);
}
function create(req, res, next) {
    account_service_1.accountService.create(req.body)
        .then(() => res.json({ message: 'Account created' }))
        .catch(next);
}
function update(req, res, next) {
    account_service_1.accountService.update(parseInt(req.params.id), req.body)
        .then(() => res.json({ message: 'Account updated' }))
        .catch(next);
}
function _delete(req, res, next) {
    account_service_1.accountService.delete(parseInt(req.params.id))
        .then(() => res.json({ message: 'Account deleted successfully' }))
        .catch(next);
}
function setTokenCookie(res, token) {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}
function registerSchema(req, res, next) {
    const schema = joi_1.default.object({
        title: joi_1.default.string().required(),
        firstName: joi_1.default.string().required(),
        lastName: joi_1.default.string().required(),
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().min(6).required(),
        confirmPassword: joi_1.default.string().valid(joi_1.default.ref('password')).required(),
        acceptTerms: joi_1.default.boolean()
    });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function verifyEmailSchema(req, res, next) {
    const schema = joi_1.default.object({ token: joi_1.default.string().required() });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function authenticateSchema(req, res, next) {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().required(),
    });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function revokeTokenSchema(req, res, next) {
    const schema = joi_1.default.object({ token: joi_1.default.string() });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function forgotPasswordSchema(req, res, next) {
    const schema = joi_1.default.object({ email: joi_1.default.string().email().required() });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function resetPasswordSchema(req, res, next) {
    const schema = joi_1.default.object({
        token: joi_1.default.string().required(),
        password: joi_1.default.string().min(6).required(),
        confirmPassword: joi_1.default.string().valid(joi_1.default.ref('password')).required(),
    });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function validateResetTokenSchema(req, res, next) {
    const schema = joi_1.default.object({ token: joi_1.default.string().required() });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function createSchema(req, res, next) {
    const schema = joi_1.default.object({
        title: joi_1.default.string().required(),
        firstName: joi_1.default.string().required(),
        lastName: joi_1.default.string().required(),
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().min(6).required(),
        role: joi_1.default.string().valid(role_1.Role.Admin, role_1.Role.User).default(role_1.Role.User),
        isVerified: joi_1.default.boolean().default(false),
    });
    (0, validate_request_1.validateRequest)(req, next, schema);
}
function updateSchema(req, res, next) {
    const schema = joi_1.default.object({
        title: joi_1.default.string().empty(''),
        firstName: joi_1.default.string().empty(''),
        lastName: joi_1.default.string().empty(''),
        email: joi_1.default.string().email().empty(''),
        password: joi_1.default.string().min(6).empty(''),
        confirmPassword: joi_1.default.string().valid(joi_1.default.ref('password')).empty(''),
        role: joi_1.default.string().valid(role_1.Role.Admin, role_1.Role.User).empty(''),
        isVerified: joi_1.default.boolean(),
    }).with('password', 'confirmPassword');
    (0, validate_request_1.validateRequest)(req, next, schema);
}
