import AuthController from '../controllers/users.controller';
import express from 'express';

const router = express.Router();
const authController = new AuthController();

// create our routes
router.post('/', authController.register);
router.post('/login', authController.login);
router.post('/:id/verify/:token', authController.verify);
router.post('/logout', authController.logout);
router.post('/forgot_password', authController.forgotPassword);
router.post('/reset_password/:token', authController.resetPassword);

export default router;
