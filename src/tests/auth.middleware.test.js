import { jest } from "@jest/globals";

// Mock jsonwebtoken and the User model BEFORE importing the middleware,
// so verifyJWT uses our fakes instead of hitting a real DB or secret.
jest.unstable_mockModule("jsonwebtoken", () => ({
    default: {
        verify: jest.fn(),
    },
}));

jest.unstable_mockModule("../models/user.model.js", () => ({
    User: {
        findById: jest.fn(),
    },
}));

const jwt = (await import("jsonwebtoken")).default;
const { User } = await import("../models/user.model.js");
const { verifyJWT } = await import("../middlewares/auth.middleware.js");

function mockReqRes(cookieToken) {
    const req = {
        cookies: { accessToken: cookieToken },
        header: () => undefined,
    };
    const res = {};
    const next = jest.fn();
    return { req, res, next };
}

// asyncHandler (src/utils/asyncHandler.js) doesn't return its internal promise
// chain, so `await verifyJWT(...)` resolves before the handler's own async
// work (e.g. User.findById().select()) finishes. Flush the microtask queue
// before asserting on next().
const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

describe("verifyJWT middleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("calls next() and attaches req.user when the token is valid", async () => {
        const fakeUser = { _id: "user123", username: "varun" };
        jwt.verify.mockReturnValue({ _id: "user123" });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(fakeUser),
        });

        const { req, res, next } = mockReqRes("valid.token.here");
        await verifyJWT(req, res, next);
        await flushMicrotasks();

        expect(jwt.verify).toHaveBeenCalledWith(
            "valid.token.here",
            process.env.ACCESS_TOKEN_SECRET
        );
        expect(req.user).toEqual(fakeUser);
        expect(next).toHaveBeenCalledWith(); // called with no error
    });

    test("throws a 401 ApiError when no token is provided", async () => {
        const { req, res, next } = mockReqRes(undefined);
        await verifyJWT(req, res, next);
        await flushMicrotasks();

        // asyncHandler forwards thrown errors to next(err)
        expect(next).toHaveBeenCalled();
        const errArg = next.mock.calls[0][0];
        expect(errArg.statusCode).toBe(401);
        expect(errArg.message).toBe("Unauthorized request");
    });

    test("propagates a 401 error when the user no longer exists", async () => {
        jwt.verify.mockReturnValue({ _id: "ghost_user" });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        const { req, res, next } = mockReqRes("valid.token.here");
        await verifyJWT(req, res, next);
        await flushMicrotasks();

        expect(next).toHaveBeenCalled();
        const errArg = next.mock.calls[0][0];
        expect(errArg.statusCode).toBe(401);
        expect(errArg.message).toBe("Invalid Access Token");
    });
});