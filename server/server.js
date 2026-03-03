import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { ensureCoreProfile } from "./src/services/memory.service.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();
ensureCoreProfile();

app.listen(PORT, () => {
  console.log(`
=================================
🚀 Server running
🌍 URL: http://localhost:${PORT}
=================================
`);
});