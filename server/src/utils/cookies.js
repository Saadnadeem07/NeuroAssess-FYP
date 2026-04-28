const {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  MS,
} = require("./constants");

const isProd = () => process.env.NODE_ENV === "production";

const baseOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "strict",
  path: "/",
});

const accessCookieOptions = () => ({
  ...baseOptions(),
  maxAge: 15 * MS.MINUTE,
});

const refreshCookieOptions = () => ({
  ...baseOptions(),
  maxAge: 7 * MS.DAY,
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions());
  if (refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  }
};

const clearAuthCookies = (res) => {
  const opts = { ...baseOptions(), maxAge: 0 };
  res.cookie(ACCESS_COOKIE_NAME, "", opts);
  res.cookie(REFRESH_COOKIE_NAME, "", opts);
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions,
  setAuthCookies,
  clearAuthCookies,
};
