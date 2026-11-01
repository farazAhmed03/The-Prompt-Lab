import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { getMongoStatus } from '../config/db.js';
import { loadStoredUsers, persistUsers } from '../config/storage.js';
import { isCleanString, sanitizeHtml } from '../utils/security.js';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@devops.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin03042002';
const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);

const defaultUsers = [
  {
    _id: 'admin_master',
    name: 'Site Administrator',
    email: adminEmail.toLowerCase(),
    password: hashedAdminPassword,
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

// Persistent user store
export let memoryUsers = loadStoredUsers(defaultUsers);

// Ensure admin exists in stored users and has latest credentials
const memoryAdminIdx = memoryUsers.findIndex((u) => u.role === 'admin' || u.email === adminEmail.toLowerCase());
if (memoryAdminIdx >= 0) {
  memoryUsers[memoryAdminIdx].email = adminEmail.toLowerCase();
  memoryUsers[memoryAdminIdx].password = hashedAdminPassword;
  persistUsers(memoryUsers);
} else {
  memoryUsers.unshift(defaultUsers[0]);
  persistUsers(memoryUsers);
}

export const findMemoryUserById = (id) => {
  const user = memoryUsers.find((u) => u._id === id);
  if (!user) return null;
  const { password, ...userWithoutPass } = user;
  return userWithoutPass;
};

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtkey_123456789_mern_blog',
    { expiresIn: '30d' }
  );
};

export const ensureAdminAccount = async () => {
  if (!getMongoStatus()) return;
  try {
    // 1. Check if an account already exists with admin@devops.com
    let existing = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existing) {
      existing.password = adminPassword;
      existing.role = 'admin';
      await existing.save();
      console.log(`[Auth] Master Administrator password synchronized: ${adminEmail}`);
      return;
    }

    // 2. Check if a legacy admin (e.g. admin@blog.com) exists and update it
    const legacyAdmin = await User.findOne({ role: 'admin' });
    if (legacyAdmin) {
      legacyAdmin.email = adminEmail.toLowerCase();
      legacyAdmin.password = adminPassword;
      await legacyAdmin.save();
      console.log(`[Auth] Migrated legacy administrator to: ${adminEmail}`);
      return;
    }

    // 3. Provision brand new admin account
    await User.create({
      name: 'Site Administrator',
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
    });
    console.log(`[Auth] Master Administrator account provisioned: ${adminEmail}`);
  } catch (err) {
    console.error('[Auth] Failed to seed admin account in DB:', err.message);
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!isCleanString(name) || !isCleanString(email) || !isCleanString(password)) {
    return res.status(400).json({ message: 'Name, email, and password are required and must be valid strings.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const cleanName = sanitizeHtml(name.trim());
  const cleanEmail = email.trim().toLowerCase();
  const assignedRole = 'user';

  try {
    if (getMongoStatus()) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name: cleanName,
        email: cleanEmail,
        password,
        role: assignedRole,
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }

    // In-memory persistent mode
    const userExists = memoryUsers.find((u) => u.email === cleanEmail);
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      _id: 'user_' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
      createdAt: new Date().toISOString(),
    };

    memoryUsers.push(newUser);
    persistUsers(memoryUsers); // Save to disk immediately

    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: generateToken(newUser._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!isCleanString(email) || !isCleanString(password)) {
    return res.status(400).json({ message: 'Please provide both valid email and password.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (getMongoStatus()) {
      const user = await User.findOne({ email: cleanEmail });
      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        });
      }
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // In-memory persistent mode
    const user = memoryUsers.find((u) => u.email === cleanEmail);
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
    return res.status(401).json({ message: 'Invalid email or password.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};

export const getAllUsers = async (req, res) => {
  try {
    if (getMongoStatus()) {
      const users = await User.find().select('-password');
      return res.json(users);
    }
    const safeUsers = memoryUsers.map(({ password, ...u }) => u);
    return res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
