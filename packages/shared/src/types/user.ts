export type UserRole = "admin" | "commerciale" | "operativo";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
