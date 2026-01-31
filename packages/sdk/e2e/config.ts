export class UserLogin {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly role: "user",
  ) {}
}

export const userLogin = new UserLogin("user@example.com", "Ch4ngeme!", "user");

export const routes = {
  home: "/",
  auth: "/auth",
  newsletter: "/newsletter",
  profile: "/auth/profile.html",
  ticketable: "/ticketable",
} as const;
