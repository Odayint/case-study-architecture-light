# TASK.md

## Overview

This submission implements the required User Authentication Service using the provided architecture and technology stack.

Implemented features:

* User registration
* User authentication (login)
* JWT token generation
* Password hashing
* Email validation
* Password strength validation
* Unique email enforcement
* Unit tests
* Integration tests

---

## Architecture

The existing architecture provided by the repository was preserved:

```text
Controller → Service → Repository → TypeORM
```

Responsibilities:

### Controllers

* Handle HTTP request/response concerns.
* Delegate business logic to services.

### Services

* Validate input.
* Handle authentication logic.
* Coordinate repositories and password management.
* Generate JWT tokens.

### Repositories

* Encapsulate database access.
* Provide user persistence and lookup operations.

### Dependency Injection

Inversify was used as provided by the boilerplate to wire controllers, services, and repositories.

---

## Security Decisions

### Password Hashing

Passwords are never stored in plaintext.

Passwords are hashed using Node.js crypto APIs before persistence.

Password verification uses timing-safe comparison to reduce timing attack risks.

### Authentication

Authentication is implemented using JWT.

A signed JWT token is returned after successful authentication.

JWT configuration is loaded from environment variables.

### Error Handling

Authentication failures return generic error messages:

```text
Invalid credentials
```

This avoids exposing whether an email exists in the system.

### Validation

Registration validates:

* Required fields
* Email format
* Email uniqueness
* Minimum password length
* Uppercase character requirement
* Lowercase character requirement
* Numeric character requirement

---

## Testing

Implemented:

### Unit Tests

* Password hashing service
* User registration flow
* User authentication flow
* Validation scenarios

### Integration Tests

* User registration endpoint
* User login endpoint
* Invalid authentication scenarios

Current test coverage exceeds the required 80%.

---

## Assumptions

* Email addresses must be unique.
* JWT authentication is sufficient for the scope of this challenge.
* Email verification and password reset functionality are outside the scope of the assignment.
* The provided architecture should be preserved rather than redesigned.

---

## Database Notes

The project does not currently include migrations.

For local development, the database schema was created manually for the User entity.
In a production environment I would introduce TypeORM migrations for schema management.

---

## Dependencies Added

### jsonwebtoken

Required to implement JWT-based authentication as specified in the challenge requirements.

### @types/jsonwebtoken

TypeScript type definitions for jsonwebtoken.

### @aws-sdk/client-ssm

Referenced by the provided datasource configuration.

---

## AI Usage

AI tooling was used as a development assistant for:

* Code review
* Test coverage review
* Documentation refinement

All implementation decisions, code changes, testing, and final verification were reviewed manually.

---

## Future Improvements

Given additional time, I would consider:

* Refresh token support
* Password reset functionality
* Email verification
* Rate limiting on authentication endpoints
* Database migrations
* Structured logging and monitoring
