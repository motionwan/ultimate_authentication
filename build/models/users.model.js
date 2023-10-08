"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    firstName: String,
    lastName: String,
    role: { type: String, default: 'user' },
    verified: { type: Boolean, required: true, default: false },
    email: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    resetPassword: { type: String, default: '' },
    accessToken: String,
    refreshToken: String,
}, { timestamps: true });
const fUserSchema = mongoose_1.default.model('Users', userSchema);
exports.default = fUserSchema;
