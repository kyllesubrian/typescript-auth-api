import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest } from '../_middleware/validate-request';
import { authorize } from '../_middleware/authorize';
import { Role } from '../_helpers/role';
import { accountService } from './account.service';

const router = Router();

// Routes
router.post('/register', registerSchema, register);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', revokeTokenSchema, revokeToken);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);
router.get('/', authorize([Role.Admin]), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize([Role.Admin]), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

export default router;

function register(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin || 'https://angular-21-boilerplate-main.onrender.com';
    accountService.register(req.body, origin)
        .then(() => res.json({ message: 'Registration successful, please check your email for verification instructions' }))
        .catch(next);
}

function verifyEmail(req: Request, res: Response, next: NextFunction) {
    accountService.verifyEmail(req.body)
        .then(() => res.json({ message: 'Verification successful, you can now login' }))
        .catch(next);
}

function authenticate(req: Request, res: Response, next: NextFunction) {
    accountService.authenticate({ ...req.body, ipAddress: req.ip })
        .then(({ account, jwtToken, refreshToken }) => {
            setTokenCookie(res, refreshToken);
            res.json({ account, jwtToken });
        })
        .catch(next);
}

function refreshToken(req: Request, res: Response, next: NextFunction) {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    accountService.refreshToken({ token, ipAddress: req.ip })
        .then(({ account, jwtToken, refreshToken }) => {
            setTokenCookie(res, refreshToken);
            res.json({ account, jwtToken });
        })
        .catch(next);
}

function revokeToken(req: Request, res: Response, next: NextFunction) {
    const token = req.body.token || req.cookies?.refreshToken;
    accountService.revokeToken({ token, ipAddress: req.ip })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch(next);
}

function forgotPassword(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin || 'https://angular-21-boilerplate-main.onrender.com';
    accountService.forgotPassword({ ...req.body, origin })
        .then(() => res.json({ message: 'Please check your email for password reset instructions' }))
        .catch(next);
}

function resetPassword(req: Request, res: Response, next: NextFunction) {
    accountService.resetPassword(req.body)
        .then(() => res.json({ message: 'Password reset successful, you can now login' }))
        .catch(next);
}

function validateResetToken(req: Request, res: Response, next: NextFunction) {
    accountService.validateResetToken(req.body)
        .then(() => res.json({ message: 'Token is valid' }))
        .catch(next);
}

function getAll(req: Request, res: Response, next: NextFunction) {
    accountService.getAll()
        .then(accounts => res.json(accounts))
        .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction) {
    accountService.getById(parseInt(req.params.id))
        .then(account => res.json(account))
        .catch(next);
}

function create(req: Request, res: Response, next: NextFunction) {
    accountService.create(req.body)
        .then(() => res.json({ message: 'Account created' }))
        .catch(next);
}

function update(req: Request, res: Response, next: NextFunction) {
    accountService.update(parseInt(req.params.id), req.body)
        .then(() => res.json({ message: 'Account updated' }))
        .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction) {
    accountService.delete(parseInt(req.params.id))
        .then(() => res.json({ message: 'Account deleted successfully' }))
        .catch(next);
}

function setTokenCookie(res: Response, token: string) {
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}

function registerSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        acceptTerms: Joi.boolean()
    });
    validateRequest(req, next, schema);
}

function verifyEmailSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({ token: Joi.string().required() });
    validateRequest(req, next, schema);
}

function authenticateSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });
    validateRequest(req, next, schema);
}

function revokeTokenSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({ token: Joi.string() });
    validateRequest(req, next, schema);
}

function forgotPasswordSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({ email: Joi.string().email().required() });
    validateRequest(req, next, schema);
}

function resetPasswordSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    });
    validateRequest(req, next, schema);
}

function validateResetTokenSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({ token: Joi.string().required() });
    validateRequest(req, next, schema);
}

function createSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid(Role.Admin, Role.User).default(Role.User),
        isVerified: Joi.boolean().default(false),
    });
    validateRequest(req, next, schema);
}

function updateSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        title: Joi.string().empty(''),
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
        role: Joi.string().valid(Role.Admin, Role.User).empty(''),
        isVerified: Joi.boolean(),
    }).with('password', 'confirmPassword');
    validateRequest(req, next, schema);
}