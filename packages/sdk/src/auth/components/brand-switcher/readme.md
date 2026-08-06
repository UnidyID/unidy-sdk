# u-brand-switcher



<!-- Auto Generated Below -->


## Overview

Lists the other brands the signing-in user has an account on, so they can continue there instead.

A brand is a separate login host, so switching is a navigation to that brand's `url` — the backend
derives the brand from the host it is called on. Place this inside the `<u-signin-step>` you want it
to appear in; the step controls visibility.

## Properties

| Property             | Attribute            | Description                                                                                      | Type      | Default |
| -------------------- | -------------------- | ------------------------------------------------------------------------------------------------ | --------- | ------- |
| `componentClassName` | `class-name`         | CSS classes to apply to the wrapper element.                                                     | `string`  | `""`    |
| `headingClassName`   | `heading-class-name` | CSS classes to apply to the heading.                                                             | `string`  | `""`    |
| `hideLogos`          | `hide-logos`         | If true, renders brand names without their logos.                                                | `boolean` | `false` |
| `itemClassName`      | `item-class-name`    | CSS classes to apply to each brand link.                                                         | `string`  | `""`    |
| `showCurrent`        | `show-current`       | If true, also lists the brand the user is currently on, turning this into a full brand selector. | `boolean` | `false` |


## Events

| Event           | Description                                                                                                                                             | Type                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `brandSelected` | Fired when a brand is chosen, before navigating to it. Call `preventDefault()` on the event to suppress the navigation and route to the brand yourself. | `CustomEvent<BrandSelectedEvent>` |


## Shadow Parts

| Part                    | Description |
| ----------------------- | ----------- |
| `"brand-switcher-link"` |             |
| `"brand-switcher-name"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
