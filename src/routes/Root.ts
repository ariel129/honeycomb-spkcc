import express from 'express';
import { RootController } from '@src/controller';

const Root = express();

Root.get('/start', RootController().Start);
Root.get('/stats', RootController().Root);

export default Root;
