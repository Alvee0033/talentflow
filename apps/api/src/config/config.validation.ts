import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_PORT: Joi.number().default(3001),
  APP_NAME: Joi.string().default('TalentFlow'),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
  API_URL: Joi.string().uri().default('http://localhost:3001'),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('talentflow'),
  DB_PASSWORD: Joi.string().default('talentflow_dev_password'),
  DB_DATABASE: Joi.string().default('talentflow_dev'),
  DB_SSL: Joi.boolean().default(false),
  DB_SYNCHRONIZE: Joi.boolean().default(true),
  DB_LOGGING: Joi.boolean().default(true),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  STORAGE_ENDPOINT: Joi.string().allow('').optional(),
  STORAGE_ACCESS_KEY: Joi.string().allow('').optional(),
  STORAGE_SECRET_KEY: Joi.string().allow('').optional(),
  STORAGE_BUCKET: Joi.string().default('talentflow-documents'),
  STORAGE_REGION: Joi.string().default('us-east-1'),
  STORAGE_SIGNED_URL_EXPIRY: Joi.number().default(900),

  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(1025),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASSWORD: Joi.string().allow('').optional(),
  SMTP_FROM_NAME: Joi.string().default('TalentFlow'),
  SMTP_FROM_EMAIL: Joi.string().default('noreply@talentflow.anwargroup.com'),

  JWT_SECRET: Joi.string().default('dev_secret_key_for_anwar_talentflow_recruitment_system_jwt'),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(12),
}).unknown(true);
