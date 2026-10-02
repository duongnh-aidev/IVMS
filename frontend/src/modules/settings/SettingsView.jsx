import { usePresenter } from '../../core/viper';

export default function SettingsView({ presenter }) {
  const { setRows, setSecs } = usePresenter(presenter);
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
        <div style={{ fontSize: 20, fontWeight: 600 }}>Settings</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} />
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, padding: '16px 24px 24px' }}>
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
            alignSelf: 'flex-start',
          }}
        >
          {setSecs.map((x, i) => (
            <div
              key={i}
              onClick={x.onClick}
              style={{
                height: 34,
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                borderRadius: 6,
                background: x.bg,
                boxShadow: x.shadow,
                fontSize: 13,
                fontWeight: x.weight,
                color: '#171A20',
                cursor: 'default',
                transition: 'background-color .2s',
              }}
            >
              {x.label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <div
            style={{
              maxWidth: 640,
              borderRadius: 12,
              background: '#F4F4F4',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              padding: '6px 20px',
            }}
          >
            {setRows.map((x, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  padding: '14px 0',
                  borderBottom: `1px solid ${x.line}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>{x.label}</span>
                  <span style={{ fontSize: 12, lineHeight: '17px', color: '#5C5E62' }}>{x.desc}</span>
                </div>
                {x.isToggle && (
                  <button
                    onClick={x.onToggle}
                    style={{
                      width: 34,
                      height: 20,
                      flex: 'none',
                      padding: 2,
                      border: 'none',
                      borderRadius: 10,
                      background: x.track,
                      display: 'flex',
                      justifyContent: x.justify,
                      cursor: 'pointer',
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
                )}
                {x.isSeg && (
                  <div style={{ display: 'flex', gap: 2, padding: 3, background: '#FFFFFF', borderRadius: 7 }}>
                    {x.opts.map((o, i1) => (
                      <button
                        key={i1}
                        onClick={o.onClick}
                        style={{
                          height: 26,
                          padding: '0 10px',
                          border: 'none',
                          borderRadius: 5,
                          background: o.bg,
                          color: o.color,
                          font: 'inherit',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
                {x.isValue && (
                  <span style={{ fontSize: 13, color: '#171A20', fontVariantNumeric: 'tabular-nums' }}>{x.value}</span>
                )}
                {x.isBtn && (
                  <button
                    onClick={x.onBtn}
                    style={{
                      height: 30,
                      padding: '0 12px',
                      border: `1px solid ${x.btnBorder}`,
                      borderRadius: 6,
                      background: '#FFFFFF',
                      font: 'inherit',
                      fontSize: 12,
                      fontWeight: 500,
                      color: x.btnColor,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    className="hover-bg-fafafa"
                  >
                    {x.btn}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
