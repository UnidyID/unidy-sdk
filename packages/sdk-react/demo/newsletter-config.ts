// Hardcoded newsletter config matching the Stencil SDK demo
export const NEWSLETTERS = [
  {
    internalName: "main",
    label: "Main Newsletter",
    defaultChecked: true,
    preferences: [
      { id: "player_news", label: "Player News", defaultChecked: false },
      { id: "club_news", label: "Club News", defaultChecked: true },
      { id: "random_news", label: "Random News", defaultChecked: false },
    ],
  },
  {
    internalName: "test",
    label: "Test Newsletter",
    defaultChecked: false,
    preferences: [
      { id: "captain1", label: "Captain News", defaultChecked: false },
      { id: "choco2", label: "Chocolate News", defaultChecked: false },
    ],
  },
] as const;

export type DemoNewsletter = (typeof NEWSLETTERS)[number];
export type DemoPreference = DemoNewsletter["preferences"][number];
