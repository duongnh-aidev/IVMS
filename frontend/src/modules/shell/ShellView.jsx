import { useController } from '../../core/mvc';
import SidebarView from './SidebarView';
import ToastView from './ToastView';

const trafficLight = (bg) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: bg,
  boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.15)',
});

/**
 * Main window frame.
 * @param screens   screen key -> bound module view (from the container)
 * @param statusBar bound system-monitor view
 * @param overlays  bound views rendered above every screen (e.g. the device editor)
 */
export default function ShellView({ controller, screens, statusBar: StatusBar, overlays = [] }) {
  const { active, sidebar, toast } = useController(controller);
  const Screen = screens[active];
  return (
    <div
      style={{
        minWidth: 1328,
        minHeight: 848,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#E8E9EB',
      }}
    >
      <div
        style={{
          width: '100%',
          minWidth: 1280,
          maxWidth: 1600,
          height: '100%',
          minHeight: 800,
          maxHeight: 1000,
          flex: 'none',
          position: 'relative',
          display: 'flex',
          background: '#FFFFFF',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.18),0 22px 50px rgba(0,0,0,.18),0 6px 14px rgba(0,0,0,.06)',
          color: '#171A20',
        }}
      >
        <div style={{ position: 'absolute', left: 20, top: 18, zIndex: 2, display: 'flex', gap: 8 }}>
          <div style={trafficLight('#FF5F57')} />
          <div style={trafficLight('#FEBC2E')} />
          <div style={trafficLight('#28C840')} />
        </div>
        <SidebarView {...sidebar} />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
          <Screen />
          <StatusBar />
          {overlays.map((Overlay, i) => (
            <Overlay key={i} />
          ))}
          {toast && <ToastView {...toast} />}
        </main>
      </div>
    </div>
  );
}
