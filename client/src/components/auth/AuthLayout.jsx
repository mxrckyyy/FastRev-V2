import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AuthLayout({ title, description, children, asideTitle, asideDescription }) {
  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <div className="auth-layout">
        <div className="auth-aside">
          <span className="auth-mark" aria-hidden="true"><BookOpen /></span>
          <p className="section-eyebrow">FastRev / Study workspace</p>
          <h2>{asideTitle}</h2>
          <p>{asideDescription}</p>
          <div className="auth-aside-note">
            <span className="auth-aside-rule" aria-hidden="true" />
            <span>Build a deck that makes sense to you.</span>
          </div>
        </div>

        <Card className="auth-card">
          <div className="auth-card-heading">
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>
          {children}
        </Card>
      </div>
    </section>
  );
}
