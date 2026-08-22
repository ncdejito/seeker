export interface Config {
  MODEL_PROVIDER: string
  OPENAI_API_KEY: string
  LOCAL_CV_PATH: string
  OBSCURA_BIN_PATH?: string
  OUTPUT_DIR?: string
  STATE_DIR?: string
  LOCAL_LLM_BASE_URL?: string
  PORT: number
  MAX_CONCURRENCY: number
  LOG_LEVEL: string
}

const requiredVars = ['MODEL_PROVIDER', 'OPENAI_API_KEY', 'LOCAL_CV_PATH']

export function loadConfig(): Config {
  const missingVars = requiredVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  return {
    MODEL_PROVIDER: process.env.MODEL_PROVIDER!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    LOCAL_CV_PATH: process.env.LOCAL_CV_PATH!,
    OBSCURA_BIN_PATH: process.env.OBSCURA_BIN_PATH,
    OUTPUT_DIR: process.env.OUTPUT_DIR,
    STATE_DIR: process.env.STATE_DIR,
    LOCAL_LLM_BASE_URL: process.env.LOCAL_LLM_BASE_URL,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    MAX_CONCURRENCY: process.env.MAX_CONCURRENCY ? parseInt(process.env.MAX_CONCURRENCY, 10) : 5,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  }
}
