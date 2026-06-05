import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { injectable } from 'inversify';
import { promisify } from 'util';

export interface PasswordManagerService {
    toHash(password: string): Promise<string>;
    compare(storedPassword: string, suppliedPassword: string): Promise<boolean>;
}

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * A utility class to hash user password before storing in DB
 * and compares user supplied password with the stored hash
 */
@injectable()
export class PasswordManagerServiceImpl implements PasswordManagerService {
    async toHash(password: string): Promise<string> {
        const salt = randomBytes(SALT_LENGTH).toString('hex');
        const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
        const hash = derivedKey.toString('hex');

        return `${hash}.${salt}`;
    }

    async compare(storedPassword: string, suppliedPassword: string): Promise<boolean> {
        if (!storedPassword || typeof storedPassword !== 'string') {
            return false;
        }

        const [hash, salt] = storedPassword.split('.');
        if (!hash || !salt) {
            return false;
        }

        try {
            const derivedKey = (await scryptAsync(suppliedPassword, salt, KEY_LENGTH)) as Buffer;
            const suppliedHash = derivedKey.toString('hex');
            return cryptoTimingSafeEqual(hash, suppliedHash);
        } catch {
            return false;
        }
    }
}

function cryptoTimingSafeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a, 'hex');
    const bBuf = Buffer.from(b, 'hex');

    if (aBuf.length !== bBuf.length) {
        return false;
    }

    return timingSafeEqual(aBuf, bBuf);
}
