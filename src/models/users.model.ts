import mongoose, { Document, Schema } from 'mongoose';

// user interface
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  role: string;
  verified: boolean;
  password: string;
  username: string;
  email: string;
  resetPassword: string;
  accessToken: string;
  refreshToken: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
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
  },
  { timestamps: true }
);

const fUserSchema = mongoose.model<IUser>('Users', userSchema);
export default fUserSchema;
