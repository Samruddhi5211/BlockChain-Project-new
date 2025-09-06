import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const IrisScan = ({ aadhaar, isLogin }) => {
    const webcamRef = useRef(null);
    const [message, setMessage] = useState("");

    const capture = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        const blob = await fetch(imageSrc).then((res) => res.blob());
        const formData = new FormData();
        formData.append("irisImage", blob, "iris.jpg");
        formData.append("aadhaar", aadhaar);

        try {
            const url = isLogin ? "http://localhost:5000/login-iris" : "http://localhost:5000/register-iris";
            const response = await axios.post(url, formData);
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response?.data?.error || "Iris scan failed.");
        }
    };

    return (
        <div>
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
            <button onClick={capture}>{isLogin ? "Login with Iris" : "Register Iris"}</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default IrisScan;