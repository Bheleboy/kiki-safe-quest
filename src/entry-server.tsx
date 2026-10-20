import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import App from "./App";

export { publicRoutes, SITE_URL } from "./data/routes";

/** Renders a public route to static HTML for search engines and AI crawlers. */
export function render(path: string) {
  const context: { helmet?: HelmetServerState } = {};
  const markup = renderToString(
    <HelmetProvider context={context}>
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    </HelmetProvider>,
  );
  const h = context.helmet;
  const title = h?.title.toString() || "<title>Kiki Warrior</title>";
  return { markup, head: title + (h?.meta.toString() ?? "") + (h?.link.toString() ?? "") + (h?.script.toString() ?? "") };
}
