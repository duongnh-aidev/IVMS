import { useController } from '../../core/mvc';
import SidebarView from './SidebarView';
import ToastView from './ToastView';

/**
 * Main window: fills the browser or desktop window (the OS draws the window frame).
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
        height: '100vh',
        minWidth: 1024,
        minHeight: 640,
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        background: '#FFFFFF',
        color: '#171A20',
      }}
    >
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
  );
}
