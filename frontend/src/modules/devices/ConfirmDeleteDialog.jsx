export default function ConfirmDeleteDialog({ cancelDel, delName, doDelete }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 21,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(23,26,32,.32)',
      }}
    >
      <div onClick={cancelDel} style={{ position: 'absolute', inset: 0 }} />
      <div
        style={{
          position: 'relative',
          width: 400,
          maxWidth: '100%',
          background: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.14),0 24px 60px rgba(0,0,0,.24)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#FCEDED',
            color: '#C62828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#171A20' }}>Delete {delName}?</div>
          <div style={{ fontSize: 13, lineHeight: '20px', color: '#5C5E62', textWrap: 'pretty' }}>
            The device will be removed from the system and from all layouts. This action can't be undone.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            onClick={cancelDel}
            style={{
              height: 34,
              padding: '0 16px',
              border: '1px solid #D0D1D2',
              borderRadius: 6,
              background: '#FFFFFF',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              color: '#171A20',
              cursor: 'pointer',
              transition: 'background-color .2s',
            }}
            className="hover-bg-f4f4f4"
          >
            Cancel
          </button>
          <button
            onClick={doDelete}
            style={{
              height: 34,
              padding: '0 18px',
              border: 'none',
              borderRadius: 6,
              background: '#D93025',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color .33s',
            }}
            className="hover-bg-b3261e"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
