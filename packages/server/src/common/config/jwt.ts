import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.APP_JWT_SECRET;

  if (!secret || secret.length < 32 || secret === '123123') {
    throw new Error(
      'APP_JWT_SECRET must be configured with at least 32 characters',
    );
  }
  return { secret };
});
