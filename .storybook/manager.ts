import { addons } from "storybook/manager-api"
import { create } from "storybook/theming"

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Tuus Imago — Design System",
    brandUrl: "/",
  }),
  sidebar: {
    showRoots: true,
  },
})
