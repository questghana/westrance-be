// API Response Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  companyName: string;
  companyType: string;
  registrationNumber: string;
  administrativeName: string;
}

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  role: string;
  startingDate: Date;
  profileImage: string | null;
  dependents: string | null;
  amountPackage: string;
  benefits: string;
  registrationNumber: string;
  emailAddress: string;
}

export interface CompanySignInResponse {
  message: string;
  data: {
    user: User;
    company: Company;
  };
}

export interface EmployeeSignInResponse {
  message: string;
  data: {
    user: User;
    employee: Employee;
  };
}

export interface ApiResponse<T> {
  message: string;
  data: T;
} 