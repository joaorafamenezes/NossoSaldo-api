import express from "express";
import { router } from './routers/mainrouter';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/', router);

app.listen(port, () => {
  console.log(`API sendo executada na porta ---> ${port} <<---`);
});