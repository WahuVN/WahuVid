import { Facebook, Google } from "@mui/icons-material"
import { Button } from "@mui/material"

const getOauthGoogleUrl = () => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    const options = {
        redirect_uri: 'http://localhost:3000/',
        client_id: '742649047463-3ggr1prdl3hu2js43aia12d08dkfs9pn.apps.googleusercontent.com',
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ].join(' ')
    }
    const qs = new URLSearchParams(options)
    console.log(`${rootUrl}?${qs.toString()}`)
    return `${rootUrl}?${qs.toString()}`
}

const OAuth2 = ({ handleLoginWithOAuth2Succes }) => {
    const oauthURL = getOauthGoogleUrl();

    const handleGoogleLogin = (e) => {
        e.preventDefault();
        console.log(oauthURL);
        window.location.href = oauthURL;
    }

    return (
        <>
            <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={handleGoogleLogin}
                sx={{ mb: 1 }}
            >
                Tiếp tục với Google
            </Button>
            {/* <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                // onClick={handleFacebookLogin}
                sx={{ mb: 1 }}
            >
                Tiếp tục với Facebook
            </Button> */}
        </>
    );
};

export default OAuth2;
