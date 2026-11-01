import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initialSeedPrompts } from '../config/seedPrompts.js';

describe('PromptVerse Seed Library & Data Integrity Unit Tests', () => {
  const allowedCategories = [
    'DevOps & Cloud',
    'Software Development',
    'System Architecture',
    'AI Art & Midjourney',
    'Writing & Copywriting',
    'Data & Analytics',
    'General Productivity',
  ];

  const allowedModels = [
    'ChatGPT',
    'Claude',
    'Gemini',
    'Midjourney',
    'General / Any LLM',
  ];

  it('should load exactly 13 curated demo community prompts', () => {
    assert.strictEqual(Array.isArray(initialSeedPrompts), true);
    assert.strictEqual(initialSeedPrompts.length, 13, 'Expected 13 seed prompts');
  });

  it('should ensure all prompts contain required non-empty string fields', () => {
    initialSeedPrompts.forEach((prompt, index) => {
      assert.ok(prompt.title && prompt.title.trim().length > 0, `Prompt at index ${index} missing title`);
      assert.ok(prompt.description && prompt.description.trim().length > 0, `Prompt at index ${index} missing description`);
      assert.ok(prompt.prompt && prompt.prompt.trim().length > 0, `Prompt at index ${index} missing prompt body`);
      assert.ok(Array.isArray(prompt.tags) && prompt.tags.length > 0, `Prompt at index ${index} must have at least 1 tag`);
    });
  });

  it('should strictly validate categories against allowed Mongoose schema enums', () => {
    initialSeedPrompts.forEach((p) => {
      assert.ok(
        allowedCategories.includes(p.category),
        `Invalid category "${p.category}" in prompt: "${p.title}"`
      );
    });
  });

  it('should strictly validate target models against supported AI model enums', () => {
    initialSeedPrompts.forEach((p) => {
      assert.ok(
        allowedModels.includes(p.targetModel),
        `Invalid targetModel "${p.targetModel}" in prompt: "${p.title}"`
      );
    });
  });

  it('should ensure unique prompt titles across the library', () => {
    const titles = initialSeedPrompts.map((p) => p.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    assert.strictEqual(titles.length, uniqueTitles.size, 'Detected duplicate prompt titles in seed library');
  });

  it('should contain the DevOps & Cloud Standard Dockerfile prompt', () => {
    const dockerPrompt = initialSeedPrompts.find((p) =>
      p.title.includes('Standard Multi-Stage Dockerfile')
    );
    assert.ok(dockerPrompt, 'Expected Dockerfile prompt to be present');
    assert.strictEqual(dockerPrompt.category, 'DevOps & Cloud');
    assert.strictEqual(dockerPrompt.targetModel, 'ChatGPT');
  });
});
