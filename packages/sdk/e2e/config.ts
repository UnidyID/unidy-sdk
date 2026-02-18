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
  oauth: "/oauth",
  newsletter: "/newsletter",
  profile: "/profile",
  profilePartial: "/profile/partial.html",
  registration: "/auth/registration.html",
  ticketable: "/ticketable",
} as const;
