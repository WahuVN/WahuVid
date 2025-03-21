const UserReducer = (current, action) => {
    switch (action.type) {
        case "login":
            localStorage.setItem("user", JSON.stringify(action.payload));
            return action.payload;
        case "logout":
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            return null;
    }
    return current;
}

export default UserReducer;
