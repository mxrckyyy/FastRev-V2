import mongoose from 'mongoose';

const { Schema } = mongoose;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator(value) {
          return EMAIL_REGEX.test(value);
        },
        message: 'Invalid email format',
      },
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: [1, 'Password hash is required'],
    },
  },
  { timestamps: true }
);

// Enforce uniqueness at the database level (not only as a Mongoose option).
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export { User };
export default User;