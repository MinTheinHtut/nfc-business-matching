export const sessionCookieName = 'nfc.sid';
export const sessionLifetimeMs = 1000 * 60 * 60 * 8;

const isProduction = process.env.NODE_ENV === 'production';

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: sessionLifetimeMs,
  path: '/',
};

export const sessionCookieClearOptions = {
  httpOnly: sessionCookieOptions.httpOnly,
  sameSite: sessionCookieOptions.sameSite,
  secure: sessionCookieOptions.secure,
  path: sessionCookieOptions.path,
};
