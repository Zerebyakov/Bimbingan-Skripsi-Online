import express from 'express'
import {  verifySession } from '../middleware/authMiddleware.js';
import { getProfile, login, logout, updatePassword, updateProfile } from '../controllers/UserController.js';
import { validateLogin, validateUpdatePassword, validateUpdateProfile } from '../middleware/validationMiddleware.js';



const router = express.Router();

// Auth routes
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.get('/profile', verifySession, getProfile);
router.put('/profile', verifySession, validateUpdateProfile,updateProfile);
router.put('/password', verifySession, validateUpdatePassword, updatePassword);

export default router;