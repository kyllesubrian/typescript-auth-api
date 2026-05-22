import jwt from 'express-jwt';
import db from '../_helpers/db';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production');
}

const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';

export default function authorize(roles: any = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        jwt({ secret: jwtSecret, algorithms: ['HS256'] }),
        async (req: any, res: any, next: any) => {
            const account = await db.Account.findByPk(req.user.id);

            if (!account || (roles.length && !roles.includes(account.role))) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            req.user.role = account.role;
            const refreshTokens = await account.getRefreshTokens();
            req.user.ownsToken = (token: any) => !!refreshTokens.find((x: any) => x.token === token);
            next();
        }
    ];
}