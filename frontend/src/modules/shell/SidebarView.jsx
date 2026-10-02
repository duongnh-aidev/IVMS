import { prevented } from '../../core/events';

export default function SidebarView({
  bottomNav,
  collapsed,
  expanded,
  logoBg,
  logoHover,
  logoIn,
  logoOut,
  mainNav,
  navJustify,
  setupNav,
  showMiniLogo,
  sideW,
  toggleSide,
  signOut,
}) {
  return (
    <aside
      style={{
        width: sideW,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: '#F4F4F4',
        borderRight: '1px solid #EEEEEE',
        transition: 'width .33s cubic-bezier(.5,0,0,.75)',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 44, flex: 'none' }} />
      <div
        style={{ height: 40, flex: 'none', display: 'flex', alignItems: 'center', marginBottom: 12, padding: '0 10px' }}
      >
        {expanded && (
          <div
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 10 }}
          >
            <div style={{ fontSize: 26, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.02em', color: '#3E6AE1' }}>
              IVMS
            </div>
            <button
              onClick={toggleSide}
              title="Collapse sidebar"
              style={{
                width: 28,
                height: 28,
                flex: 'none',
                border: 'none',
                background: 'transparent',
                borderRadius: 6,
                color: '#5C5E62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color .33s',
              }}
              className="hover-bg-e6e7e9"
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
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
              </svg>
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={toggleSide}
            onMouseEnter={logoIn}
            onMouseLeave={logoOut}
            title="Open sidebar"
            style={{
              width: 52,
              height: 36,
              margin: '0 auto',
              border: 'none',
              borderRadius: 6,
              background: logoBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color .33s',
            }}
          >
            {showMiniLogo && (
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#3E6AE1' }}>IVMS</span>
            )}
            {logoHover && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#393C41"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
              </svg>
            )}
          </button>
        )}
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px', overflowY: 'auto' }}>
        {mainNav.map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            title={item.label}
            style={{
              height: 34,
              flex: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: navJustify,
              gap: 10,
              padding: '0 10px',
              borderRadius: 6,
              background: item.bg,
              color: item.color,
              fontSize: 13,
              fontWeight: item.weight,
              cursor: 'default',
              whiteSpace: 'nowrap',
              transition: 'background-color .33s,color .33s',
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
              style={{ flex: 'none' }}
            >
              <path d={item.d} />
            </svg>
            {expanded && <span style={{ flex: 1 }}>{item.label}</span>}
          </div>
        ))}
        <div style={{ height: 1, background: '#E2E3E5', margin: '12px 6px' }} />
        {expanded && (
          <div style={{ fontSize: 11, fontWeight: 500, color: '#8E8E8E', padding: '0 10px 6px', whiteSpace: 'nowrap' }}>
            Configuration
          </div>
        )}
        {setupNav.map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            title={item.label}
            style={{
              height: 34,
              flex: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: navJustify,
              gap: 10,
              padding: '0 10px',
              borderRadius: 6,
              background: item.bg,
              color: item.color,
              fontSize: 13,
              fontWeight: item.weight,
              cursor: 'default',
              whiteSpace: 'nowrap',
              transition: 'background-color .33s,color .33s',
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
              style={{ flex: 'none' }}
            >
              <path d={item.d} />
            </svg>
            {expanded && <span style={{ flex: 1 }}>{item.label}</span>}
          </div>
        ))}
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 10 }}>
        {bottomNav.map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            title={item.label}
            style={{
              height: 34,
              flex: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: navJustify,
              gap: 10,
              padding: '0 10px',
              borderRadius: 6,
              background: item.bg,
              color: item.color,
              fontSize: 13,
              fontWeight: item.weight,
              cursor: 'default',
              whiteSpace: 'nowrap',
              transition: 'background-color .33s,color .33s',
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
              style={{ flex: 'none' }}
            >
              <path d={item.d} />
            </svg>
            {expanded && <span style={{ flex: 1 }}>{item.label}</span>}
            {item.showDot && (
              <span
                style={{
                  position: 'absolute',
                  left: 30,
                  top: 7,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#3E6AE1',
                  boxShadow: '0 0 0 2px #F4F4F4',
                }}
              />
            )}
            {item.showBadge && (
              <span
                style={{
                  minWidth: 22,
                  height: 18,
                  padding: '0 6px',
                  borderRadius: 9,
                  background: '#3E6AE1',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.badge}
              </span>
            )}
          </div>
        ))}
        <div style={{ height: 1, background: '#E2E3E5', margin: '6px 6px' }} />
        <a
          href="#/login"
          onClick={prevented(signOut)}
          title="Sign out"
          style={{
            height: 34,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: navJustify,
            gap: 10,
            padding: '0 10px',
            borderRadius: 6,
            color: '#393C41',
            fontSize: 13,
            whiteSpace: 'nowrap',
            transition: 'color .33s',
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
            style={{ flex: 'none' }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {expanded && <span>Sign out</span>}
        </a>
      </div>
    </aside>
  );
}
