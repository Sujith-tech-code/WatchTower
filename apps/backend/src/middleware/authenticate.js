import { verifyAccessToken } from "../lib/jwt.js";

/**
 * authenticate — middleware to protect routes that require a logged-in user.
 *
 * How it works:
 *  1. Reads the Authorization header: "Bearer <token>"
 *  2. Verifies the JWT signature and expiry
 *  3. Attaches the decoded user payload to req.user
 *  4. Calls next() so the actual route handler can run
 *
 * If anything fails, it responds 401 and the route handler never runs.
 *
 * Usage in a route file:
 *   import { authenticate } from "../middleware/authenticate.js";
 *   router.get("/protected", authenticate, myController);
 */
export function authenticate(req, res, next) {
  // 1. Get the Authorization header value (e.g. "Bearer eyJhbGci...")
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access token required. Add 'Authorization: Bearer <token>' header.",
    });
  }

  // 2. Extract just the token part (everything after "Bearer ")
  const token = authHeader.slice(7); // "Bearer ".length === 7

  try {
    // 3. Verify the token — throws if expired or tampered with
    const decoded = verifyAccessToken(token);

    // 4. Attach the decoded payload to req so route handlers can use it
    //    decoded will have: { id, email, role, iat, exp }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next(); // token is valid — proceed to the route handler
  } catch (err) {
    // jwt.verify throws "TokenExpiredError" or "JsonWebTokenError"
    const message =
      err.name === "TokenExpiredError"
        ? "Access token has expired. Please refresh."
        : "Invalid access token.";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}
