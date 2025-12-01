interface EnvironmentConfig {
  server: {
    port: number;
    host: string;
  };
}

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadEnvironmentVariables(): EnvironmentConfig {
  // Server configuration (with defaults)
  const serverPort = parseInt(process.env.PORT || "3000", 10);
  const serverHost = process.env.HOST || "localhost";

  return {
    server: {
      port: serverPort,
      host: serverHost,
    },
  };
}

// Export the configuration
export const config = loadEnvironmentVariables();

// Type-safe environment variable access
export function getEnvVar(key: keyof EnvironmentConfig): any {
  return config[key];
}

// Validate environment variables on startup
try {
  loadEnvironmentVariables();
} catch (error) {
  console.error("Environment validation failed:", error);
  process.exit(1);
}
