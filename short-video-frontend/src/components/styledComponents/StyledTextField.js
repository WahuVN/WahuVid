import { styled, TextField } from "@mui/material";


const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: theme.palette.custom.search,
        },
        '&:hover fieldset': {
            borderColor: theme.palette.custom.search,
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.custom.search,
        },
    },
    '& input:-webkit-autofill': {
        '-webkit-box-shadow': `0 0 0 100px ${theme.palette.background.paper} inset`,
        '-webkit-text-fill-color': theme.palette.text.primary,
    },
    '& input:-webkit-autofill:focus': {
        '-webkit-box-shadow': `0 0 0 100px ${theme.palette.background.paper} inset`,
        '-webkit-text-fill-color': theme.palette.text.primary,
    },
}));

export default StyledTextField;
