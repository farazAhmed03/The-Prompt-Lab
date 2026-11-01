import { describe, it } from 'node:test';
import assert from 'node:assert';
import { escapeRegex, isCleanString } from '../utils/security.js';

describe('Search & Filter Engine Unit Tests (User-Facing)', () => {
  const samplePrompts = [
    {
      _id: '1',
      title: 'Production Dockerfile Architect for Node.js',
      description: 'Generates secure, multi-stage production Dockerfiles',
      prompt: 'Act as a DevOps engineer...',
      category: 'DevOps & Cloud',
      targetModel: 'ChatGPT',
      tags: ['docker', 'devops', 'containers'],
      copies: 150,
      createdAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: '2',
      title: 'React 18 & Tailwind Component Builder',
      description: 'Builds responsive frontend hero sections with Tailwind',
      prompt: 'Act as a Frontend developer...',
      category: 'Software Development',
      targetModel: 'Claude',
      tags: ['react', 'frontend', 'tailwind'],
      copies: 320,
      createdAt: new Date('2026-02-01').toISOString(),
    },
    {
      _id: '3',
      title: 'SQL Query Optimizer & Indexing Advisor',
      description: 'Diagnoses slow database queries and recommends composite indexes',
      prompt: 'Analyze this SQL query...',
      category: 'Data & Analytics',
      targetModel: 'ChatGPT',
      tags: ['sql', 'database', 'optimization'],
      copies: 80,
      createdAt: new Date('2026-03-01').toISOString(),
    },
  ];

  it('should find prompts matching keyword in title (case-insensitive)', () => {
    const keyword = 'DOCKER';
    const q = keyword.toLowerCase();
    const results = samplePrompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, 'Production Dockerfile Architect for Node.js');
  });

  it('should find prompts matching keyword in tags or description', () => {
    const keyword = 'frontend';
    const q = keyword.toLowerCase();
    const results = samplePrompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0]._id, '2');
  });

  it('should filter prompts by category accurately', () => {
    const devopsResults = samplePrompts.filter((p) => p.category === 'DevOps & Cloud');
    assert.strictEqual(devopsResults.length, 1);
    assert.strictEqual(devopsResults[0].category, 'DevOps & Cloud');

    const nonExistent = samplePrompts.filter((p) => p.category === 'NonExistent');
    assert.strictEqual(nonExistent.length, 0);
  });

  it('should filter prompts by target AI model accurately', () => {
    const chatGptPrompts = samplePrompts.filter((p) => p.targetModel === 'ChatGPT');
    assert.strictEqual(chatGptPrompts.length, 2);

    const claudePrompts = samplePrompts.filter((p) => p.targetModel === 'Claude');
    assert.strictEqual(claudePrompts.length, 1);
  });

  it('should correctly sort by popular (highest copies first)', () => {
    const sorted = [...samplePrompts].sort((a, b) => b.copies - a.copies);
    assert.strictEqual(sorted[0].copies, 320, 'Top result should have 320 copies');
    assert.strictEqual(sorted[1].copies, 150);
    assert.strictEqual(sorted[2].copies, 80);
  });

  it('should safely handle search strings with regex special characters without crashing', () => {
    const dangerousInputs = [
      'docker (v2)',
      'query [fast]',
      'react + tailwind',
      '.*.*.*',
      'c++ & python',
      'cost: $100',
    ];

    dangerousInputs.forEach((rawInput) => {
      assert.doesNotThrow(() => {
        const escaped = escapeRegex(rawInput);
        const regex = new RegExp(escaped, 'i');
        assert.ok(regex instanceof RegExp);
      }, `Failed to escape regex input: "${rawInput}"`);
    });
  });

  it('should ignore empty or whitespace-only search strings', () => {
    assert.strictEqual(isCleanString('   '), false);
    assert.strictEqual(isCleanString(''), false);
    assert.strictEqual(isCleanString(null), false);
    assert.strictEqual(isCleanString(undefined), false);
  });
});
