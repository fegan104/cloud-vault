import * as opaque from "@serenity-kit/opaque";

function getServerSetup(): string {
  const setup = process.env.OPAQUE_SERVER_SETUP;
  if (!setup) {
    throw new Error(
      "OPAQUE_SERVER_SETUP environment variable is not set. " +
      "Generate one with: npx @serenity-kit/opaque@latest create-server-setup"
    );
  }
  return setup;
}

/**
 * Creates a registration response for the OPAQUE registration flow.
 * This is step 2 of 3 in the registration process (server-side).
 * 
 * @param userIdentifier - The user's email address
 * @param registrationRequest - The registration request from the client
 * @returns The registration response to send back to the client
 */
export async function createSignUpResponse(
  userIdentifier: string,
  registrationRequest: string
): Promise<string> {
  await opaque.ready;
  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: getServerSetup(),
    userIdentifier,
    registrationRequest,
  });
  return registrationResponse;
}

/**
 * Starts the OPAQUE login flow on the server.
 * This is step 2 of 4 in the login process (server-side).
 * 
 * @param userIdentifier - The user's email address
 * @param registrationRecord - The stored registration record for this user
 * @param startLoginRequest - The login request from the client
 * @returns The login response and server state (state must be stored temporarily)
 */
export async function createSignInResponse(
  userIdentifier: string,
  registrationRecord: string,
  startLoginRequest: string
): Promise<{ loginResponse: string; serverLoginState: string }> {
  await opaque.ready;
  const { loginResponse, serverLoginState } = opaque.server.startLogin({
    userIdentifier,
    registrationRecord,
    serverSetup: getServerSetup(),
    startLoginRequest,
  });
  return { loginResponse, serverLoginState };
}

/**
 * Finishes the OPAQUE login flow on the server.
 * This is step 4 of 4 in the login process (server-side).
 * 
 * @param serverLoginState - The server state from startLogin
 * @param finishLoginRequest - The finish login request from the client
 * @returns The session key if successful, null if login failed
 */
export async function finishSignIn(
  serverLoginState: string,
  finishLoginRequest: string
): Promise<string | null> {
  try {
    await opaque.ready;
    const { sessionKey } = opaque.server.finishLogin({
      finishLoginRequest,
      serverLoginState,
    });
    return sessionKey;
  } catch {
    return null;
  }
}
