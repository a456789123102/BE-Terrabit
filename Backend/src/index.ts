import express from 'express';
import bodyParser from 'body-parser';
import { verifyUser,verifyAdmin } from "./middlewares/verify";

import authRoute from "./routes/authRoute";
import userRoute from "./routes/userRoute";
import adminRoute from "./routes/adminRoute";

import dotenv from 'dotenv';


const app = express();
dotenv.config();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const prefix = '/backend/api';

app.use(prefix +"/auth", authRoute);
app.use(prefix +"/user",verifyUser, userRoute);
app.use(prefix +"/admin",verifyAdmin, adminRoute);

const port = process.env.PORT || 7001;
app.listen(port, () => console.log(`Listening on port ${port}`));