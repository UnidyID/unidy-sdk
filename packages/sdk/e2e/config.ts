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
  internalMatching: "/registration/internal-matching.html",
  oauth: "/oauth",
  newsletter: "/newsletter",
  profile: "/profile",
  profilePartial: "/profile/partial.html",
  ticketable: "/ticketable",
  ticketTransfers: "/ticketable/transfers.html",
  services: "/services",
  transaction: "/transaction",
} as const;
