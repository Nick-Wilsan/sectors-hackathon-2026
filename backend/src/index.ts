import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { router } from './routes/index.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', router);

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
