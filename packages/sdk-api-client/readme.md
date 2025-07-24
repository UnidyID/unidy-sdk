# Unidy SDK API Client

This package provides a client for the Unidy SDK API. It allows you to interact with the API to manage newsletters and other resources.

## Installation

```bash
npm install @unidy/sdk-api-client
```

## Usage

The API client is implemented in the `ApiClient` class. You can use it to make requests to the API.

```typescript
import { ApiClient } from '@unidy/sdk-api-client';

const apiClient = new ApiClient({
  tenantId: 'YOUR_TENANT_ID',
  authHeader: 'YOUR_AUTH_HEADER',
});

// Make requests to the API
const response = await apiClient.post('/newsletters/subscribe', {
  email: 'test@example.com',
});
```

### Newsletters

The `Newsletters` class provides methods for interacting with the newsletters endpoint of the API.

```typescript
import { Newsletters } from '@unidy/sdk-api-client';

const newsletters = new Newsletters({
  tenantId: 'YOUR_TENANT_ID',
  authHeader: 'YOUR_AUTH_HEADER',
});

// Subscribe to a newsletter
const response = await newsletters.subscribe({
  email: 'test@example.com',
});
```

## API Reference

### `ApiClient`

The `ApiClient` class is the main entry point for making requests to the API.

#### `constructor(options)`

Creates a new instance of the `ApiClient`.

- `options.tenantId` (string, required): The ID of the tenant.
- `options.authHeader` (string, required): The authentication header.
- `options.apiHost` (string, optional): The host of the API. Defaults to `https://api.unidy.de`.

#### `post(endpoint, body)`

Makes a POST request to the specified endpoint.

- `endpoint` (string, required): The endpoint to make the request to.
- `body` (object, required): The body of the request.

### `Newsletters`

The `Newsletters` class provides methods for interacting with the newsletters endpoint of the API.

#### `constructor(options)`

Creates a new instance of the `Newsletters` class.

- `options.tenantId` (string, required): The ID of the tenant.
- `options.authHeader` (string, required): The authentication header.
- `options.apiHost` (string, optional): The host of the API. Defaults to `https://api.unidy.de`.

#### `subscribe(body)`

Subscribes a user to a newsletter.

- `body.email` (string, required): The email address of the user.
- `body.firstName` (string, optional): The first name of the user.
- `body.lastName` (string, optional): The last name of the user.
- `body.tags` (string[], optional): A list of tags to associate with the user.
- `body.doubleOptIn` (boolean, optional): Whether to use double opt-in. Defaults to `true`.
- `body.doubleOptInMail` (string, optional): The ID of the double opt-in mail to send.
- `body.redirectUrl` (string, optional): The URL to redirect to after the user has confirmed their subscription.
- `body.groupId` (string, required): The ID of the newsletter group to subscribe the user to.
