import MainLayout from '../components/MainLayout';
import LabPage from './lab/LabPage';
import '../styles/mmh.css';

interface LabProps {
  onLogout?: () => void;
}

const Lab: React.FC<LabProps> = ({ onLogout }) => {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <LabPage />
    </div>
  );
};

export default Lab;
