import { usePresenter } from '../../core/viper';

export default function SystemMonitorView({ presenter }) {
  const {
    cpuBig,
    cpuColor,
    cpuMini,
    cpuNow,
    cpuSub,
    downBig,
    downNow,
    downSub,
    memBig,
    memMini,
    memNow,
    memSub,
    sysBtnBg,
    sysOpen,
    toggleSys,
    upBig,
    upNow,
    upSub,
  } = usePresenter(presenter);
  return (
    <div
      style={{
        position: 'relative',
        height: 30,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 16px 0 24px',
        borderTop: '1px solid #EEEEEE',
        background: '#FFFFFF',
        fontSize: 12,
        color: '#5C5E62',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'visible',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2EA44F', flex: 'none' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Connected · 192.168.1.10</span>
      </div>
      <div style={{ flex: 1 }} />
      <button
        onClick={toggleSys}
        title="System monitor"
        style={{
          height: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 8px',
          border: 'none',
          borderRadius: 5,
          background: sysBtnBg,
          font: 'inherit',
          fontSize: 12,
          color: '#5C5E62',
          cursor: 'pointer',
          transition: 'background-color .2s',
        }}
        className="hover-bg-f4f4f4"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>CPU</span>
          <span style={{ width: 30, textAlign: 'right', color: cpuColor, fontWeight: 500 }}>{cpuNow}</span>
          <div style={{ height: 14, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            {cpuMini.map((b, i) => (
              <div key={i} style={{ width: 2, height: b.h, background: b.bg, borderRadius: 1 }} />
            ))}
          </div>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Memory</span>
          <span style={{ fontWeight: 500, color: '#171A20' }}>{memNow}</span>
          <div style={{ height: 14, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            {memMini.map((b, i) => (
              <div key={i} style={{ width: 2, height: b.h, background: b.bg, borderRadius: 1 }} />
            ))}
          </div>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Network</span>
          <span style={{ color: '#171A20', fontWeight: 500 }}>↓ {downNow}</span>
          <span style={{ color: '#171A20', fontWeight: 500 }}>↑ {upNow}</span>
        </span>
      </button>
      {sysOpen && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: 36,
            zIndex: 8,
            width: 340,
            padding: 16,
            background: '#FFFFFF',
            borderRadius: 10,
            boxShadow: '0 0 0 0.5px rgba(0,0,0,.14),0 14px 36px rgba(0,0,0,.16)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            whiteSpace: 'normal',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#171A20' }}>System monitor</span>
            <span style={{ fontSize: 11, color: '#8E8E8E' }}>Last 60 s · live</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: '#171A20' }}>CPU</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: '#393C41' }}>
                {cpuNow} <span style={{ color: '#8E8E8E' }}>{cpuSub}</span>
              </span>
            </div>
            <div
              style={{
                height: 44,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                padding: 4,
                background: '#F4F4F4',
                borderRadius: 6,
              }}
            >
              {cpuBig.map((b, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, height: b.h, background: b.bg, borderRadius: 1 }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: '#171A20' }}>Memory</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: '#393C41' }}>
                {memNow} <span style={{ color: '#8E8E8E' }}>{memSub}</span>
              </span>
            </div>
            <div
              style={{
                height: 44,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                padding: 4,
                background: '#F4F4F4',
                borderRadius: 6,
              }}
            >
              {memBig.map((b, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, height: b.h, background: b.bg, borderRadius: 1 }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: '#171A20' }}>Network in</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: '#393C41' }}>
                {downNow} <span style={{ color: '#8E8E8E' }}>{downSub}</span>
              </span>
            </div>
            <div
              style={{
                height: 44,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                padding: 4,
                background: '#F4F4F4',
                borderRadius: 6,
              }}
            >
              {downBig.map((b, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, height: b.h, background: b.bg, borderRadius: 1 }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: '#171A20' }}>Network out</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: '#393C41' }}>
                {upNow} <span style={{ color: '#8E8E8E' }}>{upSub}</span>
              </span>
            </div>
            <div
              style={{
                height: 44,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                padding: 4,
                background: '#F4F4F4',
                borderRadius: 6,
              }}
            >
              {upBig.map((b, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, height: b.h, background: b.bg, borderRadius: 1 }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
