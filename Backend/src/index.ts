import express from 'express';
import bodyParser from 'body-parser';

import authRoute from "./routes/authRoute";
import userRoute from "./routes/userRoute";
import categoryRoute from "./routes/categoryRoute";
import productRoute from "./routes/productRoute";

import dotenv from 'dotenv';


const app = express();
dotenv.config();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const prefix = '/backend/api';

app.use(prefix +"/auth", authRoute);
app.use(prefix +"/user",userRoute);
app.use(prefix +"/category",categoryRoute);
app.use(prefix +"/product", productRoute);

const port = process.env.PORT || 7001;
app.listen(port, () => console.log(`Listening on port ${port}`));