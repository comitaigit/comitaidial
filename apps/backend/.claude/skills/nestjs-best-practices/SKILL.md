---
name: nestjs-best-practices
description: Reference material the user provided — "5 best practices for NestJS applications" (Mayank C / Tech Tonic). Covers modularization, dependency injection (interfaces over concrete classes), error handling + logging, consistent coding style, and comprehensive testing, each with before/after code samples. Load as a refresher on core NestJS DI/testing patterns when writing or reviewing backend code.
---

# 5 best practices for NestJS applications (reference material)

Source: Tech Tonic (Medium), "5 best practices for NestJS applications" by Mayank C. General
NestJS fundamentals — modularization, DI, error handling, style, testing. Complements the
more structure-focused `nestjs-project-structure` skill. Kept verbatim here as reference
material — `apps/backend/AGENTS.md` is the enforced, project-specific ruleset.

---

NestJS is a popular framework for building server-side applications in Node.js. It provides
a modular, flexible, and scalable architecture for building efficient and maintainable
applications. NestJS is heavily inspired by Angular and adopts many of its concepts, making
it a great choice for developers already familiar with the Angular ecosystem. With its
built-in support for Dependency Injection, Modules, and Pipes, NestJS enables developers to
write robust, testable, and loosely coupled code.

When building production-grade applications with NestJS, it's essential to follow best
practices that ensure maintainability, scalability, and reliability. Here's a summary of key
best practices to keep in mind for NestJS beginners:

1. **Modularize your application**: Organize your code into separate modules, each with a
   specific responsibility. This makes it easier to maintain, test, and reuse code.
2. **Use Dependency Injection**: Leverage NestJS's built-in Dependency Injection system to
   manage dependencies between modules and services, making your code more flexible and
   testable.
3. **Implement Error Handling and Logging**: Use exception filters and pipes to handle
   errors and exceptions, and integrate logging mechanisms to monitor and debug your
   application.
4. **Follow a Consistent Coding Style**: Enforce a consistent coding style throughout your
   application using tools like ESLint and Prettier.
5. **Write Comprehensive Tests**: Use Jest or Mocha to write unit tests, integration tests,
   and end-to-end tests for your application, ensuring your code is reliable, stable, and
   works as expected.

By following these best practices, you'll be able to build scalable, maintainable, and
efficient applications with NestJS. Let's go through each best practice in detail.

## Best practice 1 — Modularize your application

Modularizing your NestJS application is a crucial best practice that helps keep your code
organized, maintainable, and scalable. This involves breaking down your application into
smaller, independent modules, each with a specific responsibility. This approach enables you
to develop, test, and deploy individual modules without affecting the entire application.

**Benefits of Modularization**
- Easier Maintenance: With a modular architecture, you can update or fix individual modules
  without impacting the entire application.
- Improved Reusability: Modules can be reused across multiple applications, reducing code
  duplication.
- Faster Development: Developers can work on individual modules independently, speeding up
  the development process.
- Better Testing: Modularization makes it easier to write unit tests and integration tests
  for individual modules.

**Code Sample 1: Monolithic Approach**

Consider a simple NestJS application with a single module, `app.module.ts`, that handles
everything:

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [UsersModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

In this example, the `AppModule` imports and manages everything, making it a monolithic
module.

**Code Sample 2: Modular Approach**

Now, let's refactor the application to use a modular approach:

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

// products.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

In this refactored example, we've broken down the application into separate modules
(`AppModule`, `UsersModule`, and `ProductsModule`), each with its own specific
responsibility. This modular approach makes it easier to maintain, test, and reuse
individual modules.

## Best practice 2 — Use Dependency Injection

Dependency Injection (DI) is a design pattern that allows components to be loosely coupled,
making it easier to test, maintain, and extend your application. In NestJS, DI is built-in
and encouraged through the use of modules, providers, and injectors. By using DI, you can
decouple your components from specific implementations, making your code more flexible and
modular.

**Benefits of Dependency Injection**
- Loose Coupling: Components are no longer tightly coupled to specific implementations,
  making it easier to change or replace dependencies.
- Testability: Components are easier to test, as dependencies can be mocked or stubbed.
- Reusability: Components can be reused across multiple applications, as they're not tied
  to specific implementations.
- Flexibility: Components can be easily extended or modified, as dependencies can be
  swapped or updated.

**Code Sample 1: Tight Coupling**

Consider a simple NestJS service that uses a tight coupling approach:

```ts
// users.service.ts
import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll() {
    return this.usersRepository.findAll();
  }
}

// users.repository.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersRepository {
  async findAll() {
    // implementation
  }
}
```

In this example, the `UsersService` is tightly coupled to the `UsersRepository`
implementation.

**Code Sample 2: Dependency Injection**

Now, let's refactor the service to use Dependency Injection:

```ts
// users.service.ts
import { Injectable } from '@nestjs/common';
import { UsersRepositoryInterface } from './users.repository.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepositoryInterface) {}

  async findAll() {
    return this.usersRepository.findAll();
  }
}

// users.repository.interface.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class UsersRepositoryInterface {
  abstract findAll();
}

// users.repository.ts
import { Injectable } from '@nestjs/common';
import { UsersRepositoryInterface } from './users.repository.interface';

@Injectable()
export class UsersRepository extends UsersRepositoryInterface {
  async findAll() {
    // implementation
  }
}
```

In this refactored example, we've introduced an interface `UsersRepositoryInterface` and
made the `UsersService` dependent on this interface, rather than a specific implementation.
This allows us to swap out different implementations of the `UsersRepository` without
affecting the `UsersService`.

*(This repo's services generally inject concrete classes like `PrismaService` directly
rather than interfaces — reasonable for a single-implementation dependency like a DB client.
Reach for an interface/abstract-class seam like this example when a dependency genuinely
has (or will have) more than one implementation, e.g. swapping a real email sender for a
test double.)*

## Best practice 3 — Implement Error Handling and Logging

Error handling and logging are crucial aspects of building robust and maintainable
applications. NestJS provides a built-in mechanism for handling errors and logging, making
it easier to detect, diagnose, and resolve issues. By implementing error handling and
logging, you can ensure that your application remains stable, secure, and performs
optimally.

**Benefits of Error Handling and Logging**
- Improved Reliability: Errors are caught and handled gracefully, preventing application
  crashes and downtime.
- Faster Debugging: Logs provide valuable insights into application behavior, making it
  easier to identify and fix issues.
- Enhanced Security: Errors and logs can be used to detect and respond to security threats
  and vulnerabilities.
- Better User Experience: Errors are handled transparently, ensuring a seamless user
  experience.

**Code Sample 1: Basic Error Handling**

Consider a simple NestJS controller that handles errors using the built-in `HttpException`
mechanism:

```ts
// users.controller.ts
import { Controller, Get, HttpException } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  async findAll() {
    try {
      // code that may throw an error
    } catch (error) {
      throw new HttpException('Error fetching users', 500);
    }
  }
}
```

In this example, the `UsersController` catches errors and throws an `HttpException` with a
descriptive message and status code.

**Code Sample 2: Advanced Error Handling and Logging**

Now, let's refactor the controller to use a more advanced error handling and logging
approach:

```ts
// users.controller.ts
import { Controller, Get, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/logger';

@Injectable()
export class UsersController {
  constructor(private readonly logger: Logger) {}

  @Get()
  async findAll() {
    try {
      // code that may throw an error
    } catch (error) {
      this.logger.error('Error fetching users', error);
      throw new HttpException('Error fetching users', 500);
    }
  }
}
```

In this refactored example, we've injected the `Logger` service into the `UsersController`
and used it to log errors with descriptive messages and error details. We've also thrown an
`HttpException` to handle the error gracefully.

*(This repo centralizes this instead of per-controller try/catch: `AllExceptionsFilter` in
`src/common/filters/` catches everything globally and logs non-HttpException throws via
`Logger` — see `nestjs-project-structure` skill's Error Handling section for why
centralizing beats repeating this per-controller.)*

## Best practice 4 — Follow a Consistent Coding Style

Following a consistent coding style is essential for building maintainable, readable, and
scalable applications. Consistent coding style ensures that code is uniform, making it
easier for developers to understand and work with. NestJS provides a set of guidelines for
coding style, and by following these guidelines, you can ensure that your code is
consistent, readable, and maintainable.

**Benefits of Consistent Coding Style**
- Improved Readability: Code is easier to read and understand, reducing the time spent on
  debugging and maintenance.
- Faster Development: Developers can work more efficiently, as they're familiar with the
  coding style and conventions.
- Better Maintainability: Code is more maintainable, as consistent style makes it easier to
  identify and fix issues.
- Reduced Errors: Consistent coding style reduces errors, as developers are less likely to
  introduce inconsistencies and bugs.

**Code Sample 1: Inconsistent Coding Style**

```ts
// users.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  async findAll() {
    // code with inconsistent indentation, spacing, and naming conventions
  }
}
```

In this example, the `UsersController` has inconsistent indentation, spacing, and naming
conventions, making it harder to read and maintain.

**Code Sample 2: Consistent Coding Style**

```ts
// users.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  async findAll(): Promise<User[]> {
    // code with consistent indentation, spacing, and naming conventions
  }
}
```

In this refactored example, we've applied consistent coding style guidelines, including
consistent indentation, consistent spacing around operators and keywords, and consistent
naming conventions (PascalCase for classes and camelCase for variables).

*(This repo enforces this with the ESLint/Prettier config generated by `nest new` —
`apps/backend/eslint.config.mjs` — don't hand-format around it.)*

## Best practice 5 — Write Comprehensive Tests

Writing comprehensive tests is crucial for ensuring the reliability, stability, and
maintainability of your NestJS application. Tests help you catch bugs, validate
functionality, and prevent regressions. By writing comprehensive tests, you can ensure that
your application works as expected and meets the required standards.

**Benefits of Comprehensive Tests**
- Improved Reliability: Tests ensure that your application works correctly and consistently.
- Faster Debugging: Tests help you identify and fix issues quickly, reducing debugging time.
- Better Maintainability: Tests ensure that changes don't break existing functionality.
- Enhanced Confidence: Tests give you confidence in your code, allowing you to refactor and
  improve it.

**Code Sample 1: Unit Test**

```ts
// users.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findAll(): Promise<User[]> {
    // implementation
  }
}

// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should return an array of users', async () => {
    const result = await service.findAll();
    expect(result).toBeArray();
  });
});
```

In this example, we've written a unit test for the `UsersService` using Jest. The test
ensures that the `findAll` method returns an array of users.

**Code Sample 2: Integration Test**

```ts
// users.controller.ts
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}

// users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should return an array of users', async () => {
    const result = await controller.findAll();
    expect(result).toBeArray();
  });
});
```

In this example, we've written an integration test for the `UsersController` using Jest.
The test ensures that the `findAll` method returns an array of users, and also tests the
interaction between the controller and the service.
