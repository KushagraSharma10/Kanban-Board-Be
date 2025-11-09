export type CreateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
  roles?: Array<"admin" | "user">;
};

export type GlobalRole = "admin" | "user";

export type RegisterInput = { fullName: string; email: string; password: string };
export type LoginInput = { email: string; password: string };