export default function IdeasPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.2)',
          }}
        >
          <span className="text-white font-bold">E</span>
        </div>
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Welcome to EZVibe
        </h2>
        <p
          className="mt-2 max-w-[280px] text-[13px] leading-relaxed"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Select an idea from the sidebar to open its terminal, or create a new one to get started.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-2xl">💬</div>
            <p className="mt-1 text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Explore</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
          <div className="text-center">
            <div className="text-2xl">📋</div>
            <p className="mt-1 text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Plan</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
          <div className="text-center">
            <div className="text-2xl">⚡</div>
            <p className="mt-1 text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Build</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
          <div className="text-center">
            <div className="text-2xl">✅</div>
            <p className="mt-1 text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Done</p>
          </div>
        </div>
      </div>
    </div>
  );
}
