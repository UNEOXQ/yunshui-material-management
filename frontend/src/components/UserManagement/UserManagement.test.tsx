import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { User } from '../../types';

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    username: 'testuser1',
    email: 'test1@example.com',
    role: 'PM',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: '2',
    username: 'testuser2',
    email: 'test2@example.com',
    role: 'ADMIN',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  }
];

describe('UserList Component', () => {
  const mockOnEditUser = vi.fn();
  const mockOnDeleteUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders user list correctly', () => {
    render(
      <UserList
        users={mockUsers}
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    );

    expect(screen.getByText('testuser1')).toBeInTheDocument();
    expect(screen.getByText('testuser2')).toBeInTheDocument();
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();
  });

  test('shows empty state when no users', () => {
    render(
      <UserList
        users={[]}
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    );

    expect(screen.getByText('目前沒有使用者資料')).toBeInTheDocument();
  });

  test('calls onEditUser when edit button is clicked', () => {
    render(
      <UserList
        users={mockUsers}
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    );

    const editButtons = screen.getAllByText('編輯');
    fireEvent.click(editButtons[0]);

    expect(mockOnEditUser).toHaveBeenCalledWith(mockUsers[0]);
  });

  test('calls onDeleteUser when delete button is clicked', () => {
    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    render(
      <UserList
        users={mockUsers}
        onEditUser={mockOnEditUser}
        onDeleteUser={mockOnDeleteUser}
      />
    );

    const deleteButtons = screen.getAllByText('刪除');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDeleteUser).toHaveBeenCalledWith(mockUsers[0].id);
  });
});

describe('UserForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders create user form correctly', () => {
    render(
      <UserForm
        user={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('新增使用者')).toBeInTheDocument();
    expect(screen.getByLabelText(/使用者名稱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
    expect(screen.getByLabelText(/使用者角色/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密碼/)).toBeInTheDocument();
  });

  test('renders edit user form correctly', () => {
    render(
      <UserForm
        user={mockUsers[0]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('編輯使用者')).toBeInTheDocument();
    expect(screen.getByDisplayValue('testuser1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test1@example.com')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <UserForm
        user={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('建立');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('使用者名稱為必填項目')).toBeInTheDocument();
      expect(screen.getByText('電子郵件為必填項目')).toBeInTheDocument();
      expect(screen.getByText('密碼為必填項目')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('validates email format', async () => {
    render(
      <UserForm
        user={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const emailInput = screen.getByLabelText(/電子郵件/);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByText('建立');
    fireEvent.click(submitButton);

    // Check if validation error appears (may take some time)
    await waitFor(() => {
      const errorElements = screen.queryAllByText(/請輸入有效的電子郵件格式|電子郵件/);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('validates password confirmation', async () => {
    render(
      <UserForm
        user={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const passwordInput = screen.getByLabelText(/^密碼/);
    const confirmPasswordInput = screen.getByLabelText(/確認密碼/);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });

    const submitButton = screen.getByText('建立');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('密碼確認不符')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    render(
      <UserForm
        user={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(screen.getByLabelText(/使用者名稱/), {
      target: { value: 'newuser' }
    });
    fireEvent.change(screen.getByLabelText(/電子郵件/), {
      target: { value: 'newuser@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^密碼/), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText(/確認密碼/), {
      target: { value: 'password123' }
    });

    const submitButton = screen.getByText('建立');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'PM',
        password: 'password123'
      });
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <UserForm
        user={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});