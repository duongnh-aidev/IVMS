import { usePresenter } from '../../core/viper';

export default function DeviceEditorView({ presenter }) {
  const {
    open,
    addCta,
    addError,
    addTitle,
    closeAdd,
    fIp,
    fIpBorder,
    fName,
    fNameBorder,
    fPass,
    fPassShown,
    fPassTitle,
    fPassType,
    fPath,
    fPathBorder,
    fPort,
    fPortBorder,
    fUser,
    fUserBorder,
    rtspUrl,
    setFIp,
    setFName,
    setFPass,
    setFPath,
    setFPort,
    setFUser,
    submitAdd,
    testBg,
    testColor,
    testConn,
    testLabel,
    testMsg,
    testing,
    toggleFPass,
  } = usePresenter(presenter);
  if (!open) return null;
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
      <div onClick={closeAdd} style={{ position: 'absolute', inset: 0 }} />
      <form
        onSubmit={submitAdd}
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
        <div style={{ fontSize: 17, fontWeight: 600, color: '#171A20' }}>{addTitle}</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Device name</span>
          <input
            value={fName}
            onChange={setFName}
            placeholder="e.g. Camera-05, Front Gate"
            style={{
              width: '100%',
              height: 34,
              padding: '0 10px',
              border: `1px solid ${fNameBorder}`,
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
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>IP address</span>
            <input
              value={fIp}
              onChange={setFIp}
              placeholder="192.168.1.120"
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                border: `1px solid ${fIpBorder}`,
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
          <label style={{ width: 96, flex: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>RTSP port</span>
            <input
              value={fPort}
              onChange={setFPort}
              placeholder="554"
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                border: `1px solid ${fPortBorder}`,
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
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Stream path</span>
          <input
            value={fPath}
            onChange={setFPath}
            placeholder="/Streaming/Channels/101"
            style={{
              width: '100%',
              height: 34,
              padding: '0 10px',
              border: `1px solid ${fPathBorder}`,
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '8px 10px',
            borderRadius: 6,
            background: '#F4F4F4',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, color: '#5C5E62' }}>Stream URL</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, color: '#171A20', wordBreak: 'break-all' }}>
            {rtspUrl}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={testConn}
            disabled={testing}
            style={{
              height: 34,
              border: '1px solid #D0D1D2',
              borderRadius: 6,
              background: '#FFFFFF',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              color: '#171A20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'background-color .2s',
            }}
            className="hover-bg-f4f4f4"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            </svg>
            {testLabel}
          </button>
          {testMsg && (
            <div
              style={{
                fontSize: 12,
                lineHeight: '17px',
                padding: '8px 10px',
                borderRadius: 6,
                background: testBg,
                color: testColor,
              }}
            >
              {testMsg}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>Username</span>
            <input
              value={fUser}
              onChange={setFUser}
              placeholder="e.g. admin"
              autoComplete="off"
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                border: `1px solid ${fUserBorder}`,
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
            <div style={{ position: 'relative', display: 'flex' }}>
              <input
                value={fPass}
                onChange={setFPass}
                type={fPassType}
                placeholder="Password"
                autoComplete="new-password"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 34,
                  padding: '0 36px 0 10px',
                  border: '1px solid #D0D1D2',
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
              <button
                type="button"
                onClick={toggleFPass}
                title={fPassTitle}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: 4,
                  width: 26,
                  height: 26,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 4,
                  color: '#5C5E62',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="hover-color-171a20"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {fPassShown && <path d="M3 3l18 18" />}
                </svg>
              </button>
            </div>
          </label>
        </div>
        {addError && <div style={{ fontSize: 12, color: '#C62828' }}>{addError}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={closeAdd}
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
            {addCta}
          </button>
        </div>
      </form>
    </div>
  );
}
