import "./App.css";
import { UnidyNewsletter } from "newsletter-react";

function App() {
  return (
    <div className="App">
      <UnidyNewsletter
        api-key="public-newsletter-api-key"
        api-url="http://localhost:3000"
        email-placeholder="your@email.com"
        newsletters-config-json={JSON.stringify([
          {
            internalName: "main",
            label: "Main Newsletter",
            checked: true,
            preferences: [
              { internalName: "club_news", label: "Club News", checked: true },
              { internalName: "player_news", label: "Player News", checked: true },
              { internalName: "random_news", label: "Random News", checked: false },
            ],
          },
          {
            internalName: "yet-another",
            label: "Another Newsletter",
            checked: false,
            preferences: [],
          },
        ])}
      >
        <div slot="header">
          <h1>Newsletter header</h1>
        </div>
      </UnidyNewsletter>
    </div>
  );
}

export default App;
