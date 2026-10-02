import { useElementWidth } from '../../core/useElementWidth';
import { usePresenter } from '../../core/viper';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

export default function DevicesView({ presenter }) {
  const { closeMenu, confirm, devCols, devRows, devTabs, devWide, grpList, menuAny, noRows, openAdd, q, setQ } =
    usePresenter(presenter);
  const devRef = useElementWidth(presenter.setTableWidth);
  return (
    <>
      <header style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 24px 0' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Devices</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8E8E8E"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ position: 'absolute', left: 10 }}
              >
                <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
              </svg>
              <input
                value={q}
                onChange={setQ}
                placeholder="Search name or IP"
                style={{
                  width: 220,
                  height: 32,
                  padding: '0 10px 0 30px',
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
            </div>
            <button
              onClick={openAdd}
              style={{
                height: 32,
                padding: '0 14px',
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
        </div>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #EEEEEE' }}>
          {devTabs.map((t, i) => (
            <button
              key={i}
              onClick={t.onClick}
              style={{
                height: 36,
                padding: 0,
                border: 'none',
                background: 'transparent',
                boxShadow: t.line,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                font: 'inherit',
                fontSize: 13,
                fontWeight: t.weight,
                color: t.color,
                cursor: 'pointer',
                transition: 'color .33s',
              }}
            >
              {t.label}
              <span
                style={{
                  height: 18,
                  minWidth: 20,
                  padding: '0 6px',
                  borderRadius: 9,
                  background: '#F4F4F4',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#5C5E62',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, padding: '16px 24px 24px' }}>
        <div
          style={{
            width: 180,
            flex: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '10px 8px',
            borderRadius: 12,
            background: '#F4F4F4',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 6px 8px 10px',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#393C41' }}>Groups</span>
            <button
              title="New group"
              style={{
                width: 24,
                height: 24,
                padding: 0,
                border: 'none',
                borderRadius: 5,
                background: 'transparent',
                color: '#5C5E62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              className="hover-bg-e6e7e9"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          {grpList.map((g, i) => (
            <div
              key={i}
              onClick={g.onClick}
              style={{
                height: 32,
                flex: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: `0 10px 0 ${g.pad}`,
                borderRadius: 6,
                background: g.bg,
                fontSize: 13,
                fontWeight: g.weight,
                color: '#171A20',
                cursor: 'default',
                transition: 'background-color .2s',
              }}
              className="hover-bg-ebecee"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={g.iconColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: 'none' }}
              >
                <path d={g.icon} />
              </svg>
              <span
                style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {g.label}
              </span>
              <span style={{ fontSize: 11, color: '#8E8E8E', fontVariantNumeric: 'tabular-nums' }}>{g.count}</span>
            </div>
          ))}
        </div>
        <div ref={devRef} style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 4,
                boxShadow: '0 -16px 0 #FFFFFF',
                height: 36,
                display: 'grid',
                gridTemplateColumns: devCols,
                alignItems: 'center',
                gap: 10,
                padding: '0 12px',
                borderRadius: 6,
                background: '#F4F4F4',
                fontSize: 12,
                fontWeight: 600,
                color: '#5C5E62',
              }}
            >
              <span>Name</span>
              <span>Status</span>
              <span>IP address</span>
              {devWide && (
                <>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Firmware</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Model</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Account</span>
                </>
              )}
              <span />
            </div>
            {devRows.map((r, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  height: 56,
                  display: 'grid',
                  gridTemplateColumns: devCols,
                  alignItems: 'center',
                  gap: 10,
                  padding: '0 12px',
                  borderBottom: '1px solid #EEEEEE',
                  fontSize: 13,
                  color: '#171A20',
                  transition: 'background-color .2s',
                }}
                className="hover-bg-fafafa"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#8E8E8E',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.id} · {r.grpName}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 11,
                      background: r.sBg,
                      color: r.sColor,
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.sDot }} />
                    {r.status}
                  </span>
                </div>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: '#393C41',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.ip}
                </span>
                {devWide && (
                  <>
                    <span
                      style={{
                        color: '#393C41',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.fw}
                    </span>
                    <span
                      style={{
                        color: '#393C41',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.model}
                    </span>
                    <span
                      style={{
                        color: '#393C41',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.account}
                    </span>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={r.onMenu}
                    title="More"
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0,
                      border: 'none',
                      borderRadius: 6,
                      background: r.menuBtnBg,
                      color: '#5C5E62',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background-color .2s',
                    }}
                    className="hover-bg-eeeeee"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </button>
                </div>
                {r.menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 46,
                      zIndex: 6,
                      width: 180,
                      padding: 4,
                      background: '#FFFFFF',
                      borderRadius: 8,
                      boxShadow: '0 0 0 0.5px rgba(0,0,0,.14),0 10px 28px rgba(0,0,0,.14)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <button
                      onClick={r.onLive}
                      style={{
                        height: 32,
                        padding: '0 10px',
                        border: 'none',
                        borderRadius: 5,
                        background: 'transparent',
                        textAlign: 'left',
                        font: 'inherit',
                        fontSize: 13,
                        color: '#171A20',
                        cursor: 'pointer',
                      }}
                      className="hover-bg-f4f4f4"
                    >
                      Open in Live View
                    </button>
                    <button
                      onClick={r.onEdit}
                      style={{
                        height: 32,
                        padding: '0 10px',
                        border: 'none',
                        borderRadius: 5,
                        background: 'transparent',
                        textAlign: 'left',
                        font: 'inherit',
                        fontSize: 13,
                        color: '#171A20',
                        cursor: 'pointer',
                      }}
                      className="hover-bg-f4f4f4"
                    >
                      Edit
                    </button>
                    <div style={{ height: 1, background: '#EEEEEE', margin: '4px 6px' }} />
                    <button
                      onClick={r.onDelete}
                      style={{
                        height: 32,
                        padding: '0 10px',
                        border: 'none',
                        borderRadius: 5,
                        background: 'transparent',
                        textAlign: 'left',
                        font: 'inherit',
                        fontSize: 13,
                        color: '#C62828',
                        cursor: 'pointer',
                      }}
                      className="hover-bg-fceded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            {noRows && (
              <div style={{ padding: '48px 12px', textAlign: 'center', fontSize: 13, color: '#8E8E8E' }}>
                No devices match this filter.
              </div>
            )}
          </div>
        </div>
      </div>
      {menuAny && <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 5 }} />}
      {confirm && <ConfirmDeleteDialog {...confirm} />}
    </>
  );
}
