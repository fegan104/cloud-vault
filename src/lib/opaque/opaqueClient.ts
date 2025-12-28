import * as opaque from "@serenity-kit/opaque";

const ARGON2ID_PARAMS = {
  memory: 131072,
  iterations: 4,
  parallelism: 1,
};

/**
 * Standardizes the client-side OPAQUE registration finalization workflow.
 * This ensures consistent key stretching parameters (Argon2id) across the app.
 */
export function createFinishSignUpRequest(params: opaque.client.FinishRegistrationParams) {
  return opaque.client.finishRegistration({
    ...params,
    keyStretching: {
      "argon2id-custom": ARGON2ID_PARAMS,
    },
  });
}

/**
 * Standardizes the client-side OPAQUE login finalization workflow.
 * This ensures consistent key stretching parameters (Argon2id) across the app.
 */
export function createFinishSignInRequest(params: opaque.client.FinishLoginParams) {
  return opaque.client.finishLogin({
    ...params,
    keyStretching: {
      "argon2id-custom": ARGON2ID_PARAMS,
    },
  });
}
/**
 * Standardizes the client-side OPAQUE registration initiation workflow.
 */
export function createStartSignUpRequest(params: opaque.client.StartRegistrationParams) {
  return opaque.client.startRegistration(params);
}

/**
 * Standardizes the client-side OPAQUE login initiation workflow.
 */
export function createStartSignInRequest(params: opaque.client.StartLoginParams) {
  return opaque.client.startLogin(params);
}
