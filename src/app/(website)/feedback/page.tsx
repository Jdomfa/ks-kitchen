import { FeedbackForm } from './FeedbackForm';

export default function FeedbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-coconut-cream px-6 py-12">
      <div className="w-full max-w-md">
        <FeedbackForm />
      </div>
    </div>
  );
}