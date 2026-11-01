import Prompt from '../models/Prompt.js';
import User from '../models/User.js';
import { getMongoStatus } from '../config/db.js';
import { initialSeedPrompts } from '../config/seedPrompts.js';
import { escapeRegex, isCleanString, sanitizeHtml } from '../utils/security.js';

// In-Memory store fallback
export let memoryPrompts = [...initialSeedPrompts];

// @desc    Seed default prompts into MongoDB if empty or outdated
export const ensureDefaultPrompts = async () => {
  if (!getMongoStatus()) return;
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    const adminId = adminUser ? adminUser._id : null;

    // Check each initial seed prompt and insert if missing
    for (const seed of initialSeedPrompts) {
      const exists = await Prompt.findOne({ title: seed.title });
      if (!exists) {
        const { _id, ...rest } = seed;
        await Prompt.create({
          ...rest,
          user: adminId || '000000000000000000000000',
        });
        console.log(`[PromptVerse] Added demo prompt: ${seed.title}`);
      }
    }
  } catch (err) {
    console.error('[PromptVerse] Error ensuring default prompts:', err.message);
  }
};

// @desc    Get all prompts (with optional search, category, model, and sort)
export const getPrompts = async (req, res) => {
  const { search, category, model, sort } = req.query;

  try {
    if (getMongoStatus()) {
      let query = {};

      if (category && category !== 'All' && isCleanString(category)) {
        query.category = category.trim();
      }

      if (model && model !== 'All' && isCleanString(model)) {
        query.targetModel = model.trim();
      }

      if (isCleanString(search)) {
        const cleanSearch = escapeRegex(search.trim());
        query.$or = [
          { title: { $regex: cleanSearch, $options: 'i' } },
          { description: { $regex: cleanSearch, $options: 'i' } },
          { prompt: { $regex: cleanSearch, $options: 'i' } },
          { tags: { $in: [new RegExp(cleanSearch, 'i')] } },
        ];
      }

      let sortOption = { createdAt: -1 };
      if (sort === 'popular') sortOption = { copies: -1 };
      if (sort === 'liked') sortOption = { 'likes.length': -1, createdAt: -1 };

      const prompts = await Prompt.find(query)
        .populate('user', 'name email role')
        .sort(sortOption);

      return res.json(prompts);
    }

    // In-memory fallback
    let filtered = [...memoryPrompts];

    if (category && category !== 'All' && isCleanString(category)) {
      filtered = filtered.filter((p) => p.category === category.trim());
    }

    if (model && model !== 'All' && isCleanString(model)) {
      filtered = filtered.filter((p) => p.targetModel === model.trim());
    }

    if (isCleanString(search)) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.prompt.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (sort === 'popular') {
      filtered.sort((a, b) => (b.copies || 0) - (a.copies || 0));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prompts created by logged-in user
export const getMyPrompts = async (req, res) => {
  try {
    if (getMongoStatus()) {
      const prompts = await Prompt.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.json(prompts);
    }

    const userId = req.user._id.toString();
    const userPrompts = memoryPrompts.filter((p) => p.user?.toString() === userId || p.userId === userId);
    return res.json(userPrompts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single prompt by ID
export const getPromptById = async (req, res) => {
  try {
    const { id } = req.params;

    if (getMongoStatus()) {
      const prompt = await Prompt.findById(id).populate('user', 'name email role');
      if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
      return res.json(prompt);
    }

    const prompt = memoryPrompts.find((p) => p._id === id);
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    return res.json(prompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new prompt
export const createPrompt = async (req, res) => {
  const { title, description, prompt, category, targetModel, tags } = req.body;

  if (!isCleanString(title) || !isCleanString(description) || !isCleanString(prompt)) {
    return res.status(400).json({ message: 'Please provide valid title, description, and prompt content.' });
  }

  const cleanTitle = sanitizeHtml(title.trim());
  const cleanDescription = sanitizeHtml(description.trim());
  const cleanPrompt = sanitizeHtml(prompt.trim());

  const tagsArray = Array.isArray(tags)
    ? tags.map((t) => (typeof t === 'string' ? sanitizeHtml(t.trim()) : '')).filter(Boolean)
    : typeof tags === 'string'
    ? tags.split(',').map((t) => sanitizeHtml(t.trim())).filter(Boolean)
    : [];

  try {
    if (getMongoStatus()) {
      const newPrompt = await Prompt.create({
        title: cleanTitle,
        description: cleanDescription,
        prompt: cleanPrompt,
        category: category || 'Software Development',
        targetModel: targetModel || 'General / Any LLM',
        tags: tagsArray,
        user: req.user._id,
        author: req.user.name || 'Community Member',
      });
      return res.status(201).json(newPrompt);
    }

    const newPrompt = {
      _id: 'prompt_' + Date.now(),
      title: cleanTitle,
      description: cleanDescription,
      prompt: cleanPrompt,
      category: category || 'Software Development',
      targetModel: targetModel || 'General / Any LLM',
      tags: tagsArray,
      user: req.user._id,
      userId: req.user._id.toString(),
      author: req.user.name || 'Community Member',
      copies: 0,
      likes: [],
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };

    memoryPrompts.unshift(newPrompt);
    return res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an existing prompt
export const updatePrompt = async (req, res) => {
  const { id } = req.params;
  const { title, description, prompt, category, targetModel, tags, isFeatured } = req.body;

  try {
    if (getMongoStatus()) {
      const existing = await Prompt.findById(id);
      if (!existing) return res.status(404).json({ message: 'Prompt not found' });

      const isOwner = existing.user.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden: You can only edit your own prompts.' });
      }

      if (isCleanString(title)) existing.title = sanitizeHtml(title.trim());
      if (isCleanString(description)) existing.description = sanitizeHtml(description.trim());
      if (isCleanString(prompt)) existing.prompt = sanitizeHtml(prompt.trim());
      if (isCleanString(category)) existing.category = category.trim();
      if (isCleanString(targetModel)) existing.targetModel = targetModel.trim();
      if (tags) {
        existing.tags = Array.isArray(tags)
          ? tags.map((t) => (typeof t === 'string' ? sanitizeHtml(t.trim()) : '')).filter(Boolean)
          : tags.split(',').map((t) => sanitizeHtml(t.trim())).filter(Boolean);
      }
      if (isAdmin && typeof isFeatured === 'boolean') {
        existing.isFeatured = isFeatured;
      }

      const updated = await existing.save();
      return res.json(updated);
    }

    const index = memoryPrompts.findIndex((p) => p._id === id);
    if (index === -1) return res.status(404).json({ message: 'Prompt not found' });

    const p = memoryPrompts[index];
    const isOwner = p.user?.toString() === req.user._id.toString() || p.userId === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own prompts.' });
    }

    memoryPrompts[index] = {
      ...p,
      title: isCleanString(title) ? sanitizeHtml(title.trim()) : p.title,
      description: isCleanString(description) ? sanitizeHtml(description.trim()) : p.description,
      prompt: isCleanString(prompt) ? sanitizeHtml(prompt.trim()) : p.prompt,
      category: isCleanString(category) ? category.trim() : p.category,
      targetModel: isCleanString(targetModel) ? targetModel.trim() : p.targetModel,
      tags: tags
        ? (Array.isArray(tags) ? tags : tags.split(',')).map((t) => sanitizeHtml(t.trim())).filter(Boolean)
        : p.tags,
      isFeatured: isAdmin && typeof isFeatured === 'boolean' ? isFeatured : p.isFeatured,
      updatedAt: new Date().toISOString(),
    };

    return res.json(memoryPrompts[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a prompt
export const deletePrompt = async (req, res) => {
  const { id } = req.params;

  try {
    if (getMongoStatus()) {
      const existing = await Prompt.findById(id);
      if (!existing) return res.status(404).json({ message: 'Prompt not found' });

      const isOwner = existing.user.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own prompts.' });
      }

      await existing.deleteOne();
      return res.json({ message: 'Prompt deleted successfully.' });
    }

    const index = memoryPrompts.findIndex((p) => p._id === id);
    if (index === -1) return res.status(404).json({ message: 'Prompt not found' });

    const p = memoryPrompts[index];
    const isOwner = p.user?.toString() === req.user._id.toString() || p.userId === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own prompts.' });
    }

    memoryPrompts.splice(index, 1);
    return res.json({ message: 'Prompt deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment copy counter when user copies prompt to clipboard
export const copyPrompt = async (req, res) => {
  const { id } = req.params;

  try {
    if (getMongoStatus()) {
      const prompt = await Prompt.findByIdAndUpdate(
        id,
        { $inc: { copies: 1 } },
        { new: true }
      );
      if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
      return res.json({ message: 'Copy tracked', copies: prompt.copies });
    }

    const p = memoryPrompts.find((m) => m._id === id);
    if (p) {
      p.copies = (p.copies || 0) + 1;
      return res.json({ message: 'Copy tracked', copies: p.copies });
    }
    return res.status(404).json({ message: 'Prompt not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle upvote / like on a prompt
export const toggleLikePrompt = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    if (getMongoStatus()) {
      const prompt = await Prompt.findById(id);
      if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

      const hasLiked = prompt.likes.includes(userId);
      if (hasLiked) {
        prompt.likes = prompt.likes.filter((uid) => uid.toString() !== userId.toString());
      } else {
        prompt.likes.push(userId);
      }

      await prompt.save();
      return res.json({ liked: !hasLiked, totalLikes: prompt.likes.length });
    }

    const p = memoryPrompts.find((m) => m._id === id);
    if (!p) return res.status(404).json({ message: 'Prompt not found' });

    if (!p.likes) p.likes = [];
    const uidStr = userId.toString();
    const hasLiked = p.likes.includes(uidStr);

    if (hasLiked) {
      p.likes = p.likes.filter((u) => u !== uidStr);
    } else {
      p.likes.push(uidStr);
    }

    return res.json({ liked: !hasLiked, totalLikes: p.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Category Statistics for navigation counters
export const getCategoriesStats = async (req, res) => {
  try {
    let allPrompts = [];
    if (getMongoStatus()) {
      allPrompts = await Prompt.find();
    } else {
      allPrompts = memoryPrompts;
    }

    const total = allPrompts.length;
    const categoriesCount = {};
    const modelsCount = {};

    allPrompts.forEach((p) => {
      categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
      modelsCount[p.targetModel] = (modelsCount[p.targetModel] || 0) + 1;
    });

    return res.json({
      totalPrompts: total,
      categories: categoriesCount,
      models: modelsCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
