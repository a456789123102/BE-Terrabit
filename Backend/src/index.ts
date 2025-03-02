import express from 'express';
import bodyParser from 'body-parser';

import authRoute from "./routes/users/authRoute";
import userRoute from "./routes/users/userRoute";
import addressRoute from "./routes/address/addressRoute";
import categoryRoute from "./routes/product/categoryRoute";
import productRoute from "./routes/product/productRoute";
import reviewRoute from "./routes/review/reviewRoute";
import productImageRoute from "./routes/product/productImageRoute";
import careerRoute from "./routes/career/careerRoute";
import cartRoute from "./routes/cart/cartRoute"
import slipImageRoute from "./routes/cart/slipImageRoute";
import orderRoute from "./routes/order/orderRoute";
import notificationRoute from "./routes/notification/notificationRoute";
import ticketRoute from "./routes/ticket/ticketRoute";
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
 app.use(prefix +"/address", addressRoute);
app.use(prefix +"/reviews", reviewRoute);
app.use(prefix+ "/productImage",productImageRoute);
app.use(prefix+ "/career",careerRoute);
app.use(prefix+ "/cart",cartRoute);
app.use(prefix+ "/slipImage",slipImageRoute);
app.use(prefix+ "/order",orderRoute);
app.use(prefix+ "/notification",notificationRoute);
app.use(prefix+ "/ticket",ticketRoute);
const port = process.env.PORT || 8001;
app.listen(port, () => console.log(`Listening on port ${port}`));