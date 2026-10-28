import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, BookOpen, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="landing-eyebrow">
            <BookOpen aria-hidden="true" />
            A calmer way to study
          </p>
          <h1 id="landing-title">
            Make your notes <span>stick.</span>
          </h1>
          <p className="landing-description">
            Turn the material you already have into flashcards with AI assistance.
            Review every card, make it yours, then save your deck.
          </p>
          <div className="landing-actions">
            <Button asChild size="lg" className="landing-primary-action">
              <Link to="/register">
                Create your first deck
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="landing-secondary-action">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
          <p className="landing-trust-note">
            <Check aria-hidden="true" />
            You review and approve every card before it is saved.
          </p>
        </div>

        <div className="study-preview" aria-label="Example of a study note turned into a flashcard">
          <div className="preview-topbar">
            <div className="preview-window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="preview-caption">A study session, simplified</span>
            <Sparkles className="preview-sparkle" aria-hidden="true" />
          </div>
          <div className="preview-content">
            <div className="preview-source">
              <div className="preview-label">
                <span className="preview-step">01</span>
                Your notes
              </div>
              <div className="preview-note" aria-hidden="true">
                <span className="preview-note-line preview-note-line-short" />
                <span className="preview-note-line" />
                <span className="preview-note-line" />
                <span className="preview-note-line preview-note-line-medium" />
              </div>
              <span className="preview-note-caption">Paste material from your class notes</span>
            </div>

            <div className="preview-connector" aria-hidden="true">
              <span />
              <ArrowDownRight />
            </div>

            <div className="preview-result">
              <div className="preview-label">
                <span className="preview-step">02</span>
                A card to review
              </div>
              <article className="sample-flashcard">
                <span className="sample-card-label">Question</span>
                <h2>What is active recall?</h2>
                <div className="sample-card-divider" />
                <span className="sample-card-label">Answer</span>
                <p>Remembering information from memory, rather than rereading it.</p>
              </article>
              <span className="preview-note-caption">
                Edit it before you add it to your deck
              </span>
            </div>
          </div>
          <div className="preview-footer">
            <span className="preview-footer-mark"><Check aria-hidden="true" /></span>
            <p><strong>Your study material stays in your hands.</strong> AI helps draft; you decide what to keep.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works" aria-labelledby="how-it-works-title">
        <div className="how-it-works-heading">
          <p className="section-eyebrow">A simple loop</p>
          <h2 id="how-it-works-title">From notes to know-how.</h2>
        </div>
        <ol className="study-steps">
          <li>
            <span className="study-step-number">01</span>
            <span><strong>Bring your material</strong><small>Start with notes you already have.</small></span>
          </li>
          <li>
            <span className="study-step-number">02</span>
            <span><strong>Review your cards</strong><small>Edit or remove anything that needs work.</small></span>
          </li>
          <li>
            <span className="study-step-number">03</span>
            <span><strong>Save and study</strong><small>Your deck is yours to revisit.</small></span>
          </li>
        </ol>
      </section>
    </div>
  );
}
