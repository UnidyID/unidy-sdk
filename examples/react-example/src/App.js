import UnidyNewsletter from "./UnidyNewsletter";

function App() {
  return <UnidyNewsletter
    title="Newsletters Demo 🚀"
    newsletters_config={[
      { internal_name: 'test', label: 'Subscribe to daily news', checked: true },
      { internal_name: 'other', label: 'Subscribe to clickbait articles' },
    ]}
    submit_button_text="Subscribe"
    email_placeholder="Enter your Email"
    apiUrl="http://localhost:3000"
    apiKey="8a4c2291e0c6214751140b7c9f66c92079b40b5ac9cd65d1203492b8144da1a0"
  />;
}

export default App;
