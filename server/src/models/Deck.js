import mongoose from 'mongoose';

const { Schema } = mongoose;

const deckSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title is required'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
  },
  { timestamps: true }
);

// Supports looking up all decks owned by a user.
deckSchema.index({ userId: 1 });

const Deck = mongoose.model('Deck', deckSchema);

export { Deck };
export default Deck;