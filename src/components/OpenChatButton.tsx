'use client';

export default function OpenChatButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('kk:open-chat'))}
      className="font-medium text-terracotta underline decoration-terracotta/30 underline-offset-4 hover:decoration-terracotta"
    >
      Chat with us
    </button>
  );
}