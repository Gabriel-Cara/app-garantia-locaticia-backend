import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, env.HOST, () => {
  console.log(`HTTP server running on http://${env.HOST}:${env.PORT}`);
});