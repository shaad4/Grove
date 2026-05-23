def set_auth_cookies(response, refresh_token, cookie_name="refresh_token"):

    response.set_cookie(
        key=cookie_name,
        value=str(refresh_token),

        httponly=True,
        secure=False,
        samesite="Lax",

        domain=".lvh.me",
        path="/",

        max_age=60 * 60 * 24 * 7,
    )

    return response