import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

describe("User model - password hashing", () => {
    test("isPasswordCorrect returns true for the correct password", async () => {
        const user = new User({
            username: "testuser",
            email: "test@example.com",
            fullName: "Test User",
            password: await bcrypt.hash("mySecret123", 10),
            avatar: "http://example.com/avatar.jpg",
        });

        const isMatch = await user.isPasswordCorrect("mySecret123");
        expect(isMatch).toBe(true);
    });

    test("isPasswordCorrect returns false for an incorrect password", async () => {
        const user = new User({
            username: "testuser2",
            email: "test2@example.com",
            fullName: "Test User Two",
            password: await bcrypt.hash("correctPassword", 10),
            avatar: "http://example.com/avatar.jpg",
        });

        const isMatch = await user.isPasswordCorrect("wrongPassword");
        expect(isMatch).toBe(false);
    });
});

describe("User model - JWT generation", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        process.env = {
            ...OLD_ENV,
            ACCESS_TOKEN_SECRET: "test_access_secret",
            ACCESS_TOKEN_EXPIRES_IN: "1d",
            REFRESH_TOKEN_SECRET: "test_refresh_secret",
            REFRESH_TOKEN_EXPIRES_IN: "10d",
        };
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });

    test("generateAccessToken returns a valid JWT containing the user's id and email", () => {
        const user = new User({
            username: "tokenuser",
            email: "token@example.com",
            fullName: "Token User",
            password: "irrelevant",
            avatar: "http://example.com/avatar.jpg",
        });

        const token = user.generateAccessToken();
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        expect(decoded._id).toBe(String(user._id));
        expect(decoded.email).toBe("token@example.com");
        expect(decoded.username).toBe("tokenuser");
    });

    test("generateRefreshToken returns a valid JWT containing only the user's id", () => {
        const user = new User({
            username: "tokenuser2",
            email: "token2@example.com",
            fullName: "Token User Two",
            password: "irrelevant",
            avatar: "http://example.com/avatar.jpg",
        });

        const token = user.generateRefreshToken();
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        expect(decoded._id).toBe(String(user._id));
        expect(decoded.email).toBeUndefined();
    });
});