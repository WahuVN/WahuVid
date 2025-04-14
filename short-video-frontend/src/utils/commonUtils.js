export const handleLinkAWS = (url) => {
    if (url) {
        if (url.includes('https://locshortvideo.com')) {
            const newUrl = url.replace(process.env.REACT_APP_OLD_URI, process.env.REACT_APP_NEW_URI);
            return newUrl;
        }
        return url;
    }
    return null;
}