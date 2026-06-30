export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  studentId?: string;
  nationalId?: string;
  phone?: string;
  major?: string;
  semester?: number;
  department?: string;
  employeeId?: string;
}