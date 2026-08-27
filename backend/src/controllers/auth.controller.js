import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { sessionCookieClearOptions, sessionCookieName } from '../config/session-cookie.js';

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };
}

export async function login(request, response, next) {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';

  if (!username || !password) {
    return response.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const [[user]] = await pool.execute(
      `SELECT id, username, password_hash, full_name, email, role, is_active
       FROM users WHERE username = ? LIMIT 1`,
      [username],
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({ message: 'Invalid username or password' });
    }
    if (!user.is_active) return response.status(403).json({ message: 'This account is inactive. Contact the organizer.' });

    request.session.regenerate((error) => {
      if (error) return next(error);

      const safeUser = publicUser(user);
      request.session.user = safeUser;
      request.session.save((saveError) => {
        if (saveError) return next(saveError);
        return response.json({ user: safeUser });
      });
    });
  } catch (error) {
    next(error);
  }
}

export function logout(request, response, next) {
  request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie(sessionCookieName, sessionCookieClearOptions);
    return response.json({ success: true });
  });
}

export function getCurrentUser(request, response) {
  response.json({ user: request.session.user });
}
