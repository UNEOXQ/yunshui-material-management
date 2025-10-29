import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
  selectAuth,
  selectUser,
  selectToken,
  selectIsAuthenticated,
} from '../authSlice';
import { mockUser } from '../../../test-utils';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('loginStart', () => {
    it('should set loading to true and clear error', () => {
      const previousState = {
        ...initialState,
        error: 'Previous error',
      };

      const newState = authReducer(previousState, loginStart());

      expect(newState.loading).toBe(true);
      expect(newState.error).toBeNull();
    });
  });

  describe('loginSuccess', () => {
    it('should set user, token, and authentication state', () => {
      const previousState = {
        ...initialState,
        loading: true,
      };

      const payload = {
        user: mockUser,
        token: 'test-token',
      };

      const newState = authReducer(previousState, loginSuccess(payload));

      expect(newState.loading).toBe(false);
      expect(newState.user).toEqual(mockUser);
      expect(newState.token).toBe('test-token');
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.error).toBeNull();
    });
  });

  describe('loginFailure', () => {
    it('should set error and clear authentication state', () => {
      const previousState = {
        ...initialState,
        loading: true,
      };

      const errorMessage = 'Login failed';
      const newState = authReducer(previousState, loginFailure(errorMessage));

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe(errorMessage);
      expect(newState.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should reset all auth state to initial values', () => {
      const previousState = {
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      };

      const newState = authReducer(previousState, logout());

      expect(newState).toEqual(initialState);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      const previousState = {
        ...initialState,
        error: 'Some error',
      };

      const newState = authReducer(previousState, clearError());

      expect(newState.error).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user data when user exists', () => {
      const previousState = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true,
      };

      const updates = {
        email: 'newemail@example.com',
        username: 'newusername',
      };

      const newState = authReducer(previousState, updateUser(updates));

      expect(newState.user).toEqual({
        ...mockUser,
        ...updates,
      });
    });

    it('should not update user when user is null', () => {
      const previousState = initialState;

      const updates = {
        email: 'newemail@example.com',
      };

      const newState = authReducer(previousState, updateUser(updates));

      expect(newState.user).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockState = {
      auth: {
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    };

    it('should select auth state', () => {
      expect(selectAuth(mockState)).toEqual(mockState.auth);
    });

    it('should select user', () => {
      expect(selectUser(mockState)).toEqual(mockUser);
    });

    it('should select token', () => {
      expect(selectToken(mockState)).toBe('test-token');
    });

    it('should select authentication status', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('should handle null user state', () => {
      const nullUserState = {
        auth: {
          ...initialState,
        },
      };

      expect(selectUser(nullUserState)).toBeNull();
      expect(selectToken(nullUserState)).toBeNull();
      expect(selectIsAuthenticated(nullUserState)).toBe(false);
    });
  });
});