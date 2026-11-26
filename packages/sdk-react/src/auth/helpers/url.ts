const SIGN_IN_ID_PARAMS = ["sdk_login_sid", "sid"] as const;

/** Reads the sign-in ID a backend redirect added to the URL, preferring `sdk_login_sid` over the legacy `sid`. */
export function readSignInId(params: URLSearchParams): string | null {
  return params.get("sdk_login_sid") || params.get("sid");
}

/** Deletes both sign-in ID parameters from `url`. Returns whether anything was removed. */
export function deleteSignInIdParams(url: URL): boolean {
  let changed = false;
  for (const param of SIGN_IN_ID_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }
  return changed;
}

export function extractSidFromUrl(): string | null {
  const url = new URL(window.location.href);
  const sid = readSignInId(url.searchParams);
  if (deleteSignInIdParams(url)) {
    window.history.replaceState({}, "", url.toString());
  }
  return sid;
}
