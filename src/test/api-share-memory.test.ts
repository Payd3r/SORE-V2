import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getShareLink, POST as createShareLink, DELETE as revokeShareLink } from '@/app/api/memories/[id]/share/route';
import { POST as verifyPassword } from '@/app/api/share/verify/route';
import { prisma } from '@/lib/prisma';
import * as nextAuth from 'next-auth';
import bcrypt from 'bcrypt';

// Mocking prisma and next-auth
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sharedLink: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    memory: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('next-auth');
vi.mock('bcrypt');

describe('API /api/memories/[id]/share', () => {
    const mockSession = { user: { id: 'user-1', coupleId: 'couple-1' } };
    const memoryId = 'memory-1';

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(nextAuth, 'getServerSession').mockResolvedValue(mockSession);
    });

    it('should create a share link without a password', async () => {
        const newLink = { id: 'link-1', token: 'token-123', memoryId, expiresAt: null, password: null };
        vi.spyOn(prisma.memory, 'findUnique').mockResolvedValue({ id: memoryId, author: { coupleId: 'couple-1' } } as any);
        vi.spyOn(prisma.sharedLink, 'create').mockResolvedValue(newLink);

        const request = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({ memoryId, hasPassword: false }),
        });
        const response = await createShareLink(request, { params: { id: memoryId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.link.token).toBeDefined();
        expect(prisma.sharedLink.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ password: null }) })
        );
    });

    it('should create a share link with a password', async () => {
        const hashedPassword = 'hashed-password';
        const newLink = { id: 'link-2', token: 'token-456', memoryId, expiresAt: null, password: hashedPassword };
        vi.spyOn(prisma.memory, 'findUnique').mockResolvedValue({ id: memoryId, author: { coupleId: 'couple-1' } } as any);
        vi.spyOn(prisma.sharedLink, 'create').mockResolvedValue(newLink);
        vi.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);

        const request = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({ memoryId, hasPassword: true, password: 'my-password' }),
        });
        const response = await createShareLink(request, { params: { id: memoryId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.link.password).toBeDefined();
        expect(bcrypt.hash).toHaveBeenCalledWith('my-password', 10);
    });

    it('should revoke a share link', async () => {
        vi.spyOn(prisma.memory, 'findUnique').mockResolvedValue({ id: memoryId, author: { coupleId: 'couple-1' } } as any);
        vi.spyOn(prisma.sharedLink, 'delete').mockResolvedValue({} as any);

        const request = new Request('http://localhost', { method: 'DELETE' });
        const response = await revokeShareLink(request, { params: { id: memoryId } });

        expect(response.status).toBe(200);
        expect(prisma.sharedLink.delete).toHaveBeenCalledWith({ where: { memoryId } });
    });

    describe('API /api/share/verify', () => {
        const token = 'token-123';
        const validPassword = 'password';
        const hashedPassword = 'hashed-password';

        it('should verify password successfully', async () => {
            const sharedLink = { token, password: hashedPassword };
            vi.spyOn(prisma.sharedLink, 'findUnique').mockResolvedValue(sharedLink as any);
            vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            const request = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ token, password: validPassword }),
            });
            const response = await verifyPassword(request);

            expect(response.status).toBe(200);
            expect(bcrypt.compare).toHaveBeenCalledWith(validPassword, hashedPassword);
        });

        it('should fail verification with wrong password', async () => {
            const sharedLink = { token, password: hashedPassword };
            vi.spyOn(prisma.sharedLink, 'findUnique').mockResolvedValue(sharedLink as any);
            vi.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            const request = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ token, password: 'wrong-password' }),
            });
            const response = await verifyPassword(request);

            expect(response.status).toBe(401);
        });
    });
}); 