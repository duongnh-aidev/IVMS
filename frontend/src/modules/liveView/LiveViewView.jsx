import { useController } from '../../core/mvc';

export default function LiveViewView({ controller }) {
  const {
    deviceCount,
    deviceList,
    goPlayback,
    gridCols,
    hasDevices,
    isEmpty,
    layouts,
    noPinned,
    openAdd,
    pinnedCount,
    pinnedCountColor,
    pinnedList,
    tiles,
  } = useController(controller);
  return (
    <>
      <header
        style={{
          height: 64,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 24px 0',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600 }}>Live View</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: '#F4F4F4', borderRadius: 7 }}>
            {layouts.map((l, i) => (
              <button
                key={i}
                onClick={l.onClick}
                title={l.title}
                style={{
                  minWidth: 34,
                  height: 26,
                  padding: '0 8px',
                  border: 'none',
                  borderRadius: 5,
                  background: l.bg,
                  color: l.color,
                  boxShadow: l.shadow,
                  font: 'inherit',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color .33s,color .33s',
                }}
              >
                {l.n}
              </button>
            ))}
          </div>
          <button
            onClick={goPlayback}
            style={{
              height: 32,
              padding: '0 14px',
              border: 'none',
              borderRadius: 6,
              background: '#171A20',
              color: '#FFFFFF',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'background-color .33s',
            }}
            className="hover-bg-393c41"
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
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" />
            </svg>
            Playback
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, padding: '16px 24px 24px', display: 'flex' }}>
        {isEmpty && (
          <div
            style={{
              flex: 1,
              borderRadius: 12,
              background: '#F4F4F4',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 48,
              padding: 32,
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3E6AE1',
                }}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7h12v10H3zM15 10.5l6-3.5v10l-6-3.5" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div style={{ fontSize: 20, lineHeight: '26px', fontWeight: 600 }}>No devices yet</div>
                <div style={{ fontSize: 13, lineHeight: '20px', color: '#5C5E62', maxWidth: 340, textWrap: 'pretty' }}>
                  Add a camera or NVR to start monitoring live video.
                </div>
              </div>
              <button
                onClick={openAdd}
                style={{
                  height: 36,
                  padding: '0 18px',
                  border: 'none',
                  borderRadius: 6,
                  background: '#3E6AE1',
                  color: '#FFFFFF',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'background-color .33s',
                }}
                className="hover-bg-3457c0"
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
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add device
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#5C5E62',
                background: '#FFFFFF',
                padding: '10px 14px',
                borderRadius: 6,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5C5E62"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01" />
              </svg>
              <span>
                Need help? Contact{' '}
                <a href="mailto:support@ivms.vn" style={{ color: '#171A20', textDecoration: 'underline' }}>
                  support@ivms.vn
                </a>
              </span>
            </div>
          </div>
        )}
        {hasDevices && (
          <>
            <div
              style={{
                width: 224,
                flex: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                marginRight: 12,
                padding: '12px 8px',
                borderRadius: 12,
                background: '#F4F4F4',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 8px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#393C41' }}>Pinned</span>
                <span
                  style={{
                    height: 18,
                    padding: '0 6px',
                    borderRadius: 9,
                    background: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 500,
                    color: pinnedCountColor,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {pinnedCount}
                </span>
              </div>
              {noPinned && (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: '17px',
                    color: '#8E8E8E',
                    padding: '0 10px 4px',
                    textWrap: 'pretty',
                  }}
                >
                  Pin a device to show it in the grid.
                </div>
              )}
              {pinnedList.map((d, i) => (
                <div
                  key={i}
                  onMouseEnter={d.onEnter}
                  onMouseLeave={d.onLeave}
                  onClick={d.onSelect}
                  style={{
                    height: 34,
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 6px 0 10px',
                    borderRadius: 6,
                    background: d.bg,
                    fontSize: 13,
                    color: '#171A20',
                    cursor: 'default',
                    transition: 'background-color .2s',
                  }}
                >
                  <span
                    style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {d.name}
                  </span>
                  {d.showPin && (
                    <button
                      onClick={d.onPin}
                      title={d.pinTitle}
                      style={{
                        width: 24,
                        height: 24,
                        flex: 'none',
                        border: 'none',
                        borderRadius: 5,
                        background: d.pinBg,
                        color: d.pinColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={d.pinFill}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <div style={{ height: 1, background: '#E2E3E5', margin: '10px 6px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px 8px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#393C41' }}>All devices</span>
                <span
                  style={{
                    height: 18,
                    padding: '0 6px',
                    borderRadius: 9,
                    background: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#5C5E62',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {deviceCount}
                </span>
              </div>
              {deviceList.map((d, i) => (
                <div
                  key={i}
                  onMouseEnter={d.onEnter}
                  onMouseLeave={d.onLeave}
                  onClick={d.onSelect}
                  style={{
                    height: 34,
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 6px 0 10px',
                    borderRadius: 6,
                    background: d.bg,
                    fontSize: 13,
                    color: '#171A20',
                    cursor: 'default',
                    transition: 'background-color .2s',
                  }}
                >
                  <span
                    style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {d.name}
                  </span>
                  {d.showPin && (
                    <button
                      onClick={d.onPin}
                      title={d.pinTitle}
                      style={{
                        width: 24,
                        height: 24,
                        flex: 'none',
                        border: 'none',
                        borderRadius: 5,
                        background: d.pinBg,
                        color: d.pinColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={d.pinFill}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: gridCols,
                gridTemplateRows: gridCols,
                gap: 4,
              }}
            >
              {tiles.map((t, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: t.bg,
                  }}
                >
                  {t.cam && (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(135deg,#1d2027 0 12px,#191c22 12px 24px)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: 11,
                          color: '#5C5E62',
                        }}
                      >
                        camera feed
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#FFFFFF',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E5484D' }} />
                        LIVE
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          left: 10,
                          right: 10,
                          bottom: 8,
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          fontSize: 12,
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                        <span style={{ color: '#D0D1D2', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
                          {t.id}
                        </span>
                      </div>
                    </>
                  )}
                  {t.empty && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#8E8E8E',
                      }}
                    >
                      No device selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
