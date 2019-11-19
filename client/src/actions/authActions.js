import axios from "axios";
import { setAuthToken } from "../utils/setAuthToken";

import { GET_ERRORS } from "./types";

// Register USer
export const registerUser = (userData, history) => dispatch => {
  axios
    .post("/api/users/register", userData)
    .then(res => history.push("/login"))
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};


