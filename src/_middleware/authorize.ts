import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config.json';
import { db } from '../_helpers/db';

export function authorize(roles: string[] = []) {
    return [
        async (req: any, res: Response, next: NextFunction) => {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            try {
                const decoded: any = jwt.verify(token, config.jwtSecret);
                req.user = decoded;
                next();
            } catch (err) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        },
        async (req: any, res: Response, next: NextFunction) => {
            const account = await db.Account.findByPk(req.user.id);

            if (!account) {
                return res.status(401).json({ message: 'Account not found' });
            }

            const isAuthorized = roles.length === 0 || roles.includes(account.role);

            if (!isAuthorized) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            req.user.role = account.role;
            req.user.ownsToken = (tokenId: number) => tokenId === req.user.tokenId;

            next();
        }
    ];
}