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

## Releasing
Each package is released independently. First go to the package folder. Update the version in the `package.json`.
Run the build command, which will also update the generated `README.md` files in the package folder:

```bash
bun run build
```

Make a release commit with the updated `README.md` and `package.json` files and push it to the main branch.

Publish the package to npm (if you release a development version add a tag to avoid setting the latest tag to the release `--tag next`):

```bash
bun publish --access public
```

If you need to tag a previous package as latest use the `npm dist-tag` command:

```bash
npm dist-tag add @unidy.io/<package>@<version> latest
```

**_IMPORTANT:_** Use the latest version of the released SDK on the Unidy SDK Demo page, showcasing the new features and improvements.
