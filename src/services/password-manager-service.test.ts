import 'reflect-metadata';
import { PasswordManagerServiceImpl } from './password-manager-service';

describe('PasswordManagerServiceImpl', () => {
    const passwordManager = new PasswordManagerServiceImpl();

    it('hashes passwords with salt and keeps password secure', async () => {
        const hashed = await passwordManager.toHash('StrongPass1');

        expect(typeof hashed).toBe('string');
        expect(hashed).toMatch(/^[0-9a-f]+\.[0-9a-f]+$/);
        expect(hashed).not.toContain('StrongPass1');
    });

    it('compares a stored hash and supplied password correctly', async () => {
        const password = 'SecurePass123';
        const hashed = await passwordManager.toHash(password);

        expect(await passwordManager.compare(hashed, password)).toBe(true);
        expect(await passwordManager.compare(hashed, 'WrongPass1')).toBe(false);
    });
});
