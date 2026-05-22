import { Request, Response, NextFunction } from 'express';
import  accountService  from './account.service';
import  validateRequest  from '../_middleware/validate-request';
import  authorize  from '../_middleware/authorize';
import  Role  from '../_helpers/role';
import Joi from 'joi';

const router = require('express').Router();

// Routes
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken);
router.post('/register', registerSchema, register);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);

export default router;

// Validation schemas
function authenticateSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    accountService.authenticate({ ...req.body, ipAddress })
        .then((result: any) => {
            setTokenCookie(res, result.refreshToken);
            // Remove refreshToken from response body
            const { refreshToken, ...responseData } = result;
            res.json(responseData);
        })
        .catch(next);
}

function refreshToken(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    //check if token exists (stuck in status 500 before this)
       if (!token) {
        return res.status(200).json({ message: 'No refresh token' });
    }
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    accountService.refreshToken({ token, ipAddress })
        .then((result: any) => {
            setTokenCookie(res, result.refreshToken);
            res.json(result);
        })
        .catch(next);
}

function revokeTokenSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        token: Joi.string().optional()
    });
    validateRequest(req, next, schema);
}

function revokeToken(req: Request, res: Response, next: NextFunction) {
    const token = req.body.token || req.cookies.refreshToken;
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    accountService.revokeToken({ token, ipAddress })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch(next);
}

function registerSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

function register(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin || '';
    accountService.register(req.body, origin)
        .then(() => res.json({ message: 'Registration successful, please check your email for verification instructions' }))
        .catch(next);
}

function verifyEmailSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function verifyEmail(req: Request, res: Response, next: NextFunction) {
    accountService.verifyEmail(req.body)
        .then(() => res.json({ message: 'Verification successful, you can now login' }))
        .catch(next);
}

function forgotPasswordSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}

function forgotPassword(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin || '';
    accountService.forgotPassword(req.body, origin)
        .then(() => res.json({ message: 'Please check your email for password reset instructions' }))
        .catch(next);
}

function resetPasswordSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

function resetPassword(req: Request, res: Response, next: NextFunction) {
    accountService.resetPassword(req.body)
        .then(() => res.json({ message: 'Password reset successful, you can now login' }))
        .catch(next);
}

function getAll(req: Request, res: Response, next: NextFunction) {
    accountService.getAll()
        .then((accounts: any) => res.json(accounts))
        .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction) {
    const id = parseInt(req.params.id as string);
    const currentUser = (req as any).user;

    if (id !== currentUser.id && currentUser.role !== Role.Admin) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    accountService.getById(id)
        .then((account: any) => res.json(account))
        .catch(next);
}

function createSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid(Role.Admin, Role.User).optional()
    });
    validateRequest(req, next, schema);
}

function create(req: Request, res: Response, next: NextFunction) {
    accountService.create(req.body)
        .then((account: any) => res.json(account))
        .catch(next);
}

function updateSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        title: Joi.string().empty(''),
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
        role: Joi.string().valid(Role.Admin, Role.User).empty('')
    });
    validateRequest(req, next, schema);
}

function update(req: Request, res: Response, next: NextFunction) {
    const id = parseInt(req.params.id as string);
    const currentUser = (req as any).user;

    if (id !== currentUser.id && currentUser.role !== Role.Admin) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    accountService.update(id, req.body)
        .then((account: any) => res.json(account))
        .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction) {
    const id = parseInt(req.params.id as string);
    const currentUser = (req as any).user;

    if (id !== currentUser.id && currentUser.role !== Role.Admin) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    accountService.delete(id)
        .then(() => res.json({ message: 'Account deleted successfully' }))
        .catch(next);
}

// Helper function
function setTokenCookie(res: Response, token: string) {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sameSite: (process.env.COOKIE_SAMESITE || 'lax') as 'lax' | 'none' | 'strict',
        secure: process.env.COOKIE_SECURE === 'true'
    };
    res.cookie('refreshToken', token, cookieOptions);
}

function validateResetTokenSchema(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function validateResetToken(req: Request, res: Response, next: NextFunction) {
    accountService.validateResetToken(req.body.token)
        .then(() => res.json({ message: 'Token is valid' }))
        .catch(next);
}