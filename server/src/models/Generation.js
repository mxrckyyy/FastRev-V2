import mongoose from 'mongoose';

const { Schema } = mongoose;

const PROVIDERS = ['groq', 'cerebras', 'gemini'];
const STATUSES = ['reserved', 'completed', 'failed'];

const generationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    provider: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          if (value === undefined || value === null || value === '') return true;
          return PROVIDERS.includes(String(value).toLowerCase());
        },
        message: 'Provider must be one of: groq, cerebras, gemini',
      },
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: STATUSES,
        message: 'Status must be one of: reserved, completed, failed',
      },
      default: 'reserved',
    },
    cardCount: {
      type: Number,
      default: 0,
      min: [0, 'Card count cannot be negative'],
      validate: {
        validator(value) {
          return Number.isInteger(value);
        },
        message: 'Card count must be an integer',
      },
    },
    latencyMs: {
      type: Number,
      min: [0, 'Latency cannot be negative'],
    },
    error: {
      type: String,
      trim: true,
      maxlength: [500, 'Error must be at most 500 characters'],
    },
  },
  { timestamps: true }
);

// Supports retrieving a user's generation history.
generationSchema.index({ userId: 1 });

const Generation = mongoose.model('Generation', generationSchema);

export { Generation, PROVIDERS, STATUSES };
export default Generation;