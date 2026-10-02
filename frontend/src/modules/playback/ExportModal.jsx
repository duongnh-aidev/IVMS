export default function ExportModal({
  closeExport,
  doExport,
  exCamsLabel,
  exDuration,
  exError,
  exFormats,
  exFrom,
  exTo,
  exWm,
  pbDateLabel,
  setExFrom,
  setExTo,
  toggleExWm,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(23,26,32,.32)',
      }}
    >
      <div onClick={closeExport} style={{ position: 'absolute', inset: 0 }} />
      <div
        style={{
          position: 'relative',
          width: 420,
          maxWidth: '100%',
          background: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.14),0 24px 60px rgba(0,0,0,.24)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#171A20' }}>Export video</div>
          <div style={{ fontSize: 13, color: '#5C5E62' }}>
            {exCamsLabel} · {pbDateLabel}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>From</span>
            <input
              value={exFrom}
              onChange={setExFrom}
              placeholder="HH:MM:SS"
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                border: '1px solid #D0D1D2',
                borderRadius: 6,
                background: '#FFFFFF',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 13,
                color: '#171A20',
                outline: 'none',
              }}
              className="focus-ring"
            />
          </label>
          <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>To</span>
            <input
              value={exTo}
              onChange={setExTo}
              placeholder="HH:MM:SS"
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                border: '1px solid #D0D1D2',
                borderRadius: 6,
                background: '#FFFFFF',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 13,
                color: '#171A20',
                outline: 'none',
              }}
              className="focus-ring"
            />
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Format</span>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: '#F4F4F4', borderRadius: 7 }}>
            {exFormats.map((o, i) => (
              <button
                key={i}
                onClick={o.onClick}
                style={{
                  flex: 1,
                  height: 28,
                  border: 'none',
                  borderRadius: 5,
                  background: o.bg,
                  color: o.color,
                  boxShadow: o.shadow,
                  font: 'inherit',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={exWm}
            onChange={toggleExWm}
            style={{ width: 14, height: 14, margin: '2px 0 0', accentColor: '#3E6AE1' }}
          />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Digital signature & watermark</span>
            <span style={{ fontSize: 12, lineHeight: '17px', color: '#5C5E62' }}>
              Proves the file hasn't been altered when used as evidence.
            </span>
          </span>
        </label>
        {exError && <div style={{ fontSize: 12, color: '#C62828' }}>{exError}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 12, color: '#5C5E62' }}>{exDuration}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={closeExport}
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
              }}
              className="hover-bg-f4f4f4"
            >
              Cancel
            </button>
            <button
              onClick={doExport}
              style={{
                height: 34,
                padding: '0 18px',
                border: 'none',
                borderRadius: 6,
                background: '#3E6AE1',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'background-color .33s',
              }}
              className="hover-bg-3457c0"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
