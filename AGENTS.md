# Agent Guidelines

## Styling

- **Always use Tailwind CSS** for all styling in this project
- Never add custom CSS or inline styles to components
- Components should be minimally styled and expose `class-name` props to allow customers to style them with their own Tailwind classes

## Tailwind Integration

The Tailwind integration works by injecting styles into components that have a CSS file. For components that accept Tailwind classes via props (like `class-name`), you must:

1. Create an empty CSS file next to the component (e.g., `my-component.css`)
2. Add `styleUrl: "my-component.css"` to the `@Component` decorator

This is only needed for components that render elements accepting Tailwind classes. Wrapper components that just render `<slot />` don't need CSS files.
