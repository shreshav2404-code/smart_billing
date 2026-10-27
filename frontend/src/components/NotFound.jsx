import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState, Button } from './ui';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      action={<Button onClick={() => navigate('/')}>Back to home</Button>}
      className="mx-auto mt-10 max-w-lg"
    />
  );
};

export default NotFound;
