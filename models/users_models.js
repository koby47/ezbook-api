import { Schema, model } from 'mongoose';
import normalize from 'normalize-mongoose';

const userSchema = new Schema({
  userName: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },

  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date }

}, { timestamps: true });

userSchema.plugin(normalize);

export const UserModel = model('user', userSchema);
