import express from 'express';
import { RootController } from 'src/Controller';

const Root = express();

Root.get('/start', RootController().Start);
Root.get('/stats', RootController().Root);

export default Root;
