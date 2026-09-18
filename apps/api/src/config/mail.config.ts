import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASSWORD,
  fromName: process.env.SMTP_FROM_NAME || 'TalentFlow',
  fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@talentflow.anwargroup.com',
}));
