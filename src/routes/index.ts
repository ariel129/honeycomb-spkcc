import express from 'express'; 
import Root from './Root';

const api = express();
 
api.use('/root', Root);

export default api;
