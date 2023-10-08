import { config } from 'dotenv';
import app from './app';
import http from 'http';

// load configuration
config();
const PORT = process.env.PORT || 3005;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
