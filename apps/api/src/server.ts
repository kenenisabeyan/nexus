import { buildApp } from "./app.js";

const app = buildApp();
const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, () => {
  console.log(`Nexus API listening on http://localhost:${PORT}`);
});

export default app;
