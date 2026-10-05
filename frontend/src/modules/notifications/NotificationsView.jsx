import { useController } from '../../core/mvc';
import { Fragment } from 'react';

export default function NotificationsView({ controller }) {
  const { nEmpty, nFilters, nGroups, nMarkAll } = useController(controller);
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
        <div style={{ fontSize: 20, fontWeight: 600 }}>Notifications</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: '#F4F4F4', borderRadius: 7 }}>
            {nFilters.map((o, i) => (
              <button
                key={i}
                onClick={o.onClick}
                style={{
                  height: 26,
                  padding: '0 10px',
                  border: 'none',
                  borderRadius: 5,
                  background: o.bg,
                  color: o.color,
                  boxShadow: o.shadow,
                  font: 'inherit',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background-color .2s,color .2s',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={nMarkAll}
            style={{
              height: 32,
              padding: '0 6px',
              border: 'none',
              background: 'transparent',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              color: '#3E6AE1',
              cursor: 'pointer',
            }}
            className="hover-color-3457c0"
          >
            Mark all as read
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 24px 24px' }}>
        <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nGroups.map((g, i) => (
            <Fragment key={i}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#5C5E62', padding: '12px 12px 6px' }}>{g.label}</div>
              {g.items.map((n, i1) => (
                <div
                  key={i1}
                  onClick={n.onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: 12,
                    borderRadius: 8,
                    background: n.bg,
                    cursor: 'default',
                    transition: 'background-color .2s',
                  }}
                  className="hover-bg-f4f4f4"
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      flex: 'none',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: 'inset 0 0 0 1px #E6E7E9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={n.iconColor}
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={n.icon} />
                    </svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: n.weight,
                          color: '#171A20',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{ flex: 'none', fontSize: 12, color: '#8E8E8E', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {n.time}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, lineHeight: '18px', color: '#5C5E62' }}>{n.desc}</span>
                    <button
                      onClick={n.onAction}
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: 4,
                        height: 26,
                        padding: '0 10px',
                        border: '1px solid #D0D1D2',
                        borderRadius: 6,
                        background: '#FFFFFF',
                        font: 'inherit',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#171A20',
                        cursor: 'pointer',
                      }}
                      className="hover-bg-f4f4f4"
                    >
                      {n.action}
                    </button>
                  </div>
                  <span
                    style={{ width: 8, height: 8, flex: 'none', marginTop: 6, borderRadius: '50%', background: n.dot }}
                  />
                </div>
              ))}
            </Fragment>
          ))}
          {nEmpty && (
            <div style={{ padding: '64px 12px', textAlign: 'center', fontSize: 13, color: '#8E8E8E' }}>
              You're all caught up.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
