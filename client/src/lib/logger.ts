const isDev = (import.meta as any)?.env?.MODE === "development";

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
  if (isDev) {
    console.error(...args);
  } else {
    // In production, avoid printing full objects — log a brief message instead
    const [first, second] = args;
    if (second instanceof Error) {
      console.error(first, second.message);
    } else if (typeof first === "string") {
      console.error(first);
    } else {
      console.error("An error occurred");
    }
  }
};
