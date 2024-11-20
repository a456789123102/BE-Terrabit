import express from 'express';
import bodyParser from 'body-parser';

import authRoute from "./routes/users/authRoute";
import userRoute from "./routes/users/userRoute";
import categoryRoute from "./routes/product/categoryRoute";
import productRoute from "./routes/product/productRoute";
import reviewRoute from "./routes/product/reviewRoute";
import imageRoute from "./routes/product/imageRoute";
import careerRoute from "./routes/career/careerRoute";
import cartRoute from "./routes/cart/cartRoute"
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
app.use(prefix +"/reviews", reviewRoute);
app.use(prefix+ "/image",imageRoute);
app.use(prefix+ "/career",careerRoute);
app.use(prefix+ "/cart",cartRoute);
const port = process.env.PORT || 7001;
app.listen(port, () => console.log(`Listening on port ${port}`));