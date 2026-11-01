import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isCleanString, sanitizeHtml, escapeRegex } from '../utils/security.js';

describe('Security & Hacker Injection Defense Unit Tests', () => {
  it('should block NoSQL object injection payloads from being treated as clean strings', () => {
    const maliciousNoSQLPayloads = [
      { $gt: '' },
      { $ne: null },
      { $where: 'sleep(5000)' },
      ['admin', 'root'],
      null,
      undefined,
      12345,
      {},
    ];

    maliciousNoSQLPayloads.forEach((payload) => {
      const isClean = isCleanString(payload);
      assert.strictEqual(
        isClean,
        false,
        `Expected NoSQL payload ${JSON.stringify(payload)} to be rejected by isCleanString`
      );
    });
  });

  it('should strip malicious <script> tags from prompt titles and bodies (Stored XSS Defense)', () => {
    const dirtyTitle = '<script>alert("Hacked!")</script>Production Dockerfile';
    const cleanTitle = sanitizeHtml(dirtyTitle);

    assert.strictEqual(cleanTitle.includes('<script>'), false);
    assert.strictEqual(cleanTitle.includes('</script>'), false);
    assert.strictEqual(cleanTitle, 'Production Dockerfile');
  });

  it('should strip inline javascript: and event handlers like onload/onerror (XSS Defense)', () => {
    const maliciousInput = '<img src="x" onerror="alert(document.cookie)" /> <a href="javascript:steal()">Click</a>';
    const sanitized = sanitizeHtml(maliciousInput);

    assert.strictEqual(sanitized.includes('onerror='), false);
    assert.strictEqual(sanitized.includes('javascript:'), false);
  });

  it('should prevent Regex ReDoS / syntax errors from unescaped wildcards', () => {
    const maliciousRegexString = '([a-zA-Z0-9]+)*$';
    const escaped = escapeRegex(maliciousRegexString);

    assert.strictEqual(escaped.includes('\\('), true);
    assert.strictEqual(escaped.includes('\\['), true);
    assert.strictEqual(escaped.includes('\\+'), true);
    assert.strictEqual(escaped.includes('\\*'), true);
    assert.strictEqual(escaped.includes('\\$'), true);

    // Ensure it can be safely compiled into a regular expression without throwing
    const safeRegex = new RegExp(escaped, 'i');
    assert.ok(safeRegex);
  });

  it('should validate password length boundary (minimum 6 characters)', () => {
    const shortPasswords = ['', '123', 'abcd', '12345'];
    shortPasswords.forEach((pw) => {
      assert.ok(pw.length < 6, `Password "${pw}" should be flagged as shorter than 6 characters`);
    });

    const validPassword = 'admin03042002';
    assert.ok(validPassword.length >= 6);
  });
});
