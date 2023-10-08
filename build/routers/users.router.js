"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_controller_1 = __importDefault(require("../controllers/users.controller"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const authController = new users_controller_1.default();
// create our routes
router.post('/', authController.register);
router.post('/login', authController.login);
router.post('/:id/verify/:token', authController.verify);
router.post('/logout', authController.logout);
router.post('/forgot_password', authController.forgotPassword);
router.post('/reset_password/:token', authController.resetPassword);
exports.default = router;
