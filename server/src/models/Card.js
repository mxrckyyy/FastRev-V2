import mongoose from 'mongoose';

const { Schema } = mongoose;

const cardSchema = new Schema(
  {
    deckId: {
      type: Schema.Types.ObjectId,
      ref: 'Deck',
      required: [true, 'Deck ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: [1, 'Question is required'],
      maxlength: [2000, 'Question must be at most 2000 characters'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      minlength: [1, 'Answer is required'],
      maxlength: [5000, 'Answer must be at most 5000 characters'],
    },
  },
  { timestamps: true }
);

// Supports listing cards for a deck (prefix deckId) and user-scoped queries.
cardSchema.index({ deckId: 1, userId: 1 });
cardSchema.index({ userId: 1 });

const Card = mongoose.model('Card', cardSchema);

export { Card };
export default Card;