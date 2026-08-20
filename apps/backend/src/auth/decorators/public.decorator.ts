import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as not requiring authentication. Used with a global
 * JwtAuthGuard so the *default* is authenticated — opting out is explicit
 * and visible on the route, rather than opting in being forgettable.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
