import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  sectorsApiKey: process.env.SECTORS_API_KEY ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
};

export { requireEnv };
