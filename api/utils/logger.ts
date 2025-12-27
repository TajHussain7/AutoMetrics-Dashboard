export const isDev = process.env.NODE_ENV !== "production";

export const debug = (...args: any[]) => {
  if (isDev) console.debug(...args);
};

export const info = (...args: any[]) => {
  if (isDev) console.info(...args);
};

export const warn = (...args: any[]) => {
  console.warn(...args);
};

export const error = (...args: any[]) => {
  console.error(...args);
};
