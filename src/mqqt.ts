import { config } from 'dotenv';
import { createServer, Server } from 'net';
import Aedes from 'aedes';

config();

const AEDESPORT = process.env.AEDESPORT || 1883;
const aedes = new Aedes();
const aedesServer: Server = createServer(aedes.handle);

aedesServer.listen(Number(AEDESPORT), () => {
  console.log(`MQTT server started on port ${AEDESPORT}`);
});

export default aedes;
