export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {
            userId: user.id,
            role: user.role,
            tokenVersion: user.token_version,
            provider: user.provider,
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, provider: user.provider },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};
