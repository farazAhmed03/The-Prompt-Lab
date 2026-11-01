import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('PromptVerse Authentication & Security Unit Tests', () => {
  const testSecret = 'test_super_secret_jwt_key_2026';
  const testUserId = 'test_user_id_123456';

  it('should securely hash a plaintext password with bcrypt salt', async () => {
    const plaintext = 'admin03042002';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plaintext, salt);

    assert.notStrictEqual(hash, plaintext, 'Hash must not match plaintext');
    assert.strictEqual(hash.startsWith('$2'), true, 'Expected valid bcrypt prefix');

    const isValid = await bcrypt.compare(plaintext, hash);
    assert.strictEqual(isValid, true, 'bcrypt.compare should return true for valid password');

    const isWrong = await bcrypt.compare('wrong_pass_999', hash);
    assert.strictEqual(isWrong, false, 'bcrypt.compare must reject invalid password');
  });

  it('should generate a valid signed JWT and verify its payload', () => {
    const token = jwt.sign({ id: testUserId, role: 'admin' }, testSecret, { expiresIn: '1h' });

    assert.ok(token, 'Token must be generated');
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.split('.').length, 3, 'JWT must contain header, payload, and signature');

    const decoded = jwt.verify(token, testSecret);
    assert.strictEqual(decoded.id, testUserId);
    assert.strictEqual(decoded.role, 'admin');
    assert.ok(decoded.exp > decoded.iat, 'Expiration timestamp must be greater than issued at');
  });

  it('should reject a tampered or invalid JWT token', () => {
    const token = jwt.sign({ id: testUserId }, testSecret, { expiresIn: '1h' });
    const tamperedToken = token + 'manipulated';

    assert.throws(
      () => {
        jwt.verify(tamperedToken, testSecret);
      },
      { name: 'JsonWebTokenError' },
      'Should throw JsonWebTokenError on tampered token'
    );
  });
});

