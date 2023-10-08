import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './users.model';

interface IToken extends Document {
  token: string;
  userId: IUser['_id'];
}

const tokenSchema = new Schema<IToken>(
  {
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  },
  {
    timestamps: true,
  }
);

// Set TTL index to expire tokens after 30 minutes (1800 seconds)
tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const TokenModel = mongoose.model<IToken>('Tokens', tokenSchema);

export default TokenModel;
