# Unidy SDK
This contains all the frontend SDK that enable our customers to seamlessly integrate Unidy into their frontend applications. We always keep in mind, that our customers have no developer resources or technical knowledge.

## Setting up the SDK

Install bun following the instructions on [bun.sh](https://bun.sh/).

```bash
# setup the central used node_modules
bun install
```

## Structure
This is a bun monorepo using bun. The `node_module` on the root folder structure are shared between all packages/SDK libraries that can be found in the `packages` folder. Refer to the individual package README files on how to develop and release them.
