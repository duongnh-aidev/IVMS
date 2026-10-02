export default function AddStorageModal({
  asError,
  asIsNet,
  asName,
  asNameBorder,
  asPass,
  asPath,
  asPathBorder,
  asPathLabel,
  asPathPh,
  asRoles,
  asTypes,
  asUser,
  asUserBorder,
  closeAddStorage,
  setAsName,
  setAsPass,
  setAsPath,
  setAsUser,
  submitStorage,
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
      <div onClick={closeAddStorage} style={{ position: 'absolute', inset: 0 }} />
      <form
        onSubmit={submitStorage}
        style={{
          position: 'relative',
          width: 420,
          maxWidth: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.14),0 24px 60px rgba(0,0,0,.24)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 600, color: '#171A20' }}>Add storage</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Name</span>
          <input
            value={asName}
            onChange={setAsName}
            placeholder="e.g. Disk 3, Backup NAS"
            style={{
              width: '100%',
              height: 34,
              padding: '0 10px',
              border: `1px solid ${asNameBorder}`,
              borderRadius: 6,
              background: '#FFFFFF',
              font: 'inherit',
              fontSize: 13,
              color: '#171A20',
              outline: 'none',
              transition: 'box-shadow .2s,border-color .2s',
            }}
            className="hover-border-aeb0b4 focus-ring"
          />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Type</span>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: '#F4F4F4', borderRadius: 7 }}>
            {asTypes.map((o, i) => (
              <button
                key={i}
                type="button"
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>{asPathLabel}</span>
          <input
            value={asPath}
            onChange={setAsPath}
            placeholder={asPathPh}
            style={{
              width: '100%',
              height: 34,
              padding: '0 10px',
              border: `1px solid ${asPathBorder}`,
              borderRadius: 6,
              background: '#FFFFFF',
              font: 'inherit',
              fontSize: 13,
              color: '#171A20',
              outline: 'none',
              transition: 'box-shadow .2s,border-color .2s',
            }}
            className="hover-border-aeb0b4 focus-ring"
          />
        </label>
        {asIsNet && (
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Username</span>
              <input
                value={asUser}
                onChange={setAsUser}
                placeholder="e.g. admin"
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 10px',
                  border: `1px solid ${asUserBorder}`,
                  borderRadius: 6,
                  background: '#FFFFFF',
                  font: 'inherit',
                  fontSize: 13,
                  color: '#171A20',
                  outline: 'none',
                  transition: 'box-shadow .2s,border-color .2s',
                }}
                className="hover-border-aeb0b4 focus-ring"
              />
            </label>
            <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Password</span>
              <input
                type="password"
                value={asPass}
                onChange={setAsPass}
                placeholder="Password"
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 10px',
                  border: '1px solid #D0D1D2',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  font: 'inherit',
                  fontSize: 13,
                  color: '#171A20',
                  outline: 'none',
                }}
                className="focus-ring"
              />
            </label>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Role</span>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: '#F4F4F4', borderRadius: 7 }}>
            {asRoles.map((o, i) => (
              <button
                key={i}
                type="button"
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
        {asError && <div style={{ fontSize: 12, color: '#C62828' }}>{asError}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={closeAddStorage}
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
            type="submit"
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
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
