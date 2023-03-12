import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Client } from '@hiveio/dhive';
import { CONFIG } from '@config';
import api from '@src/routes';
import { Pathwise } from '@src/utils';
import { AppStart } from './application';

const IPFS = require('ipfs-http-client-lite');
const level = require('level');

dotenv.config();

export const client = new Client(CONFIG.clients);
export const ipfs = IPFS(
  `${CONFIG.ipfsprotocol}://${CONFIG.ipfshost}:${CONFIG.ipfsport}`
);
export const store = Pathwise(level('./db', { createIfEmpty: true }));

(async () => {
  const app: Express = express();
  const port = process.env.PORT;

  const { dynStart } = AppStart();

  console.log(
    `IPFS: ${CONFIG.ipfshost == 'ipfs' ? 'DockerIPFS' : CONFIG.ipfshost}:${
      CONFIG.ipfsport
    }`
  );

  dynStart();

  app.use(cors());
  app.get('/', (_req: Request, res: Response) => {
    res.send('Server is running...');
  });

  app.use('/api/v1', api);

  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
})();
