import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = process.env.PORT || 5000;
const app = createApp();

app.listen(port, () => {
  console.log(`FastRev server listening on port ${port}`);
});