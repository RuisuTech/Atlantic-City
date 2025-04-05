
// This file redirects imports to the AuthContext for backward compatibility
import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export const useAuth = useAuthContext;
export default useAuth;
