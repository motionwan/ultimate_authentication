"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = require("dotenv");
// load environment variables
(0, dotenv_1.config)();
// create express app
const app = (0, express_1.default)();
// optional settings for react or any front end application
// const corsOption = {
//     credentials: true,
//     origin: ['http://localhost:3000', 'https://127.0.0.1:3000'],
//   };
// use json and cookie
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// connection to mongodb
//NB: ANY DATABASE CAN BE CONNECTED HERE
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((err) => {
    console.log(`Could not connect to MongoDB ${err.message}`);
});
//import the routes
const users_router_1 = __importDefault(require("./routers/users.router"));
//call the router imported above
app.use('/users', users_router_1.default);
exports.default = app;
