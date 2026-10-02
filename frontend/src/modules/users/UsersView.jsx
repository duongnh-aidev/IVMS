import { useLayoutEffect, useRef } from 'react';
import { usePresenter } from '../../core/viper';

export default function UsersView({ presenter }) {
  const {
    uAdd,
    uLog,
    uLogFilters,
    uPerms,
    uRoleList,
    uRoleName,
    uRows,
    uScope,
    uTabLog,
    uTabRoles,
    uTab,
    uTabUsers,
    uTabs,
  } = usePresenter(presenter);
  // Each tab starts scrolled to the top.
  const uScrollRef = useRef(null);
  useLayoutEffect(() => {
    if (uScrollRef.current) uScrollRef.current.scrollTop = 0;
  }, [uTab]);
  return (
    <>
      <header style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 24px 0' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Users</div>
          {uTabUsers && (
            <button
              onClick={uAdd}
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
              Add user
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #EEEEEE' }}>
          {uTabs.map((t, i) => (
            <button
              key={i}
              onClick={t.onClick}
              style={{
                height: 36,
                padding: 0,
                border: 'none',
                background: 'transparent',
                boxShadow: t.line,
                font: 'inherit',
                fontSize: 13,
                fontWeight: t.weight,
                color: t.color,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <div ref={uScrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px 24px' }}>
        {uTabUsers && (
          <>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                boxShadow: '0 -16px 0 #FFFFFF',
                height: 36,
                display: 'grid',
                gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1.4fr) 92px minmax(0,1fr)',
                gap: 12,
                alignItems: 'center',
                padding: '0 12px',
                borderRadius: 6,
                background: '#F4F4F4',
                fontSize: 12,
                fontWeight: 600,
                color: '#5C5E62',
              }}
            >
              <span>Name</span>
              <span>Role</span>
              <span>Camera access</span>
              <span>Status</span>
              <span>Last sign-in</span>
            </div>
            {uRows.map((u, i) => (
              <div
                key={i}
                style={{
                  height: 56,
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1.4fr) 92px minmax(0,1fr)',
                  gap: 12,
                  alignItems: 'center',
                  padding: '0 12px',
                  borderBottom: '1px solid #EEEEEE',
                  fontSize: 13,
                }}
                className="hover-bg-fafafa"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      flex: 'none',
                      borderRadius: '50%',
                      background: '#E4E5E8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#393C41',
                    }}
                  >
                    {u.initials}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span
                      style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {u.name}
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
                      {u.login}
                    </span>
                  </div>
                </div>
                <span style={{ color: '#393C41' }}>{u.role}</span>
                <span style={{ color: '#393C41', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.access}
                </span>
                <div>
                  <span
                    style={{
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 11,
                      background: u.sBg,
                      color: u.sColor,
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {u.status}
                  </span>
                </div>
                <span
                  style={{
                    color: '#5C5E62',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {u.last}
                </span>
              </div>
            ))}
          </>
        )}
        {uTabRoles && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 180,
                flex: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: 8,
                borderRadius: 12,
                background: '#F4F4F4',
              }}
            >
              {uRoleList.map((r, i) => (
                <div
                  key={i}
                  onClick={r.onClick}
                  style={{
                    height: 44,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 2,
                    padding: '0 10px',
                    borderRadius: 6,
                    background: r.bg,
                    cursor: 'default',
                  }}
                  className="hover-bg-ebecee"
                >
                  <span style={{ fontSize: 13, fontWeight: r.weight, color: '#171A20' }}>{r.name}</span>
                  <span style={{ fontSize: 12, color: '#8E8E8E' }}>{r.count}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  borderRadius: 12,
                  background: '#F4F4F4',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Permissions · {uRoleName}</span>
                {uPerms.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      minHeight: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderBottom: '1px solid #E6E7E9',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: '#171A20' }}>{p.label}</span>
                      <span style={{ fontSize: 12, color: '#5C5E62' }}>{p.desc}</span>
                    </div>
                    <button
                      onClick={p.onClick}
                      disabled={p.locked}
                      title={p.title}
                      style={{
                        width: 34,
                        height: 20,
                        flex: 'none',
                        padding: 2,
                        border: 'none',
                        borderRadius: 10,
                        background: p.track,
                        display: 'flex',
                        justifyContent: p.justify,
                        cursor: 'pointer',
                        opacity: p.opacity,
                        transition: 'background-color .2s',
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <div
                style={{
                  borderRadius: 12,
                  background: '#F4F4F4',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>Camera access</span>
                <span style={{ fontSize: 12, color: '#5C5E62', marginBottom: 4 }}>
                  Users with this role only see devices in the selected groups.
                </span>
                {uScope.map((g, i) => (
                  <div
                    key={i}
                    onClick={g.onClick}
                    style={{
                      height: 30,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingLeft: g.pad,
                      fontSize: 13,
                      color: '#171A20',
                      cursor: 'default',
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        flex: 'none',
                        borderRadius: 4,
                        border: `1px solid ${g.border}`,
                        background: g.box,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {g.on && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                    </span>
                    <span>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {uTabLog && (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
              {uLogFilters.map((f, i) => (
                <button
                  key={i}
                  onClick={f.onClick}
                  style={{
                    height: 26,
                    padding: '0 12px',
                    border: 'none',
                    borderRadius: 13,
                    background: f.bg,
                    color: f.color,
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                boxShadow: '0 -16px 0 #FFFFFF',
                height: 36,
                display: 'grid',
                gridTemplateColumns: '96px minmax(0,.8fr) minmax(0,2fr) 104px',
                gap: 12,
                alignItems: 'center',
                padding: '0 12px',
                borderRadius: 6,
                background: '#F4F4F4',
                fontSize: 12,
                fontWeight: 600,
                color: '#5C5E62',
              }}
            >
              <span>Time</span>
              <span>User</span>
              <span>Event</span>
              <span>IP address</span>
            </div>
            {uLog.map((l, i) => (
              <div
                key={i}
                style={{
                  minHeight: 56,
                  display: 'grid',
                  gridTemplateColumns: '96px minmax(0,.8fr) minmax(0,2fr) 104px',
                  gap: 12,
                  alignItems: 'center',
                  padding: '0 12px',
                  borderBottom: '1px solid #EEEEEE',
                  fontSize: 13,
                }}
              >
                <span style={{ color: '#5C5E62', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {l.time}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.user}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, padding: '8px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, fontWeight: 500 }}>
                    <span style={{ width: 6, height: 6, flex: 'none', borderRadius: '50%', background: l.dot }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.action}
                    </span>
                  </span>
                  <span
                    style={{
                      paddingLeft: 14,
                      fontSize: 12,
                      color: '#5C5E62',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.target}
                  </span>
                </div>
                <span
                  style={{
                    color: '#5C5E62',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {l.ip}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
