import { config } from 'dotenv';
import app from './app';
import http from 'http';
import aedes from './mqqt'; // Import the MQTT connection from the mqtt.ts module

// load configuration
config();
const PORT = process.env.PORT || 3005;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

// Now you can use the `aedes` MQTT connection in your routes/controllers
app.set('aedes', aedes);
