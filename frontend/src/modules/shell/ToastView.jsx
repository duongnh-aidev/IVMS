export default function ToastView({ closeToast, toastBg, toastErr, toastMsg, toastOk }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        minWidth: 320,
        maxWidth: 'calc(100% - 48px)',
        height: 44,
        padding: '0 8px 0 14px',
        borderRadius: 8,
        background: toastBg,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: '0 10px 28px rgba(0,0,0,.18)',
      }}
    >
      {toastOk && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: 'none' }}
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
      {toastErr && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ flex: 'none' }}
        >
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6" />
        </svg>
      )}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {toastMsg}
      </span>
      <button
        onClick={closeToast}
        title="Dismiss"
        style={{
          width: 28,
          height: 28,
          flex: 'none',
          padding: 0,
          border: 'none',
          borderRadius: 5,
          background: 'transparent',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background-color .2s',
        }}
        className="hover-bg-white-16"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
