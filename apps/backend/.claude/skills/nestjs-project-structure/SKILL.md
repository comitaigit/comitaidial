---
name: nestjs-project-structure
description: Reference material the user provided — "NestJS Project Structure: Best Practices for 2026" (Encore/Ivan Cernja). Covers feature-based vs layered folders, module design (@Global(), core/shared modules, lazy modules), DTO vs entity separation, config validation, testing layout, error handling, logging, monorepo/microservices notes, and common mistakes. Load when deciding where new backend code belongs, how to structure a new NestJS module, or when justifying/explaining this repo's backend architecture choices.
---

# NestJS Project Structure: Best Practices for 2026 (reference material)

Source: Encore blog, "NestJS Project Structure: Best Practices for 2026" — how to organize
modules, services, and shared code so the codebase scales. This repo's `apps/backend`
structure (see the `backend-conventions` skill and `apps/backend/AGENTS.md`) follows the
feature-based pattern this article recommends. Kept verbatim here as reference material —
**apps/backend/AGENTS.md is still the enforced, project-specific ruleset.**

Note: the article's closing section pitches Encore as a lighter alternative to NestJS for
small teams. This repo has already committed to NestJS — that section is included for
completeness but is not a live decision point here.

---

NestJS's biggest strength is that it hands you an architecture. Its biggest weakness is
that the architecture is open-ended: you still have to decide how modules relate, where
shared code lives, and how to keep things consistent as the app grows. A 5-controller
hello-world is fine. A 50-controller production backend with three teams contributing?
Structure starts to matter a lot.

This guide covers the structural decisions that actually affect maintainability, the
patterns that work, the ones that become regretful technical debt, and when it makes sense
to step back and reconsider whether NestJS's structure is still the right fit.

## The Starting Point

`nest new` gives you this:

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

That's fine for a demo. You'll outgrow it at 5-10 endpoints. What replaces it is the first
decision worth getting right.

## Folder Structures That Work

### Feature-based (recommended for most projects)

Group by feature, not by technical layer. Each feature is a module with everything it needs
(controllers, services, DTOs, entities, tests) in one folder.

```
src/
├── users/
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── entities/
│   │   └── user.entity.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── users.service.spec.ts
├── orders/
│   ├── dto/
│   ├── entities/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.module.ts
├── shared/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── app.module.ts
└── main.ts
```

Why this works:
- Moving a feature is moving one folder.
- Deleting a feature is deleting one folder.
- Finding code for a given domain is one place.
- New devs find their way around faster.

### Layered (avoid for anything non-trivial)

```
src/
├── controllers/
├── services/
├── dtos/
├── entities/
└── modules/
```

This mirrors an MVC frame, but breaks at scale. A change to "users" touches four folders.
Pull requests span unrelated files. Dependencies across layers become invisible.

Use feature-based unless you're writing a tutorial. Every NestJS codebase that grew past
20 controllers with a layered structure ends up regretting it.

## Module Design

NestJS modules are both an organizational and a runtime concept: they define what's
injectable where. Getting this right matters more than file layout.

### One module per feature

```ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // so other modules can inject it
})
export class UsersModule {}
```

Feature modules should export only what other modules need to inject. Don't export
everything by default.

### Shared module for cross-cutting concerns

Create a `SharedModule` for filters, interceptors, pipes, and utility providers that many
features use:

```ts
@Global()
@Module({
  providers: [LoggerService, HttpExceptionFilter],
  exports: [LoggerService, HttpExceptionFilter],
})
export class SharedModule {}
```

`@Global()` makes these available everywhere without re-importing. Use it sparingly, only
for genuinely cross-cutting concerns. Overusing `@Global()` recreates the "everything is
available everywhere" problem that modules were meant to solve.

### Core module for one-time setup

Some concerns (database connection, logger configuration, global interceptors) should only
initialize once. Put those in a `CoreModule`, imported only in `AppModule`:

```ts
@Module({
  imports: [TypeOrmModule.forRoot({ /* ... */ })],
  exports: [TypeOrmModule],
})
export class CoreModule {}
```

### Lazy modules

For large apps, consider loading some modules lazily:

```ts
@Module({ /* ... */ })
export class AdminModule {}

// In app.module.ts, use dynamic import in a route or feature flag
```

Lazy loading matters for serverless cold starts and very large apps. For most deployments,
eager loading is fine and simpler.

## DTOs and Entities

Keep DTOs (shape of data in/out of the API) and entities (database models) separate. They
look similar at first; they diverge over time.

- DTOs live in `<feature>/dto/`: validated with class-validator, used by controllers.
- Entities live in `<feature>/entities/`: annotated with TypeORM/Prisma/Drizzle decorators,
  used by services.

Never expose an entity directly from a controller. It leaks internal fields, locks you into
your DB schema, and makes API changes expensive.

```ts
// users/dto/user-response.dto.ts
export class UserResponseDto {
  id: number;
  email: string;
  name: string;
  // no password, no internal flags
}

// users/users.service.ts
async findOne(id: number): Promise<UserResponseDto> {
  const user = await this.repo.findOne(id);
  return { id: user.id, email: user.email, name: user.name };
}
```

A library like class-transformer with `@Exclude()` decorators can automate this, but be
explicit about which fields leave the service.

## Configuration

Use `@nestjs/config` with Joi or Zod schema validation:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
```

Fail fast if config is invalid. A NestJS app that starts with missing env vars and crashes
an hour later under load is worse than one that won't start at all.

*(This repo uses class-validator directly in `env.validation.ts` rather than Joi — same
fail-fast principle, see `apps/backend/AGENTS.md`.)*

## Testing Layout

Co-locate unit tests with the code they test:

```
users/
├── users.service.ts
└── users.service.spec.ts
```

Put e2e tests in a separate top-level folder:

```
test/
├── users.e2e-spec.ts
└── orders.e2e-spec.ts
```

NestJS's testing module lets you mock any provider in a single line, which is the real DX
win of the DI architecture:

```ts
const module = await Test.createTestingModule({
  providers: [
    UsersService,
    { provide: UsersRepository, useValue: mockRepository },
  ],
}).compile();
```

Use this for unit tests. For e2e, spin up the real `AppModule` with a test database and use
supertest.

## Error Handling

Centralize error handling with a filter:

```ts
// shared/filters/http-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

Register globally in `main.ts`:

```ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

This keeps error format consistent across every endpoint. Don't let individual controllers
format errors their own way.

*(This repo's equivalent is `AllExceptionsFilter` in `src/common/filters/` — same pattern,
plus it specifically avoids leaking internal error details for non-HttpException throws.)*

## Logging

Use a structured logger (Pino, Winston) wrapped as a NestJS provider. Don't use
`console.log`: you'll regret it when you add observability.

```ts
@Injectable()
export class AppLogger extends Logger {
  log(message: string, context?: string) {
    // structured JSON output
  }
}
```

Register in `main.ts` before anything else:

```ts
const app = await NestFactory.create(AppModule, {
  logger: new AppLogger(),
});
```

## Monorepo for Microservices

If you end up splitting into microservices, use `nest new --monorepo` (or set up a Turborepo
/ Nx workspace). Shared DTOs go in a `libs/` package imported by every service:

```
apps/
├── users-service/
├── orders-service/
└── gateway/
libs/
├── shared-dto/
├── shared-auth/
└── shared-logging/
```

This gets painful fast — versioning shared libs across services, keeping them in sync,
managing deploys — but there aren't great alternatives if you're committed to NestJS
microservices.

## Common Mistakes

- **Circular module dependencies.** NestJS will tell you with a `forwardRef()` warning. Fix
  the structure, don't paper over it.
- **Putting business logic in controllers.** Controllers handle HTTP, services handle
  business logic. Keep them thin.
- **Shared entity imports across microservices.** If service A imports service B's entity,
  you don't have microservices, you have a distributed monolith.
- **Manual dependency wiring bypassing DI.** If you `new UsersService()` instead of
  injecting it, you lose testability.
- **One giant AppModule.** If `app.module.ts` imports 40 feature modules, it's telling you
  something. Break it up with domain modules.

## When the Structure Itself Is the Problem

This is worth asking honestly: once you've set up modules, providers, DTOs, entities,
guards, interceptors, pipes, filters, and decorators, have you built much that delivers
business value?

NestJS's structure is a solution to a problem: keeping a large TypeScript backend coherent
across many developers. If you're a team of 2-5, the structure often costs more than it
earns. You're writing framework wiring instead of features.

### A lighter approach (Encore, the article's own framework — not used in this repo)

Encore takes a different position: the framework handles the structure decisions so you
don't have to. An Encore service is just a folder with an `encore.service.ts` file. An
endpoint is a function with typed parameters. There's no DI container, no module system,
no providers.

```
src/
├── users/
│   ├── encore.service.ts
│   ├── users.ts            // endpoints + business logic
│   └── migrations/         // database schema
├── orders/
│   ├── encore.service.ts
│   ├── orders.ts
│   └── migrations/
└── encore.app
```

Compare that to the NestJS equivalent. Same functionality, 80% less scaffolding. No modules
to register, no providers to inject, no DTOs to duplicate against entities.

```ts
// users/users.ts
import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Provisions managed Postgres, Docker locally, RDS or Cloud SQL in production.
const db = new SQLDatabase("users", { migrations: "./migrations" });

interface User {
  id: number;
  email: string;
  name: string;
}

export const get = api(
  { method: "GET", path: "/users/:id", expose: true },
  async ({ id }: { id: number }): Promise<User> => {
    return await db.queryRow`SELECT * FROM users WHERE id = ${id}`;
  },
);
```

What you don't write: a module declaration, a separate DTO class, a TypeORM entity with
decorators, controller → service → repository indirection, a testing module override.

What you get automatically: validation from the TypeScript types, an OpenAPI spec, a typed
client SDK, distributed tracing, infrastructure provisioned on AWS or GCP.

For a new backend, the article argues this is usually a better starting point than NestJS.
For an existing NestJS codebase (like this one), sticking with what you have is normally
right — the structural decisions are already made.

## FAQ (from the source article)

**What is the best folder structure for a NestJS project?**
For most NestJS projects, a feature-based structure works best: group each feature into its
own module folder containing its controllers, services, DTOs, entities, and tests. This
keeps related code in one place, so moving or deleting a feature is a single-folder
operation. Avoid a layered structure (separate `controllers/`, `services/`, `dtos/` folders)
for non-trivial apps, since a single change ends up touching many folders.

**Should I structure a NestJS app by feature or by layer?**
Structure by feature for anything beyond a tutorial. A feature-based layout groups all code
for a domain (users, orders) in one module folder, which keeps pull requests focused and
dependencies visible. A layered layout tends to break down as a project grows, since one
change forces edits across several folders.

**What is the difference between a DTO and an entity in NestJS?**
A DTO defines the shape of data going in and out of your API and is validated with
class-validator, while an entity models a database table (a TypeORM class with column
decorators, or a model in a Prisma schema). Keep them separate and never return an entity
directly from a controller, since doing so leaks internal fields and locks your API to your
database schema.

**When should I use a global module in NestJS?**
Use a global module (marked with `@Global()`) only for cross-cutting concerns such as a
logger, configuration, or shared filters and interceptors that most features need. Marking
it global makes its exported providers available everywhere without re-importing.
Overusing it recreates the everywhere-is-available problem that the module system was
designed to prevent, so keep it to a single `SharedModule`.

**How do you structure tests in a NestJS project?**
Co-locate unit tests next to the code they test using a `.spec.ts` suffix, and keep
end-to-end tests in a separate top-level `test/` folder with a `.e2e-spec.ts` suffix. For
unit tests, use the NestJS testing module to mock providers; for e2e tests, boot the real
`AppModule` against a test database and drive it with supertest.

**Do I need all of NestJS's structure for a small backend?**
For a team of two to five, much of NestJS's structure can cost more than it returns, since
you spend time on framework wiring instead of features. NestJS earns its structure on large
codebases with many contributors.
