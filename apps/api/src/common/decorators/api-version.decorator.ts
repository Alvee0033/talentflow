import { Version } from '@nestjs/common';

export const ApiVersion = (version: string) => Version(version);
