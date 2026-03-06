import { RobotAvatar } from './Sidebar.jsx';

export default function DancingRobot({ onDone }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'robot-run 4s linear forwards',
      }}
      onAnimationEnd={onDone}
    >
      <div style={{ animation: 'robot-dance 0.45s ease-in-out infinite' }}>
        <RobotAvatar size={58} loading={true} />
      </div>
    </div>
  );
}
